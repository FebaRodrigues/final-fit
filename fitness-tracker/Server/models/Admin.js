// models/Admin.js
const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    name: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, default: 'admin' }, // Add role field
    image: { type: String, default: '' }, // Add image field
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Admin', adminSchema);