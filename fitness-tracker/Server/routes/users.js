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

router.get('/profile', auth(['user']), getProfile);

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

module.exports = router;