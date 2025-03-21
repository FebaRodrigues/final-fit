// controllers/userController.js
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { uploadToCloudinary } = require('../utilities/imageUpload');
const { createWelcomeNotification } = require('./notificationController');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Default profile image URL
const DEFAULT_PROFILE_IMAGE = "https://res.cloudinary.com/daacjyk3d/image/upload/v1740376690/fitnessApp/gfo0vamcfcurte2gc4jk.jpg";

// Function to save image locally as a fallback when Cloudinary fails
const saveImageLocally = async (file) => {
    try {
        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(__dirname, '../public/uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        // Generate a unique filename
        const filename = `${Date.now()}-${path.basename(file).replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const destPath = path.join(uploadsDir, filename);
        
        // Copy the file
        fs.copyFileSync(file, destPath);
        
        // Return the relative URL
        return `/uploads/${filename}`;
    } catch (error) {
        console.error('Error saving image locally:', error);
        return null;
    }
};

// Register a new user
const register = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create a new user
        user = new User({
            name,
            email,
            password,
            imageUrl: DEFAULT_PROFILE_IMAGE
        });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Save user to database
        await user.save();

        // Create a welcome notification
        await createWelcomeNotification(user._id);

        // Create and return token
        const payload = {
            id: user.id,
            role: 'user'
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '30d' }
        );

        res.status(201).json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: 'user',
                imageUrl: user.imageUrl
            }
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: error.message });
    }
};

// Login user
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        console.log(`Login attempt for email: ${email}`);
        
        // Start with a lean query for better performance
        const user = await User.findOne({ email })
            .select('+password') // Explicitly include password field
            .lean()
            .maxTimeMS(5000) // Set 5 second timeout for the query 
            .exec();
        
        if (!user) {
            console.log(`Login failed: No user found with email ${email}`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log(`Login failed: Password mismatch for ${email}`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Update last login time (use findByIdAndUpdate to avoid another fetch)
        try {
            await User.findByIdAndUpdate(
                user._id, 
                { lastLogin: new Date() },
                { new: false, useFindAndModify: false }
            ).exec();
        } catch (updateError) {
            // Non-critical error, just log it but continue with login
            console.error(`Failed to update last login time for ${email}:`, updateError.message);
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );
        
        // Return user data without password
        const { password: _, ...userData } = user;
        
        console.log(`Login successful for ${email}`);
        return res.status(200).json({
            token,
            user: userData
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ 
            error: error.message || 'Login failed due to server error',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Get all users
const getAllUsers = async (req, res) => {
    try {
        console.log('Getting all users');
        const users = await User.find().select('-password');
        console.log(`Found ${users.length} users`);
        return res.status(200).json(users);
    } catch (error) {
        console.error('Error getting all users:', error);
        return res.status(500).json({ error: error.message || 'Error retrieving users' });
    }
};

// Get a user by ID
const getUserById = async (req, res) => {
    try {
        // Safely extract userId with validation
        const userId = req.params.userId || req.user?.id;
        
        // Handle case where userId is missing or invalid
        if (!userId) {
            console.error('getUserById: Missing userId in request');
            return res.status(400).json({ error: 'User ID is required' });
        }
        
        // Validate that userId is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            console.error(`getUserById: Invalid userId format: ${userId}`);
            return res.status(400).json({ error: 'Invalid user ID format' });
        }
        
        console.log(`Getting user with ID: ${userId}`);
        
        // Use lean() for better performance in read-only operations
        const user = await User.findById(userId)
            .select('-password')
            .lean()
            .exec();
        
        if (!user) {
            console.error(`User not found with ID: ${userId}`);
            return res.status(404).json({ error: 'User not found' });
        }
        
        console.log(`Found user: ${user.name}`);
        return res.status(200).json(user);
    } catch (error) {
        console.error('Error getting user by ID:', error);
        return res.status(500).json({ error: error.message || 'Error retrieving user' });
    }
};

// Update a user or current user
const updateUser = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(`Updating user profile for user ${userId}`);
        console.log(`Request body fields:`, Object.keys(req.body));

        // Check if we received a direct image URL in the body (from Cloudinary)
        if (req.body.image && typeof req.body.image === 'string' && req.body.image.includes('cloudinary.com')) {
            console.log('Received Cloudinary image URL in request body:', req.body.image);
            // No need to upload, the URL is already set in req.body.image
        }
        // Check if we received an image file
        else if (req.file) {
            console.log(`Image file received: ${req.file.originalname} (${req.file.size} bytes, ${req.file.mimetype})`);
            
            // Validate file size (max 5MB) - redundant but safe check
            if (req.file.size > 5 * 1024 * 1024) {
                return res.status(400).json({ error: 'Image size must be less than 5MB' });
            }
            
            // Check file type - redundant but safe check
            const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
            if (!allowedMimeTypes.includes(req.file.mimetype)) {
                return res.status(400).json({ error: 'Please upload a valid image file (JPEG, PNG or GIF)' });
            }
            
            try {
                // Try to upload to Cloudinary with enhanced error handling
                console.log('Attempting to upload image to Cloudinary...');
                const cloudinaryResult = await uploadToCloudinary(req.file.path);
                console.log('Cloudinary upload successful:', cloudinaryResult);
                
                // Set both image and imageUrl in the request body for compatibility
                const imageUrl = cloudinaryResult.url || cloudinaryResult;
                req.body.imageUrl = imageUrl;
                req.body.image = imageUrl;
                
                // Log the image URL to be saved
                console.log(`Setting user profile image URL to: ${imageUrl}`);
                
            } catch (uploadError) {
                console.error('Cloudinary upload failed:', uploadError);
                
                // Different error messages based on error type
                if (uploadError.code === 'ENOTFOUND' || uploadError.code === 'ETIMEDOUT') {
                    return res.status(503).json({ error: 'Image upload service is currently unavailable, please try again later' });
                } else if (uploadError.http_code === 400) {
                    return res.status(400).json({ error: 'Invalid image format or corrupt file' });
                } else if (uploadError.message && uploadError.message.includes('File size too large')) {
                    return res.status(400).json({ error: 'Image size must be less than 5MB' });
                } else {
                    // Generic error with server-side logging
                    console.error('Full upload error details:', uploadError);
                    return res.status(500).json({ error: 'Failed to upload image, please try again later' });
                }
            } finally {
                // Always clean up the temporary file
                fs.unlink(req.file.path, (err) => {
                    if (err) console.error(`Failed to delete temporary file ${req.file.path}:`, err);
                    else console.log(`Cleaned up temporary file: ${req.file.path}`);
                });
            }
        } else {
            console.log('No image received in the request');
        }

        // Update the user profile with all fields from the request body
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: req.body },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Ensure the response contains both image fields for compatibility
        const responseData = updatedUser.toObject();
        if (responseData.image) {
            responseData.imageUrl = responseData.image;  // Add imageUrl field to response
        }

        console.log(`User profile updated successfully for ID: ${userId}`);
        return res.status(200).json(responseData);
    } catch (error) {
        console.error('Error updating user profile:', error);
        return res.status(500).json({ error: error.message || 'Error updating user profile' });
    }
};

// Delete a user by ID
const deleteUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        console.log(`Deleting user with ID: ${userId}`);
        
        const user = await User.findByIdAndDelete(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        console.log(`Deleted user: ${user.name}`);
        return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({ error: error.message || 'Error deleting user' });
    }
};

// Get confirmed appointments for user
const getConfirmedAppointments = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(`Getting confirmed appointments for user ${userId}`);
        
        const appointments = await Appointment.find({
            userId: userId,
            status: 'confirmed'
        }).populate('trainerId', 'name');
        
        console.log(`Found ${appointments.length} confirmed appointments`);
        return res.status(200).json(appointments);
    } catch (error) {
        console.error('Error getting confirmed appointments:', error);
        return res.status(500).json({ error: error.message || 'Error retrieving appointments' });
    }
};

// Update specific user fields
const updateUserFields = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(`Updating user fields for user ${userId}`);
        console.log(`Request body fields:`, req.body);

        // Update the user profile with the fields from the request body
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: req.body },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        console.log(`User fields updated successfully for ID: ${userId}`);
        return res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Error updating user fields:', error);
        return res.status(500).json({ error: error.message || 'Error updating user fields' });
    }
};

// Controller method to get user profile
const getProfile = async (req, res) => {
    // Set CORS headers explicitly for this critical endpoint
    const origin = req.headers.origin;
    if (origin && (origin.includes('vercel.app') || origin.includes('localhost'))) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
    }
    
    try {
        const userId = req.user.id;
        console.log(`Getting profile for user ${userId}`);
        
        try {
            // First try mongoose
            const user = await User.findById(userId).select('-password');
            
            if (!user) {
                console.log(`User not found in database: ${userId}`);
                return res.status(404).json({ error: 'User not found' });
            }
            
            console.log(`Retrieved profile for user ${userId} using mongoose`);
            return res.status(200).json(user);
            
        } catch (mongooseError) {
            console.warn(`Mongoose query failed for profile: ${mongooseError.message}`);
            console.log('Trying direct MongoDB client as fallback');
            
            try {
                // Get the direct MongoDB client
                const { getDb } = require('../config/db');
                const db = getDb();
                
                // Convert string ID to ObjectId
                const { ObjectId } = require('mongodb');
                let userIdObj;
                
                try {
                    userIdObj = new ObjectId(userId);
                } catch (idError) {
                    console.error('Error converting userId to ObjectId:', idError);
                    userIdObj = userId; // fallback to string ID
                }
                
                // Find the user with the direct client
                const user = await db.collection('users').findOne({ _id: userIdObj });
                
                if (!user) {
                    console.log(`No user found with ID: ${userId}`);
                    return res.status(404).json({ error: 'User not found' });
                }
                
                // Remove password from response
                if (user.password) {
                    delete user.password;
                }
                
                console.log(`Retrieved profile for user ${userId} using direct MongoDB client (fallback)`);
                return res.status(200).json(user);
                
            } catch (directError) {
                console.error('Direct MongoDB client fallback also failed:', directError.message);
                console.log('Using token data as last resort fallback');
                
                // Use token data as last resort
                return res.status(200).json({
                    _id: userId,
                    name: req.user.name || "User",
                    email: req.user.email || "user@example.com",
                    role: req.user.role || "user",
                    image: "https://res.cloudinary.com/daacjyk3d/image/upload/v1740376690/fitnessApp/gfo0vamcfcurte2gc4jk.jpg",
                    _fallback: true
                });
            }
        }
    } catch (error) {
        console.error('Error getting user profile:', error);
        return res.status(500).json({ error: error.message || 'Error retrieving user profile' });
    }
};

// Exports
module.exports = {
    register,
    login,
    getProfile,
    updateUser,
    updateUserFields,
    getAllUsers, 
    getUserById,
    deleteUser,
    getConfirmedAppointments
};