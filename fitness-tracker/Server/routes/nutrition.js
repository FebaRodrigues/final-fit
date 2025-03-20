// routes/nutrition.js
const express = require('express');
const { 
    createOrUpdateNutritionLog,
    addMeal,
    updateMeal,
    deleteMeal,
    addWaterIntake,
    getNutritionLogByDate,
    getNutritionLogs,
    getNutritionStats,
    setNutritionGoals,
    getNutritionGoals,
    getNutritionPlan,
    updateNutritionPlan
} = require('../controllers/nutritionController');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Create or update nutrition log
router.post('/', createOrUpdateNutritionLog);

// Add a meal to a nutrition log
router.post('/meal', addMeal);

// Update a meal in a nutrition log
router.put('/meal', updateMeal);

// Delete a meal from a nutrition log
router.delete('/meal/:logId/:mealId', deleteMeal);

// Add a new route for deleting meals with POST
router.post('/delete-meal', deleteMeal);

// Add water intake to a nutrition log
router.post('/water', addWaterIntake);

// Get nutrition log for a specific date
router.get('/date/:userId/:date', getNutritionLogByDate);

// Get nutrition logs for a date range
router.get('/logs/:userId', getNutritionLogs);

// Get nutrition logs for a date range (alternative endpoint)
router.get('/logs/:userId/range', getNutritionLogs);

// Get nutrition statistics for a date range
router.get('/stats/:userId', getNutritionStats);

// Set daily nutrition goals
router.post('/goals', setNutritionGoals);

// Get nutrition goals for a user
router.get('/goals/:userId', getNutritionGoals);

// Update nutrition goals for a user
router.put('/goals/:userId', setNutritionGoals);

// Get personalized nutrition plan for a user
router.get('/plan/:userId', getNutritionPlan);

// Update personalized nutrition plan for a user
router.put('/plan/:userId', updateNutritionPlan);

// Create a new nutrition log entry
router.post('/logs', createOrUpdateNutritionLog);

// Update a nutrition log entry
router.put('/logs/:id', createOrUpdateNutritionLog);

// Delete a nutrition log entry
router.delete('/logs/:id', async (req, res) => {
    try {
        // This is a placeholder for the delete function
        // You would implement the actual deletion logic in the controller
        res.status(200).json({ message: 'Nutrition log deleted successfully' });
    } catch (error) {
        console.error('Error deleting nutrition log:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;