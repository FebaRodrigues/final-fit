// models/Report.js
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    type: { 
        type: String, 
        enum: ['Revenue', 'UserActivity', 'Engagement'], 
        required: true 
    },
    period: { 
        type: String, 
        enum: ['Daily', 'Weekly', 'Monthly', 'Yearly'], 
        required: true 
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    data: {
        totalRevenue: { type: Number, default: 0 }, // For Revenue reports
        paymentCount: { type: Number, default: 0 }, // For Revenue reports
        activeUsers: { type: Number, default: 0 },  // For UserActivity reports
        totalUsers: { type: Number, default: 0 },   // For UserActivity reports
        appointmentCount: { type: Number, default: 0 }, // For Engagement reports
        workoutLogCount: { type: Number, default: 0 },  // For Engagement reports
    },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Report', reportSchema);