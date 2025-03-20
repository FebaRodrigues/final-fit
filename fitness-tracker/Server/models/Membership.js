// models/Membership.js
const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  planType: { 
    type: String, 
    enum: ['Basic', 'Premium', 'Elite'], 
    required: true 
  },
  duration: { 
    type: String, 
    enum: ['Monthly', 'Quarterly', 'Yearly'], 
    required: true 
  },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['Active', 'Expired', 'Pending'], 
    default: 'Pending' 
  },
  price: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Membership', membershipSchema);