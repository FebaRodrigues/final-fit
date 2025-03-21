// routes/users.js
const express = require('express');
const upload = require('../middleware/multer');
const {
    register,
    login,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    getConfirmedAppointments,
    updateUserFields,
    getProfile
} = require('../controllers/userController');
const { auth } = require('../middleware/auth');
const router = express.Router();
const User = require('../models/User');

// Debug middleware for file uploads
const debugUpload = (req, res, next) => {
    console.log('=== DEBUG UPLOAD REQUEST ===');
    console.log('Headers:', req.headers);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Content-Length:', req.headers['content-length']);
    console.log('Method:', req.method);
    console.log('URL:', req.originalUrl);
    console.log('User authenticated:', req.user ? 'Yes' : 'No');
    console.log('Body keys:', Object.keys(req.body));
    console.log('Files received:', req.file ? 'Yes' : 'No');
    if (req.file) {
        console.log('File details:', {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            encoding: req.file.encoding,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path
        });
    }
    next();
};

// Handle multer errors
function handleMulterError(err, req, res, next) {
    if (err && err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size exceeds the 5MB limit' });
        }
        return res.status(400).json({ error: `File upload error: ${err.message}` });
    } else if (err) {
        return res.status(500).json({ error: `Server error during file upload: ${err.message}` });
    }
    next();
}

// Routes with debug middleware
router.post('/register', upload.single('image'), register);

router.post('/login', login);

router.get('/', auth(['admin']), getAllUsers);

router.get('/profile', auth, async (req, res) => {
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
});

router.get('/:userId', auth(['admin', 'trainer']), getUserById);

router.put('/profile', 
    auth(['user']), 
    debugUpload, 
    handleMulterError, 
    upload.single('image'), 
    handleMulterError, 
    updateUser
);

// Fields-only update route (no image upload)
router.put('/update-fields', auth(['user']), updateUserFields);

router.delete('/:userId', auth(['admin']), deleteUser);

router.get('/:userId/confirmed-appointments', auth(['user']), getConfirmedAppointments);

// Add a test login endpoint that bypasses database
router.post('/login-test', async (req, res) => {
  try {
    console.log('Test login endpoint accessed:', new Date().toISOString());
    console.log('Request body:', req.body);
    
    const { email, password } = req.body;
    
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Return a mock successful response
    return res.status(200).json({
      message: 'Test login successful',
      user: {
        id: 'test-user-123',
        name: 'Test User',
        email: email,
        role: 'user'
      },
      token: 'test-jwt-token-123',
      testMode: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test login error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add a direct client version of the profile endpoint
router.get('/profile-direct', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(`Getting profile for user ${userId} using direct MongoDB client`);
        
        // Get the direct MongoDB client
        const { getDb } = require('../config/db');
        
        try {
            const db = getDb();
            console.log('Successfully obtained MongoDB client for profile fetch');
            
            // Convert string ID to ObjectId if needed
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
            
            console.log(`Retrieved profile for user ${userId} using direct MongoDB client`);
            return res.status(200).json(user);
            
        } catch (dbError) {
            console.error('Error with direct MongoDB client:', dbError);
            throw new Error(`Direct MongoDB client error: ${dbError.message}`);
        }
    } catch (error) {
        console.error('Error getting user profile with direct client:', error);
        return res.status(500).json({ 
            error: error.message || 'Error retrieving user profile',
            suggestion: 'Try using the test login endpoint if database issues persist' 
        });
    }
});

// Add a mock profile endpoint for when MongoDB is completely unavailable
router.get('/profile-fallback', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(`Providing fallback profile data for user ${userId}`);
        
        // Return basic profile info from the JWT token
        return res.status(200).json({
            _id: userId,
            name: req.user.name || "User",
            email: req.user.email || "user@example.com",
            role: req.user.role || "user",
            image: "https://res.cloudinary.com/daacjyk3d/image/upload/v1740376690/fitnessApp/gfo0vamcfcurte2gc4jk.jpg"
        });
    } catch (error) {
        console.error('Error in fallback profile endpoint:', error);
        return res.status(500).json({ error: 'Server error with fallback profile' });
    }
});

module.exports = router;