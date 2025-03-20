// routes/workout-programs.js
const express = require('express');
const { 
    createWorkoutProgram, 
    getWorkoutPrograms, 
    getLibraryWorkoutPrograms, 
    assignWorkoutProgram,
    getWorkoutProgramById,
    updateWorkoutProgram,
    deleteWorkoutProgram,
    getAllWorkoutPrograms
} = require('../controllers/workoutProgramController');
const { auth, authenticateAdmin } = require('../middleware/auth');
const membershipAccess = require('../middleware/membershipAccess');

const router = express.Router();

// Create a workout program (Trainer or Admin)
router.post('/', auth(['trainer', 'admin']), createWorkoutProgram);

// Get all workout programs (Admin only)
router.get('/admin/all', authenticateAdmin, getAllWorkoutPrograms);

// Get all library workout programs (accessible to all users)
router.get('/library', auth(['user', 'trainer', 'admin']), getLibraryWorkoutPrograms);

// Get a specific workout program by ID
router.get('/program/:programId', auth(['user', 'trainer', 'admin']), membershipAccess.basic, getWorkoutProgramById);

// Update a workout program
router.put('/:programId', auth(['trainer', 'admin']), updateWorkoutProgram);

// Delete a workout program
router.delete('/:programId', auth(['trainer', 'admin']), deleteWorkoutProgram);

// Assign a workout program to a user (Trainer only)
router.post('/assign', auth(['trainer']), assignWorkoutProgram);

// Get all workout programs for a user (User or Trainer)
router.get('/:userId', auth(['user', 'trainer']), membershipAccess.basic, getWorkoutPrograms);

// Placeholder for workout program routes
router.get('/', auth(['user', 'trainer', 'admin']), (req, res) => {
  res.status(200).json({ message: 'Workout programs route is working' });
});

module.exports = router;