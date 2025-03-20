const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
    food: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodDatabase' },
    name: { type: String, required: true }, // Denormalized for performance
    amount: { type: Number, required: true },
    unit: { type: String, required: true },
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 }
});

const recipeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    ingredients: [ingredientSchema],
    instructions: [{ type: String }],
    prepTime: { type: Number }, // in minutes
    cookTime: { type: Number }, // in minutes
    servings: { type: Number, default: 1 },
    image: { type: String },
    tags: [{ type: String }], // e.g., "breakfast", "high-protein", "low-carb"
    mealType: { 
        type: String, 
        enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-workout', 'Post-workout', 'Other'],
        required: true
    },
    dietType: [{ 
        type: String, 
        enum: ['standard', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo', 'mediterranean', 'gluten-free', 'dairy-free', 'other']
    }],
    // Nutritional information per serving
    nutritionPerServing: {
        calories: { type: Number, default: 0 },
        protein: { type: Number, default: 0 },
        carbs: { type: Number, default: 0 },
        fat: { type: Number, default: 0 },
        fiber: { type: Number, default: 0 },
        sugar: { type: Number, default: 0 }
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isPublic: { type: Boolean, default: true },
    popularity: { type: Number, default: 0 }, // For sorting search results
    rating: { type: Number, min: 0, max: 5, default: 0 },
    ratingCount: { type: Number, default: 0 }
}, { timestamps: true });

// Create text index for search functionality
recipeSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Pre-save middleware to calculate nutrition per serving
recipeSchema.pre('save', function(next) {
    // Calculate total nutrition
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;
    let totalSugar = 0;
    
    this.ingredients.forEach(ingredient => {
        totalCalories += ingredient.calories || 0;
        totalProtein += ingredient.protein || 0;
        totalCarbs += ingredient.carbs || 0;
        totalFat += ingredient.fat || 0;
    });
    
    // Calculate per serving
    const servings = this.servings || 1;
    this.nutritionPerServing = {
        calories: Math.round(totalCalories / servings),
        protein: parseFloat((totalProtein / servings).toFixed(1)),
        carbs: parseFloat((totalCarbs / servings).toFixed(1)),
        fat: parseFloat((totalFat / servings).toFixed(1)),
        fiber: parseFloat((totalFiber / servings).toFixed(1)),
        sugar: parseFloat((totalSugar / servings).toFixed(1))
    };
    
    next();
});

module.exports = mongoose.model('Recipe', recipeSchema); 