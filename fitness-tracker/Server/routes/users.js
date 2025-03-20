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

module.exports = router;