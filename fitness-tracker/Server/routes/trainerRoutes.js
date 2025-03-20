// routes/trainerRoutes.js
const express = require('express');
const upload = require('../middleware/multer');
const {
    registerTrainer,
    loginTrainer,
    getAllTrainers,
    getTrainerProfileById,
    updateTrainerProfile,
    deleteTrainer,
    getClients,
    getClientProgress,
    getTrainerEarnings,
    getAvailableTrainers
} = require('../controllers/trainerController');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Trainer registration
router.post('/register', upload.single('image'), registerTrainer);

// Trainer login
router.post('/login', loginTrainer);

// Get all trainers (admin only)
router.get('/', auth(['admin']), getAllTrainers);

// Get available trainers (public access for booking)
router.get('/available', getAvailableTrainers);

// Get a trainer's profile (admin and trainer)
router.get('/profile/:trainerId', auth(['admin', 'trainer']), getTrainerProfileById);

// Update a trainer's profile (admin and trainer)
router.put('/profile/:trainerId', auth(['admin', 'trainer']), upload.single('image'), updateTrainerProfile);

// Direct update route for trainer profile
router.put('/:trainerId', auth(['admin', 'trainer']), upload.single('image'), updateTrainerProfile);

// Get progress for a specific client (trainer only)
router.get('/client-progress/:userId', auth(['trainer']), getClientProgress);

// Get all clients for a trainer (trainer only)
router.get('/:trainerId/clients', auth(['trainer']), getClients);

// Get trainer earnings (admin and trainer)
router.get('/earnings/:trainerId', auth(['admin', 'trainer']), getTrainerEarnings);

// Get a trainer by ID (public route for client access)
router.get('/:trainerId', getTrainerProfileById);

// Delete a trainer (admin only)
router.delete('/:trainerId', auth(['admin']), deleteTrainer);

module.exports = router;