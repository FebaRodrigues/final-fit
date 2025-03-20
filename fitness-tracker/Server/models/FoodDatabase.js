const mongoose = require('mongoose');

const foodDatabaseSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        index: true // For faster searching
    },
    category: { 
        type: String, 
        enum: [
            'Fruits', 'Vegetables', 'Grains', 'Protein Foods', 
            'Dairy', 'Oils', 'Beverages', 'Snacks', 'Fast Food',
            'Prepared Meals', 'Supplements', 'Other'
        ],
        index: true
    },
    calories: { type: Number, required: true },
    protein: { type: Number, default: 0 }, // in grams
    carbs: { type: Number, default: 0 }, // in grams
    fat: { type: Number, default: 0 }, // in grams
    fiber: { type: Number, default: 0 }, // in grams
    sugar: { type: Number, default: 0 }, // in grams
    sodium: { type: Number, default: 0 }, // in mg
    cholesterol: { type: Number, default: 0 }, // in mg
    potassium: { type: Number, default: 0 }, // in mg
    vitamins: {
        a: { type: Number, default: 0 }, // in IU
        c: { type: Number, default: 0 }, // in mg
        d: { type: Number, default: 0 }, // in IU
        calcium: { type: Number, default: 0 }, // in mg
        iron: { type: Number, default: 0 } // in mg
    },
    servingSize: { type: Number, default: 100 },
    servingUnit: { 
        type: String, 
        default: 'g',
        enum: ['g', 'ml', 'oz', 'cup', 'tbsp', 'tsp', 'piece', 'serving']
    },
    barcode: { type: String, index: true }, // For barcode scanning
    brand: { type: String },
    isVerified: { type: Boolean, default: false }, // To distinguish between admin-verified and user-added foods
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    popularity: { type: Number, default: 0 }, // For sorting search results
    usdaFdcId: { type: String, index: true } // USDA FoodData Central ID for linking to USDA database
}, { timestamps: true });

// Create text index for search functionality
foodDatabaseSchema.index({ name: 'text', brand: 'text' });

// Method to convert to different serving size
foodDatabaseSchema.methods.convertServing = function(newServingSize) {
    const ratio = newServingSize / this.servingSize;
    
    return {
        name: this.name,
        category: this.category,
        calories: Math.round(this.calories * ratio),
        protein: parseFloat((this.protein * ratio).toFixed(1)),
        carbs: parseFloat((this.carbs * ratio).toFixed(1)),
        fat: parseFloat((this.fat * ratio).toFixed(1)),
        fiber: parseFloat((this.fiber * ratio).toFixed(1)),
        sugar: parseFloat((this.sugar * ratio).toFixed(1)),
        sodium: Math.round(this.sodium * ratio),
        cholesterol: Math.round(this.cholesterol * ratio),
        potassium: Math.round(this.potassium * ratio),
        vitamins: {
            a: Math.round(this.vitamins.a * ratio),
            c: parseFloat((this.vitamins.c * ratio).toFixed(1)),
            d: Math.round(this.vitamins.d * ratio),
            calcium: Math.round(this.vitamins.calcium * ratio),
            iron: parseFloat((this.vitamins.iron * ratio).toFixed(1))
        },
        servingSize: newServingSize,
        servingUnit: this.servingUnit
    };
};

module.exports = mongoose.model('FoodDatabase', foodDatabaseSchema); 