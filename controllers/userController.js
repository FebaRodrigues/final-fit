const User = require('../models/User');
const Appointment = require('../models/Appointment');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const uploadToCloudinary = require("../utilities/imageUpload");
const { createWelcomeNotification } = require('./notificationController');
const fs = require('fs');
const path = require('path');

// Default profile image URL
const DEFAULT_PROFILE_IMAGE = "https://res.cloudinary.com/daacjyk3d/image/upload/v1740376690/fitnessApp/gfo0vamcfcurte2gc4jk.jpg";

// Register a new user
exports.register = async (req, res) => {
    try {
        console.log('Registration request received:', req.body);
        console.log('File received:', req.file);
        
        const { name, email, password } = req.body;
        let image = req.file ? req.file.path : null;

        // Validate required fields
        if (!name || !email || !password) {
            console.log('Missing required fields');
            return res.status(400).json({ message: "Name, email, and password are required" });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('User already exists:', email);
            return res.status(400).json({ message: "User with this email already exists" });
        }

        let imageUrl = null;
        if (image) {
            try {
                console.log('Uploading image to Cloudinary:', image);
                
                // Verify file exists
                if (!fs.existsSync(image)) {
                    console.error("File does not exist at path:", image);
                    // Continue with default image
                    imageUrl = DEFAULT_PROFILE_IMAGE;
                } else {
                    // Configure Cloudinary directly here
                    const cloudinary = require('cloudinary').v2;
                    cloudinary.config({
                        cloud_name: 'daacjyk3d',
                        api_key: '529398839939766',
                        api_secret: 'uh7GzWkQ4A5Hc2bfh-RyBk8AAFI'
                    });
                    
                    // Upload directly with cloudinary
                    const result = await cloudinary.uploader.upload(image, {
                        folder: "fitnessApp",
                        use_filename: true,
                        unique_filename: true,
                        resource_type: "auto"
                    });
                    
                    console.log("Cloudinary upload result:", result);
                    
                    if (result && result.secure_url) {
                        // Cloudinary upload successful
                        imageUrl = result.secure_url;
                        console.log('Image uploaded to Cloudinary:', imageUrl);
                        
                        // Clean up the local file
                        try {
                            fs.unlinkSync(image);
                            console.log("Temporary file removed:", image);
                        } catch (unlinkError) {
                            console.error("Error removing temporary file:", unlinkError);
                        }
                    } else {
                        // Cloudinary upload failed, use default image
                        console.error('Cloudinary upload failed, using default image');
                        imageUrl = DEFAULT_PROFILE_IMAGE;
                    }
                }
            } catch (uploadError) {
                console.error('Image upload error:', uploadError);
                // Use default image on error
                imageUrl = DEFAULT_PROFILE_IMAGE;
            }
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user with default role
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            image: imageUrl || DEFAULT_PROFILE_IMAGE,
            role: 'user',
            registrationDate: new Date()
        });

        await newUser.save();
        console.log('User registered successfully:', newUser._id);
        
        // Create a welcome notification for the new user
        await createWelcomeNotification(newUser._id);
        
        // Create JWT token for immediate login
        const token = jwt.sign(
            { id: newUser._id, role: newUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(201).json({
            message: "User registered successfully",
            userId: newUser._id,
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                image: newUser.image
            }
        });
    } catch (error) {
        console.error("Error in register:", error);
        res.status(500).json({ 
            message: "Registration failed",
            error: error.message || "Internal server error"
        });
    }
};

// Update a user or current user
exports.updateUser = async (req, res) => {
    const userId = req.user.id;
    const updates = {};

    try {
        console.log("==== UPDATE USER REQUEST ====");
        console.log("User ID:", userId);
        console.log("Request body:", JSON.stringify(req.body, null, 2));
        console.log("Request file:", req.file ? req.file.path : "No file");

        // Extract fields from req.body
        if (req.body.name) {
            updates.name = req.body.name;
            console.log("Setting name to:", updates.name);
        }
        
        if (req.body.email) {
            updates.email = req.body.email;
            console.log("Setting email to:", updates.email);
        }
        
        // Properly handle numeric values
        if (req.body.age !== undefined && req.body.age !== '') {
            updates.age = Number(req.body.age);
            console.log("Parsed age:", updates.age, "from input:", req.body.age);
            // Check if conversion resulted in NaN
            if (isNaN(updates.age)) {
                console.log("Age is NaN, setting to undefined");
                updates.age = undefined;
            }
        } else {
            console.log("Age not provided or empty string");
        }
        
        if (req.body.height !== undefined && req.body.height !== '') {
            updates.height = Number(req.body.height);
            console.log("Parsed height:", updates.height, "from input:", req.body.height);
            // Check if conversion resulted in NaN
            if (isNaN(updates.height)) {
                console.log("Height is NaN, setting to undefined");
                updates.height = undefined;
            }
        } else {
            console.log("Height not provided or empty string");
        }
        
        if (req.body.weight !== undefined && req.body.weight !== '') {
            updates.weight = Number(req.body.weight);
            console.log("Parsed weight:", updates.weight, "from input:", req.body.weight);
            // Check if conversion resulted in NaN
            if (isNaN(updates.weight)) {
                console.log("Weight is NaN, setting to undefined");
                updates.weight = undefined;
            }
        } else {
            console.log("Weight not provided or empty string");
        }
        
        if (req.body.gender) {
            updates.gender = req.body.gender;
            console.log("Setting gender to:", updates.gender);
        }
        
        // Handle goals
        if (req.body.goals) {
            try {
                updates.goals = JSON.parse(req.body.goals);
                console.log("Parsed goals:", updates.goals);
            } catch (e) {
                console.error("Error parsing goals:", e);
                // If parsing fails, try to use it as is
                updates.goals = req.body.goals;
                console.log("Using goals as is:", updates.goals);
            }
        }

        // Handle image upload
        if (req.file) {
            console.log("Processing image upload:", req.file.path);
            try {
                // Upload to Cloudinary
                console.log("Cloudinary config:", {
                    cloud_name: 'daacjyk3d',
                    api_key: '529398839939766',
                    api_secret: 'uh7GzWkQ4A5Hc2bfh-RyBk8AAFI'
                });
                
                // Verify file exists
                if (!fs.existsSync(req.file.path)) {
                    console.error("File does not exist at path:", req.file.path);
                    return res.status(500).json({ 
                        error: "File does not exist at path: " + req.file.path
                    });
                }
                
                // Configure Cloudinary directly here
                const cloudinary = require('cloudinary').v2;
                cloudinary.config({
                    cloud_name: 'daacjyk3d',
                    api_key: '529398839939766',
                    api_secret: 'uh7GzWkQ4A5Hc2bfh-RyBk8AAFI'
                });
                
                // Upload directly with cloudinary
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: "fitnessApp",
                    use_filename: true,
                    unique_filename: true,
                    resource_type: "auto"
                });
                
                console.log("Cloudinary upload result:", result);
                
                if (result && result.secure_url) {
                    // Cloudinary upload successful
                    updates.image = result.secure_url;
                    console.log("Image uploaded to Cloudinary:", updates.image);
                    
                    // Clean up the local file
                    try {
                        fs.unlinkSync(req.file.path);
                        console.log("Temporary file removed:", req.file.path);
                    } catch (unlinkError) {
                        console.error("Error removing temporary file:", unlinkError);
                    }
                } else {
                    // Cloudinary upload failed
                    console.error("Cloudinary upload failed, no secure_url returned");
                    return res.status(500).json({ 
                        error: "Failed to upload image to Cloudinary. No secure URL returned." 
                    });
                }
            } catch (uploadError) {
                console.error("Image upload error:", uploadError);
                return res.status(500).json({ 
                    error: "Error uploading image to Cloudinary: " + (uploadError.message || "Unknown error") 
                });
            }
        }

        console.log("Final updates to apply:", JSON.stringify(updates, null, 2));

        // Find the user before update to log the changes
        const userBefore = await User.findById(userId);
        console.log("User before update:", JSON.stringify(userBefore, null, 2));

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!user) {
            console.log("User not found with ID:", userId);
            return res.status(404).json({ message: 'User not found' });
        }

        console.log("User after update:", JSON.stringify(user, null, 2));
        res.status(200).json(user);
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ error: error.message || "An unknown error occurred" });
    }
}; 