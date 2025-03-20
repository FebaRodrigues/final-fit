// models/User.js
const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    age: { type: Number, default: null },
    height: { type: Number, default: null },
    weight: { type: Number, default: null },
    gender: { type: String, default: null },
    goals: [{ type: String }],
    image: { type: String, default: "https://res.cloudinary.com/daacjyk3d/image/upload/v1740376690/fitnessApp/gfo0vamcfcurte2gc4jk.jpg" },
    role: { type: String, enum: ['user', 'admin', 'trainer'], default: 'user' },
    lastLogin: { type: Date },
    registrationDate: { type: Date, default: Date.now },
    nutritionPlans: [{ type: mongoose.Schema.Types.ObjectId, ref: 'NutritionPlan' }],
    // New fields for nutrition tracking
    nutritionPreferences: {
        dietType: { 
            type: String, 
            enum: ['standard', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo', 'mediterranean', 'other'],
            default: 'standard'
        },
        allergies: [{ type: String }],
        excludedFoods: [{ type: String }],
        preferredFoods: [{ type: String }],
        mealFrequency: { type: Number, default: 3 }, // Number of meals per day
        dailyGoals: {
            calories: { type: Number, default: 2000 },
            protein: { type: Number, default: 150 }, // in grams
            carbs: { type: Number, default: 200 }, // in grams
            fat: { type: Number, default: 65 }, // in grams
            water: { type: Number, default: 2000 } // in ml
        },
        macroSplit: {
            protein: { type: Number, default: 30 }, // percentage
            carbs: { type: Number, default: 40 }, // percentage
            fat: { type: Number, default: 30 } // percentage
        }
    },
    recentFoods: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FoodDatabase' }],
    favoriteRecipes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }]
});

module.exports = mongoose.model('User', userSchema);