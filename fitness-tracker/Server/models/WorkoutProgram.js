// models/WorkoutProgram.js
const mongoose = require('mongoose');

const workoutProgramSchema = new mongoose.Schema({
    trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer', default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isLibraryPlan: { type: Boolean, default: false },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    exercises: [{
        name: { type: String, required: true },
        sets: { type: Number, required: true },
        reps: { type: Number, required: true },
        weight: { type: Number, default: null },
        duration: { type: Number, default: null },
        distance: { type: Number, default: null }, // for cardio exercises
        caloriesBurned: { type: Number, default: null }, // estimated calories
        restTime: { type: Number, default: 60 }, // rest time in seconds
        notes: { type: String, default: '' },
        category: { 
            type: String, 
            enum: ['strength', 'cardio', 'flexibility', 'hiit', 'custom'], 
            default: 'strength' 
        },
    }],
    category: { 
        type: String, 
        enum: ["Strength", "Cardio", "Flexibility", "HIIT", "Custom"], 
        required: true 
    },
    difficulty: {
        type: String,
        enum: ["Beginner", "Intermediate", "Advanced"],
        default: "Beginner"
    },
    estimatedDuration: { type: Number, default: 0 }, // in minutes
    estimatedCaloriesBurn: { type: Number, default: 0 },
    tags: [{ type: String }], // for searchability
    imageUrl: { type: String, default: '' }, // for workout thumbnail
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Add indexes for faster queries
workoutProgramSchema.index({ category: 1 });
workoutProgramSchema.index({ difficulty: 1 });
workoutProgramSchema.index({ isLibraryPlan: 1 });

module.exports = mongoose.model('WorkoutProgram', workoutProgramSchema);