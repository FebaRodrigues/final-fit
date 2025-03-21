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
    const { email, password } = req.body;

    try {
        console.log(`Login attempt for email: ${email} at ${new Date().toISOString()}`);
        
        // Check if mongoose connection is working
        let user;
        let useDirectClient = false;
        
        try {
            // Try standard mongoose query first
            if (mongoose.connection.readyState === 1) {
                console.log('Using mongoose connection for login');
                user = await User.findOne({ email });
            } else {
                // Connection not ready, will try direct client
                useDirectClient = true;
                throw new Error('Mongoose connection not ready');
            }
        } catch (mongooseError) {
            console.warn('Mongoose query failed:', mongooseError.message);
            
            // Fall back to direct MongoDB client if mongoose fails
            try {
                useDirectClient = true;
                const { getDb } = require('../config/db');
                const db = getDb();
                
                console.log('Using direct MongoDB client for login');
                user = await db.collection('users').findOne({ email });
                
                if (user) {
                    console.log('User found with direct MongoDB client');
                }
            } catch (directError) {
                console.error('Direct MongoDB query failed:', directError.message);
                throw new Error('Database connection failed. Please try again later.');
            }
        }
        
        // Check if user exists
        if (!user) {
            console.log(`No user found with email: ${email}`);
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log(`Password mismatch for user: ${email}`);
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Update last login time
        try {
            if (useDirectClient) {
                const { getDb } = require('../config/db');
                const db = getDb();
                await db.collection('users').updateOne(
                    { _id: user._id },
                    { $set: { lastLogin: new Date() } }
                );
            } else {
                await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });
            }
        } catch (updateError) {
            // Non-critical, just log the error
            console.warn('Could not update last login time:', updateError.message);
        }
        
        // Create and return token
        const payload = {
            id: user._id.toString(),
            role: user.role || 'user'
        };
        
        console.log(`Generating token for user ${user._id.toString()} with role ${user.role || 'user'}`);
        
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '30d' }
        );
        
        console.log(`Login successful for user: ${email}`);
        
        // Return user data and token
        return res.json({
            token,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role || 'user',
                image: user.image || DEFAULT_PROFILE_IMAGE
            }
        });
    } catch (error) {
        console.error('Login error:', error.message);
        return res.status(500).json({ message: 'Server error', error: error.message });
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
        const userId = req.params.userId || req.user.id;
        console.log(`Getting user with ID: ${userId}`);
        
        const user = await User.findById(userId).select('-password');
        
        if (!user) {
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
    try {
        const userId = req.user.id;
        console.log(`Getting profile for user ${userId}`);
        
        const user = await User.findById(userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        console.log(`Retrieved profile for user ${userId}`);
        return res.status(200).json(user);
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