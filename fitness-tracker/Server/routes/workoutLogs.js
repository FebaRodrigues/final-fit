// routes/workoutLogs.js
const express = require('express');
const { 
    createWorkoutLog, 
    getWorkoutLogs, 
    getWorkoutLogById,
    updateWorkoutLog,
    deleteWorkoutLog,
    getWorkoutStats
} = require('../controllers/workoutLogController');
const { auth } = require('../middleware/auth');
const router = express.Router();

console.log('WorkoutLogs routes loaded!');

// Create a new workout log
router.post('/', auth(['user', 'trainer']), createWorkoutLog);

// Get all workout logs for a user (with filtering, pagination)
// Temporarily remove auth middleware for debugging
router.get('/user/:userId', (req, res) => {
    console.log(`Received request for workout logs for user: ${req.params.userId}`);
    getWorkoutLogs(req, res);
});

// Get workout statistics for a user
router.get('/stats/:userId', auth(['user', 'trainer', 'admin']), getWorkoutStats);

// Get a specific workout log by ID
router.get('/:logId', auth(['user', 'trainer', 'admin']), getWorkoutLogById);

// Update a workout log
router.put('/:logId', auth(['user', 'trainer']), updateWorkoutLog);

// Delete a workout log
router.delete('/:logId', auth(['user', 'trainer']), deleteWorkoutLog);

module.exports = router;