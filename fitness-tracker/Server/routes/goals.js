// routes/goals.js
const express = require('express');
const { 
    createGoal, 
    getUserGoals, 
    getAllUserGoals,
    getGoalById,
    updateGoal, 
    updateGoalProgress,
    deleteGoal,
    getGoalStats
} = require('../controllers/goalController');
const { auth } = require('../middleware/auth');
const membershipAccess = require('../middleware/membershipAccess');
const router = express.Router();

// Create a new goal
router.post('/', auth(['user', 'trainer']), membershipAccess.premium, createGoal);

// Get active goals for a user
router.get('/user/:userId', auth(['user', 'trainer', 'admin']), membershipAccess.premium, getUserGoals);

// Get all goals for a user (with filtering)
router.get('/all/:userId', auth(['user', 'trainer', 'admin']), membershipAccess.premium, getAllUserGoals);

// Get goal statistics for a user
router.get('/stats/:userId', auth(['user', 'trainer', 'admin']), membershipAccess.premium, getGoalStats);

// Get a specific goal by ID
router.get('/:goalId', auth(['user', 'trainer', 'admin']), membershipAccess.premium, getGoalById);

// Update a goal
router.put('/:goalId', auth(['user', 'trainer']), membershipAccess.premium, updateGoal);

// Update goal progress
router.put('/:goalId/progress', auth(['user', 'trainer']), membershipAccess.premium, updateGoalProgress);

// Delete a goal (soft delete)
router.delete('/:goalId', auth(['user', 'trainer']), membershipAccess.premium, deleteGoal);

// Placeholder for goals routes
router.get('/', auth(['user', 'trainer', 'admin']), (req, res) => {
  res.status(200).json({ message: 'Goals route is working' });
});

module.exports = router;