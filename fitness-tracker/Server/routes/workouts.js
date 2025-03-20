// routes/workouts.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Workout = require('../models/Workout');

// Get all workouts for a user
router.get('/user/:userId', auth(['user', 'trainer', 'admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const workouts = await Workout.find({ userId }).sort({ date: -1 });
    res.status(200).json(workouts);
  } catch (error) {
    console.error('Error fetching workouts:', error);
    res.status(500).json({ message: 'Failed to fetch workouts', error: error.message });
  }
});

// Create a new workout
router.post('/', auth(['user', 'trainer']), async (req, res) => {
  try {
    const { userId, exercises, duration, date, notes } = req.body;
    
    const newWorkout = new Workout({
      userId,
      exercises,
      duration,
      date: date || new Date(),
      notes
    });
    
    const savedWorkout = await newWorkout.save();
    res.status(201).json(savedWorkout);
  } catch (error) {
    console.error('Error creating workout:', error);
    res.status(500).json({ message: 'Failed to create workout', error: error.message });
  }
});

// Delete a workout
router.delete('/:workoutId', auth(['user', 'trainer']), async (req, res) => {
  try {
    const { workoutId } = req.params;
    
    const deletedWorkout = await Workout.findByIdAndDelete(workoutId);
    
    if (!deletedWorkout) {
      return res.status(404).json({ message: 'Workout not found' });
    }
    
    res.status(200).json({ message: 'Workout deleted successfully' });
  } catch (error) {
    console.error('Error deleting workout:', error);
    res.status(500).json({ message: 'Failed to delete workout', error: error.message });
  }
});

// Placeholder for workout routes
router.get('/', auth(['user', 'trainer', 'admin']), (req, res) => {
  res.status(200).json({ message: 'Workouts route is working' });
});

module.exports = router; 