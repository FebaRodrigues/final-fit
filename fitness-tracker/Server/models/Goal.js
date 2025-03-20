// models/Goal.js
const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
    title: { type: String, required: true },
    targetValue: { type: Number, required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
    notes: { type: String },
});

const goalSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    goalType: { 
        type: String, 
        enum: [
            'weight loss', 
            'weight gain',
            'muscle gain',
            'endurance',
            'distance',
            'calorie intake', 
            'exercise', 
            'step count', 
            'gym workouts',
            'cardio',
            'strength',
            'flexibility',
            'nutrition',
            'custom',
            'weight-loss',
            'weight-gain'
        ], 
        required: true 
    },
    currentValue: { type: Number, required: true },
    targetValue: { type: Number, required: true },
    deadline: { type: Date, required: true },
    frequency: { 
        type: String, 
        enum: ['daily', 'weekly', 'monthly', 'custom'], 
        default: 'custom' 
    },
    notes: { type: String },
    progress: { type: Number, default: 0 }, // Percentage (0-100)
    status: { 
        type: String, 
        enum: ['active', 'completed', 'failed', 'deleted'], 
        default: 'active' 
    },
    milestones: [milestoneSchema],
    workouts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WorkoutProgram' }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
    createdBy: { 
        type: String, 
        enum: ['user', 'trainer'], 
        default: 'user' 
    },
    trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer' },
});

module.exports = mongoose.model('Goal', goalSchema);