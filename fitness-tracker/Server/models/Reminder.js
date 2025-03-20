//models/Reminder.js

const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User ', required: true },
    type: { type: String, enum: ['workout', 'meal'], required: true },
    time: { type: String, required: true }, // e.g., '08:00'
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Reminder', reminderSchema);