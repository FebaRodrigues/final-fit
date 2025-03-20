const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  suggestions: {
    type: [String],
    default: []
  },
  calories: {
    type: Number
  }
});

const nutritionPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    default: 'Personal Nutrition Plan'
  },
  description: {
    type: String,
    default: 'Customized nutrition plan based on your goals and preferences'
  },
  targetCalories: {
    type: Number,
    min: 0
  },
  macroSplit: {
    protein: {
      type: Number,
      min: 0,
      max: 100,
      default: 30
    },
    carbs: {
      type: Number,
      min: 0,
      max: 100,
      default: 40
    },
    fat: {
      type: Number,
      min: 0,
      max: 100,
      default: 30
    }
  },
  meals: {
    type: [mealSchema],
    default: []
  },
  recommendations: {
    type: [String],
    default: []
  },
  restrictions: {
    type: [String],
    default: []
  },
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Validate that macros add up to 100% if all are provided
nutritionPlanSchema.pre('validate', function(next) {
  if (this.macroSplit && this.macroSplit.protein !== undefined && 
      this.macroSplit.carbs !== undefined && this.macroSplit.fat !== undefined) {
    const { protein, carbs, fat } = this.macroSplit;
    if (protein + carbs + fat !== 100) {
      this.invalidate('macroSplit', 'Macros must add up to 100%');
    }
  }
  next();
});

const NutritionPlan = mongoose.model('NutritionPlan', nutritionPlanSchema);

module.exports = NutritionPlan; 