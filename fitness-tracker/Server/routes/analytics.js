// routes/analytics.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Workout = require('../models/Workout');
const Goal = require('../models/Goal');
const User = require('../models/User');

// Get client analytics data
router.get('/client/:clientId', auth(['trainer', 'admin', 'user']), async (req, res) => {
  try {
    const { clientId } = req.params;
    const { timeRange = 'month' } = req.query;
    
    // Calculate date range based on timeRange
    const endDate = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1); // Default to month
    }
    
    // Get user data
    const user = await User.findById(clientId);
    if (!user) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    // Get workouts within date range
    const workouts = await Workout.find({
      userId: clientId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });
    
    // Get goals within date range
    const goals = await Goal.find({
      userId: clientId,
      createdAt: { $gte: startDate, $lte: endDate }
    });
    
    // Calculate workout frequency by day of week
    const workoutFrequency = {
      'Sunday': 0,
      'Monday': 0,
      'Tuesday': 0,
      'Wednesday': 0,
      'Thursday': 0,
      'Friday': 0,
      'Saturday': 0
    };
    
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    workouts.forEach(workout => {
      const day = daysOfWeek[new Date(workout.date).getDay()];
      workoutFrequency[day]++;
    });
    
    // Calculate workout durations
    const workoutDurations = workouts.map(workout => ({
      date: workout.date,
      duration: workout.duration
    }));
    
    // Calculate exercise distribution
    const exerciseDistribution = {};
    workouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        if (exerciseDistribution[exercise.name]) {
          exerciseDistribution[exercise.name]++;
        } else {
          exerciseDistribution[exercise.name] = 1;
        }
      });
    });
    
    // Calculate goal progress
    const goalProgress = goals.map(goal => ({
      title: goal.title,
      type: goal.type,
      currentValue: goal.currentValue,
      targetValue: goal.targetValue,
      progress: Math.round((goal.currentValue / goal.targetValue) * 100)
    }));
    
    // Calculate summary metrics
    const totalWorkouts = workouts.length;
    const averageDuration = totalWorkouts > 0 
      ? Math.round(workouts.reduce((sum, workout) => sum + workout.duration, 0) / totalWorkouts) 
      : 0;
    
    // Estimate calories burned (very rough estimate)
    const caloriesPerMinute = 5; // Average calories burned per minute of exercise
    const totalCaloriesBurned = workouts.reduce((sum, workout) => sum + (workout.duration * caloriesPerMinute), 0);
    
    // Count completed goals
    const completedGoals = goals.filter(goal => goal.status === 'completed').length;
    
    // Calculate consistency (percentage of days with workouts)
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const daysWithWorkouts = new Set(workouts.map(w => new Date(w.date).toDateString())).size;
    const consistency = Math.round((daysWithWorkouts / daysDiff) * 100);
    
    res.status(200).json({
      workoutFrequency,
      workoutDurations,
      exerciseDistribution,
      goalProgress,
      totalWorkouts,
      averageDuration,
      totalCaloriesBurned,
      completedGoals,
      consistency
    });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({ message: 'Failed to fetch analytics data', error: error.message });
  }
});

module.exports = router; 