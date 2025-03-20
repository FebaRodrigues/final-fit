// routes/recipes.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
    searchRecipes,
    getRecipeById,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    getFavoriteRecipes,
    addToFavorites,
    removeFromFavorites,
    getRecipeSuggestions
} = require('../controllers/recipeController');

// Search recipes
router.get('/search', auth(['user', 'trainer', 'admin']), searchRecipes);

// Get recipe by ID
router.get('/:id', auth(['user', 'trainer', 'admin']), getRecipeById);

// Create new recipe
router.post('/', auth(['user', 'trainer', 'admin']), createRecipe);

// Update recipe
router.put('/:id', auth(['user', 'trainer', 'admin']), updateRecipe);

// Delete recipe
router.delete('/:id', auth(['user', 'trainer', 'admin']), deleteRecipe);

// Get user's favorite recipes
router.get('/favorites/:userId', auth(['user', 'trainer', 'admin']), getFavoriteRecipes);

// Add recipe to favorites
router.post('/favorites', auth(['user', 'trainer', 'admin']), addToFavorites);

// Remove recipe from favorites
router.delete('/favorites/:userId/:recipeId', auth(['user', 'trainer', 'admin']), removeFromFavorites);

// Get recipe suggestions
router.get('/suggestions/:userId', auth(['user', 'trainer', 'admin']), getRecipeSuggestions);

module.exports = router; 