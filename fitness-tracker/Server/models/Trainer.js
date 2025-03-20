// models/Trainer.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const trainerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    specialties: { type: [String], required: true },
    approved: { type: Boolean, default: false },
    role: { type: String, default: 'trainer' },
    image: { type: String, default: "https://res.cloudinary.com/daacjyk3d/image/upload/v1740376690/fitnessApp/gfo0vamcfcurte2gc4jk.jpg" },
    createdAt: { type: Date, default: Date.now },
    phone: { type: String }, // Optional: Add phone number
    bio: { type: String },// Optional: Add a short bio
    expectedSalary: { type: Number, required: true }, // Expected monthly salary
    approvedSalary: { type: Number }, // Salary approved by admin
    joinDate: { type: Date }, // Date when trainer was approved
    availability: [{
        day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
        startTime: String, // e.g., "09:00"
        endTime: String,   // e.g., "17:00"
    }],
    certifications: [{
        name: { type: String },
        issuer: { type: String },
        year: { type: String }
    }],
    experience: [{
        position: { type: String },
        organization: { type: String },
        startYear: { type: String },
        endYear: { type: String },
        description: { type: String }
    }]
});

module.exports = mongoose.model('Trainer', trainerSchema);

