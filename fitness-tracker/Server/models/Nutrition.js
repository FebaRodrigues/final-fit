// models/Nutrition.js
const mongoose = require('mongoose');

// Schema for individual food items
const foodItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    calories: { type: Number, required: true },
    protein: { type: Number, default: 0 }, // in grams
    carbs: { type: Number, default: 0 }, // in grams
    fat: { type: Number, default: 0 }, // in grams
    fiber: { type: Number, default: 0 }, // in grams
    sugar: { type: Number, default: 0 }, // in grams
    servingSize: { type: Number, default: 1 },
    servingUnit: { type: String, default: 'serving' }, // e.g., g, ml, oz, cup
    quantity: { type: Number, default: 1 }
});

// Schema for meals
const mealSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-workout', 'Post-workout', 'Other']
    },
    time: { type: Date, default: Date.now },
    foods: [foodItemSchema],
    notes: { type: String },
    totalCalories: { type: Number, default: 0 },
    totalProtein: { type: Number, default: 0 },
    totalCarbs: { type: Number, default: 0 },
    totalFat: { type: Number, default: 0 }
});

// Schema for water intake
const waterIntakeSchema = new mongoose.Schema({
    amount: { type: Number, required: true }, // in ml or oz
    unit: { type: String, enum: ['ml', 'oz'], default: 'ml' },
    time: { type: Date, default: Date.now }
});

// Main nutrition log schema
const nutritionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now },
    meals: [mealSchema],
    waterIntake: [waterIntakeSchema],
    dailyGoals: {
        calories: { type: Number },
        protein: { type: Number }, // in grams
        carbs: { type: Number }, // in grams
        fat: { type: Number }, // in grams
        water: { type: Number } // in ml or oz
    },
    notes: { type: String },
    // Daily totals (calculated)
    totalCalories: { type: Number, default: 0 },
    totalProtein: { type: Number, default: 0 },
    totalCarbs: { type: Number, default: 0 },
    totalFat: { type: Number, default: 0 },
    totalWater: { type: Number, default: 0 }
}, { timestamps: true });

// Add index for faster queries
nutritionSchema.index({ userId: 1, date: -1 });

// Pre-save middleware to calculate totals
nutritionSchema.pre('save', function(next) {
    console.log('Pre-save middleware running for nutrition log');
    console.log('Meals count:', this.meals.length);
    
    // Calculate meal totals
    this.meals.forEach((meal, index) => {
        console.log(`Processing meal ${index + 1}:`, {
            name: meal.name,
            foodsCount: meal.foods.length
        });
        
        meal.totalCalories = 0;
        meal.totalProtein = 0;
        meal.totalCarbs = 0;
        meal.totalFat = 0;
        
        meal.foods.forEach(food => {
            const multiplier = food.quantity * food.servingSize;
            meal.totalCalories += food.calories * multiplier;
            meal.totalProtein += food.protein * multiplier;
            meal.totalCarbs += food.carbs * multiplier;
            meal.totalFat += food.fat * multiplier;
        });
        
        console.log(`Calculated totals for meal ${index + 1}:`, {
            totalCalories: meal.totalCalories,
            totalProtein: meal.totalProtein,
            totalCarbs: meal.totalCarbs,
            totalFat: meal.totalFat
        });
    });
    
    // Calculate daily totals
    this.totalCalories = this.meals.reduce((sum, meal) => sum + meal.totalCalories, 0);
    this.totalProtein = this.meals.reduce((sum, meal) => sum + meal.totalProtein, 0);
    this.totalCarbs = this.meals.reduce((sum, meal) => sum + meal.totalCarbs, 0);
    this.totalFat = this.meals.reduce((sum, meal) => sum + meal.totalFat, 0);
    
    console.log('Calculated daily totals:', {
        totalCalories: this.totalCalories,
        totalProtein: this.totalProtein,
        totalCarbs: this.totalCarbs,
        totalFat: this.totalFat
    });
    
    // Calculate total water intake
    this.totalWater = this.waterIntake.reduce((sum, water) => {
        // Convert oz to ml if needed for consistency
        const amount = water.unit === 'oz' ? water.amount * 29.5735 : water.amount;
        return sum + amount;
    }, 0);
    
    console.log('Total water intake:', this.totalWater);
    console.log('Pre-save middleware completed');
    
    next();
});

module.exports = mongoose.model('Nutrition', nutritionSchema);