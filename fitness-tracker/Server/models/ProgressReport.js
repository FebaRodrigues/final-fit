const mongoose = require('mongoose');

const progressDataSchema = new mongoose.Schema({
  weightProgress: [{
    date: { type: Date },
    weight: { type: Number }
  }],
  workoutProgress: [{
    date: { type: Date },
    duration: { type: Number },
    exercises: [{ type: Object }]
  }],
  goalProgress: [{
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal' },
    title: { type: String },
    type: { type: String },
    targetValue: { type: Number },
    currentValue: { type: Number },
    progress: { type: Number }, // percentage
    status: { type: String }
  }]
}, { _id: false });

const metricsSchema = new mongoose.Schema({
  workoutsCompleted: { type: Number, default: 0 },
  averageDuration: { type: Number, default: 0 },
  caloriesBurned: { type: Number, default: 0 },
  goalsAchieved: { type: Number, default: 0 },
  consistency: { type: Number, default: 0 } // percentage
}, { _id: false });

const progressReportSchema = new mongoose.Schema({
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  period: {
    type: String,
    enum: ['week', 'month', '3months'],
    default: 'month'
  },
  notes: {
    type: String,
    default: ''
  },
  recommendations: {
    type: String,
    default: ''
  },
  progressData: {
    type: progressDataSchema,
    default: () => ({})
  },
  metrics: {
    type: metricsSchema,
    default: () => ({})
  },
  viewed: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const ProgressReport = mongoose.model('ProgressReport', progressReportSchema);

module.exports = ProgressReport; 