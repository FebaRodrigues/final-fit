// routes/nutritionPlans.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const NutritionPlan = require('../models/NutritionPlan');
const User = require('../models/User');

// Create a new nutrition plan
router.post('/', auth(['trainer', 'admin']), async (req, res) => {
  try {
    const { title, description, targetCalories, macroSplit, mealPlan, trainerId } = req.body;
    
    const newPlan = new NutritionPlan({
      title,
      description,
      targetCalories,
      macroSplit,
      mealPlan,
      trainerId
    });
    
    const savedPlan = await newPlan.save();
    res.status(201).json(savedPlan);
  } catch (error) {
    console.error('Error creating nutrition plan:', error);
    res.status(500).json({ message: 'Failed to create nutrition plan', error: error.message });
  }
});

// Get all nutrition plans created by a trainer
router.get('/trainer/:trainerId', auth(['trainer', 'admin']), async (req, res) => {
  try {
    const { trainerId } = req.params;
    const plans = await NutritionPlan.find({ trainerId });
    res.status(200).json(plans);
  } catch (error) {
    console.error('Error fetching nutrition plans:', error);
    res.status(500).json({ message: 'Failed to fetch nutrition plans', error: error.message });
  }
});

// Get a specific nutrition plan by ID
router.get('/:planId', auth(['user', 'trainer', 'admin']), async (req, res) => {
  try {
    const { planId } = req.params;
    const plan = await NutritionPlan.findById(planId);
    
    if (!plan) {
      return res.status(404).json({ message: 'Nutrition plan not found' });
    }
    
    res.status(200).json(plan);
  } catch (error) {
    console.error('Error fetching nutrition plan:', error);
    res.status(500).json({ message: 'Failed to fetch nutrition plan', error: error.message });
  }
});

// Get all nutrition plans assigned to a user
router.get('/user/:userId', auth(['user', 'trainer', 'admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate('nutritionPlans');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user.nutritionPlans);
  } catch (error) {
    console.error('Error fetching user nutrition plans:', error);
    res.status(500).json({ message: 'Failed to fetch user nutrition plans', error: error.message });
  }
});

// Assign a nutrition plan to a user
router.post('/assign', auth(['trainer', 'admin']), async (req, res) => {
  try {
    const { planId, userId } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const plan = await NutritionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Nutrition plan not found' });
    }
    
    // Add the plan to the user's nutrition plans if not already assigned
    if (!user.nutritionPlans.includes(planId)) {
      user.nutritionPlans.push(planId);
      await user.save();
    }
    
    res.status(200).json({ message: 'Nutrition plan assigned successfully' });
  } catch (error) {
    console.error('Error assigning nutrition plan:', error);
    res.status(500).json({ message: 'Failed to assign nutrition plan', error: error.message });
  }
});

// Update a nutrition plan
router.put('/:planId', auth(['trainer', 'admin']), async (req, res) => {
  try {
    const { planId } = req.params;
    const updates = req.body;
    
    const updatedPlan = await NutritionPlan.findByIdAndUpdate(
      planId,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!updatedPlan) {
      return res.status(404).json({ message: 'Nutrition plan not found' });
    }
    
    res.status(200).json(updatedPlan);
  } catch (error) {
    console.error('Error updating nutrition plan:', error);
    res.status(500).json({ message: 'Failed to update nutrition plan', error: error.message });
  }
});

// Delete a nutrition plan
router.delete('/:planId', auth(['trainer', 'admin']), async (req, res) => {
  try {
    const { planId } = req.params;
    
    const deletedPlan = await NutritionPlan.findByIdAndDelete(planId);
    
    if (!deletedPlan) {
      return res.status(404).json({ message: 'Nutrition plan not found' });
    }
    
    // Remove the plan from any users who have it assigned
    await User.updateMany(
      { nutritionPlans: planId },
      { $pull: { nutritionPlans: planId } }
    );
    
    res.status(200).json({ message: 'Nutrition plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting nutrition plan:', error);
    res.status(500).json({ message: 'Failed to delete nutrition plan', error: error.message });
  }
});

// Placeholder for nutrition plan routes
router.get('/', auth(['user', 'trainer', 'admin']), (req, res) => {
  res.status(200).json({ message: 'Nutrition plans route is working' });
});

module.exports = router; 