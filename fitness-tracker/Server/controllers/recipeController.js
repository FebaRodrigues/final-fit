// controllers/recipeController.js
const Recipe = require('../models/Recipe');
const User = require('../models/User');
const FoodDatabase = require('../models/FoodDatabase');

// Search recipes
exports.searchRecipes = async (req, res) => {
    try {
        const { query, mealType, dietType, tags, limit = 20, page = 1 } = req.query;
        const skip = (page - 1) * limit;
        
        // Build search criteria
        const searchCriteria = { isPublic: true };
        
        if (query) {
            // Use text search for query
            searchCriteria.$text = { $search: query };
        }
        
        if (mealType) {
            searchCriteria.mealType = mealType;
        }
        
        if (dietType) {
            searchCriteria.dietType = dietType;
        }
        
        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim());
            searchCriteria.tags = { $in: tagArray };
        }
        
        // Find recipes matching criteria
        const recipes = await Recipe.find(searchCriteria)
            .sort({ popularity: -1, rating: -1 }) // Sort by popularity and rating
            .skip(skip)
            .limit(parseInt(limit))
            .lean();
        
        // Get total count for pagination
        const totalCount = await Recipe.countDocuments(searchCriteria);
        
        res.status(200).json({
            recipes,
            pagination: {
                total: totalCount,
                page: parseInt(page),
                pages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        console.error('Error searching recipes:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get recipe by ID
exports.getRecipeById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const recipe = await Recipe.findById(id)
            .populate('ingredients.food')
            .lean();
        
        if (!recipe) {
            return res.status(404).json({ error: 'Recipe not found' });
        }
        
        // Check if recipe is private and user is not the creator
        if (!recipe.isPublic && (!req.user || req.user._id.toString() !== recipe.createdBy.toString())) {
            return res.status(403).json({ error: 'You do not have permission to view this recipe' });
        }
        
        // Increment popularity counter
        await Recipe.findByIdAndUpdate(id, { $inc: { popularity: 1 } });
        
        res.status(200).json({ recipe });
    } catch (error) {
        console.error('Error getting recipe by ID:', error);
        res.status(500).json({ error: error.message });
    }
};

// Create new recipe
exports.createRecipe = async (req, res) => {
    try {
        const { 
            name, description, ingredients, instructions, prepTime, 
            cookTime, servings, image, tags, mealType, dietType, isPublic 
        } = req.body;
        
        // Validate required fields
        if (!name || !ingredients || !ingredients.length || !mealType) {
            return res.status(400).json({ error: 'Name, ingredients, and meal type are required' });
        }
        
        // Process ingredients to get nutritional information
        const processedIngredients = [];
        
        for (const ingredient of ingredients) {
            let nutritionInfo = {
                calories: 0,
                protein: 0,
                carbs: 0,
                fat: 0
            };
            
            // If ingredient has a food reference, get nutrition from database
            if (ingredient.food) {
                const foodItem = await FoodDatabase.findById(ingredient.food);
                
                if (foodItem) {
                    // Calculate nutrition based on amount
                    const ratio = ingredient.amount / foodItem.servingSize;
                    
                    nutritionInfo = {
                        calories: Math.round(foodItem.calories * ratio),
                        protein: parseFloat((foodItem.protein * ratio).toFixed(1)),
                        carbs: parseFloat((foodItem.carbs * ratio).toFixed(1)),
                        fat: parseFloat((foodItem.fat * ratio).toFixed(1))
                    };
                }
            }
            
            processedIngredients.push({
                ...ingredient,
                calories: nutritionInfo.calories,
                protein: nutritionInfo.protein,
                carbs: nutritionInfo.carbs,
                fat: nutritionInfo.fat
            });
        }
        
        // Create new recipe
        const newRecipe = new Recipe({
            name,
            description,
            ingredients: processedIngredients,
            instructions,
            prepTime,
            cookTime,
            servings,
            image,
            tags,
            mealType,
            dietType,
            isPublic: isPublic !== undefined ? isPublic : true,
            createdBy: req.user._id
        });
        
        await newRecipe.save();
        
        res.status(201).json({
            message: 'Recipe created successfully',
            recipe: newRecipe
        });
    } catch (error) {
        console.error('Error creating recipe:', error);
        res.status(500).json({ error: error.message });
    }
};

// Update recipe
exports.updateRecipe = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        // Find the recipe
        const recipe = await Recipe.findById(id);
        
        if (!recipe) {
            return res.status(404).json({ error: 'Recipe not found' });
        }
        
        // Check if user is the creator or an admin
        if (recipe.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'You do not have permission to update this recipe' });
        }
        
        // Process ingredients if they're being updated
        if (updateData.ingredients) {
            const processedIngredients = [];
            
            for (const ingredient of updateData.ingredients) {
                let nutritionInfo = {
                    calories: 0,
                    protein: 0,
                    carbs: 0,
                    fat: 0
                };
                
                // If ingredient has a food reference, get nutrition from database
                if (ingredient.food) {
                    const foodItem = await FoodDatabase.findById(ingredient.food);
                    
                    if (foodItem) {
                        // Calculate nutrition based on amount
                        const ratio = ingredient.amount / foodItem.servingSize;
                        
                        nutritionInfo = {
                            calories: Math.round(foodItem.calories * ratio),
                            protein: parseFloat((foodItem.protein * ratio).toFixed(1)),
                            carbs: parseFloat((foodItem.carbs * ratio).toFixed(1)),
                            fat: parseFloat((foodItem.fat * ratio).toFixed(1))
                        };
                    }
                }
                
                processedIngredients.push({
                    ...ingredient,
                    calories: nutritionInfo.calories,
                    protein: nutritionInfo.protein,
                    carbs: nutritionInfo.carbs,
                    fat: nutritionInfo.fat
                });
            }
            
            updateData.ingredients = processedIngredients;
        }
        
        // Update recipe data
        Object.keys(updateData).forEach(key => {
            if (key !== '_id' && key !== 'createdBy' && key !== 'createdAt') {
                recipe[key] = updateData[key];
            }
        });
        
        await recipe.save();
        
        res.status(200).json({
            message: 'Recipe updated successfully',
            recipe
        });
    } catch (error) {
        console.error('Error updating recipe:', error);
        res.status(500).json({ error: error.message });
    }
};

// Delete recipe
exports.deleteRecipe = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find the recipe
        const recipe = await Recipe.findById(id);
        
        if (!recipe) {
            return res.status(404).json({ error: 'Recipe not found' });
        }
        
        // Check if user is the creator or an admin
        if (recipe.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'You do not have permission to delete this recipe' });
        }
        
        await Recipe.findByIdAndDelete(id);
        
        res.status(200).json({
            message: 'Recipe deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting recipe:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get user's favorite recipes
exports.getFavoriteRecipes = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Find user
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check if user is requesting their own favorites or is an admin/trainer
        if (userId !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'trainer') {
            return res.status(403).json({ error: 'You do not have permission to view this user\'s favorite recipes' });
        }
        
        // Get favorite recipes
        const favoriteRecipes = await Recipe.find({
            _id: { $in: user.favoriteRecipes || [] }
        }).lean();
        
        res.status(200).json({ favoriteRecipes });
    } catch (error) {
        console.error('Error getting favorite recipes:', error);
        res.status(500).json({ error: error.message });
    }
};

// Add recipe to favorites
exports.addToFavorites = async (req, res) => {
    try {
        const { userId, recipeId } = req.body;
        
        // Check if user is adding to their own favorites
        if (userId !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'You can only add recipes to your own favorites' });
        }
        
        // Find user
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check if recipe exists
        const recipe = await Recipe.findById(recipeId);
        
        if (!recipe) {
            return res.status(404).json({ error: 'Recipe not found' });
        }
        
        // Initialize favoriteRecipes array if it doesn't exist
        if (!user.favoriteRecipes) {
            user.favoriteRecipes = [];
        }
        
        // Check if recipe is already in favorites
        if (user.favoriteRecipes.includes(recipeId)) {
            return res.status(400).json({ error: 'Recipe is already in favorites' });
        }
        
        // Add recipe to favorites
        user.favoriteRecipes.push(recipeId);
        await user.save();
        
        // Increment recipe popularity
        await Recipe.findByIdAndUpdate(recipeId, { $inc: { popularity: 1 } });
        
        res.status(200).json({
            message: 'Recipe added to favorites',
            favoriteRecipes: user.favoriteRecipes
        });
    } catch (error) {
        console.error('Error adding recipe to favorites:', error);
        res.status(500).json({ error: error.message });
    }
};

// Remove recipe from favorites
exports.removeFromFavorites = async (req, res) => {
    try {
        const { userId, recipeId } = req.params;
        
        // Check if user is removing from their own favorites
        if (userId !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'You can only remove recipes from your own favorites' });
        }
        
        // Find user
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Remove recipe from favorites
        if (user.favoriteRecipes) {
            user.favoriteRecipes = user.favoriteRecipes.filter(id => id.toString() !== recipeId);
            await user.save();
        }
        
        res.status(200).json({
            message: 'Recipe removed from favorites',
            favoriteRecipes: user.favoriteRecipes
        });
    } catch (error) {
        console.error('Error removing recipe from favorites:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get recipe suggestions based on user preferences and goals
exports.getRecipeSuggestions = async (req, res) => {
    try {
        const { userId } = req.params;
        const { mealType, targetCalories, targetProtein } = req.query;
        
        // Find user
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Build search criteria
        const searchCriteria = { isPublic: true };
        
        if (mealType) {
            searchCriteria.mealType = mealType;
        }
        
        // Consider user's diet type if available
        if (user.nutritionPreferences && user.nutritionPreferences.dietType && user.nutritionPreferences.dietType !== 'standard') {
            searchCriteria.dietType = user.nutritionPreferences.dietType;
        }
        
        // Exclude recipes with allergens if user has allergies
        if (user.nutritionPreferences && user.nutritionPreferences.allergies && user.nutritionPreferences.allergies.length > 0) {
            const allergies = user.nutritionPreferences.allergies.map(allergy => new RegExp(allergy, 'i'));
            searchCriteria.$and = [
                { 'ingredients.name': { $not: { $in: allergies } } }
            ];
        }
        
        // Find recipes matching criteria
        let recipes = await Recipe.find(searchCriteria)
            .sort({ popularity: -1, rating: -1 })
            .limit(50)
            .lean();
        
        // Filter and sort recipes based on nutritional goals
        if (targetCalories || targetProtein) {
            // Calculate calorie and protein targets
            const calorieTarget = targetCalories ? parseInt(targetCalories) : 
                (user.nutritionPreferences && user.nutritionPreferences.dailyGoals && user.nutritionPreferences.dailyGoals.calories) || 500;
            
            const proteinTarget = targetProtein ? parseInt(targetProtein) : 
                (user.nutritionPreferences && user.nutritionPreferences.dailyGoals && user.nutritionPreferences.dailyGoals.protein) || 30;
            
            // Score recipes based on how well they match the targets
            recipes = recipes.map(recipe => {
                const calorieScore = 1 - Math.min(Math.abs(recipe.nutritionPerServing.calories - calorieTarget) / calorieTarget, 1);
                const proteinScore = 1 - Math.min(Math.abs(recipe.nutritionPerServing.protein - proteinTarget) / proteinTarget, 1);
                
                return {
                    ...recipe,
                    matchScore: (calorieScore + proteinScore) / 2
                };
            });
            
            // Sort by match score
            recipes.sort((a, b) => b.matchScore - a.matchScore);
        }
        
        // Limit to 10 suggestions
        recipes = recipes.slice(0, 10);
        
        res.status(200).json({ suggestions: recipes });
    } catch (error) {
        console.error('Error getting recipe suggestions:', error);
        res.status(500).json({ error: error.message });
    }
}; 