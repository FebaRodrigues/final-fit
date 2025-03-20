// models/WorkoutLog.js
const mongoose = require('mongoose');

const workoutLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    workoutId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkoutProgram', required: false },
    title: { type: String, required: true, default: 'Workout Session' },
    date: { type: Date, default: Date.now },
    duration: { type: Number, default: 0 }, // in minutes
    exercises: [{
        name: { type: String, required: true },
        category: { 
            type: String, 
            enum: ['strength', 'cardio', 'flexibility', 'hiit', 'custom'], 
            default: 'strength' 
        },
        setsCompleted: { type: Number, default: 0 },
        repsCompleted: { type: Number, default: 0 },
        weight: { type: Number, default: 0 }, // in kg or lbs
        distance: { type: Number }, // for cardio exercises (in km or miles)
        duration: { type: Number }, // for cardio exercises (in minutes)
        caloriesBurned: { type: Number, default: 0 }, // calories burned per exercise
        notes: { type: String },
        difficulty: { type: Number, min: 1, max: 10 }, // subjective difficulty rating
        restTime: { type: Number }, // rest time between sets in seconds
        personalRecord: { type: Boolean, default: false }, // flag for personal records
    }],
    workoutType: {
        type: String,
        enum: ['strength', 'cardio', 'flexibility', 'hiit', 'custom'],
        default: 'strength'
    },
    caloriesBurned: { type: Number, default: 0 },
    feelingRating: { type: Number, min: 1, max: 5 }, // how the user felt after workout
    notes: { type: String },
    location: { type: String }, // gym, home, outdoors, etc.
    weather: { type: String }, // for outdoor workouts
    photoUrls: [{ type: String }], // for progress photos
    isPublic: { type: Boolean, default: false }, // for social sharing
    isCustomWorkout: { type: Boolean, default: false }, // flag for custom workouts
    completionStatus: { 
        type: String, 
        enum: ['completed', 'partial', 'planned'], 
        default: 'completed' 
    },
}, { timestamps: true });

// Add index for faster queries
workoutLogSchema.index({ userId: 1, date: -1 });
workoutLogSchema.index({ workoutType: 1 }); // Add index for workout type for faster filtering

module.exports = mongoose.model('WorkoutLog', workoutLogSchema);