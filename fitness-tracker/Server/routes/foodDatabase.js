// routes/foodDatabase.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
    searchFoods,
    getFoodById,
    getFoodByBarcode,
    getFoodByUsdaId,
    addFood,
    updateFood,
    deleteFood,
    getFoodCategories,
    getRecentFoods,
    addToRecentFoods,
    importUsdaFood
} = require('../controllers/foodDatabaseController');

// Search foods
router.get('/search', searchFoods);

// Get food categories
router.get('/categories/list', getFoodCategories);

// Get recent foods by user
router.get('/recent/:userId', getRecentFoods);

// Get food by barcode
router.get('/barcode/:barcode', getFoodByBarcode);

// Get food by USDA FDC ID
router.get('/usda/:fdcId', getFoodByUsdaId);

// Import food from USDA to our database
router.post('/import-usda', importUsdaFood);

// Add food to user's recent foods
router.post('/recent', addToRecentFoods);

// Add new food
router.post('/', addFood);

// Get food by ID (this should be after all other GET routes with specific paths)
router.get('/:id', getFoodById);

// Update food (admin only)
router.put('/:id', updateFood);

// Delete food (admin only)
router.delete('/:id', deleteFood);

module.exports = router; 