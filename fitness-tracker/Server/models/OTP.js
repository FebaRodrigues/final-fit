const mongoose = require('mongoose');

// Define OTP schema
const otpSchema = new mongoose.Schema({
  userId: {
    type: String, // Store userId as string for consistent comparison
    required: true
  },
  code: {
    type: String,
    required: true
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  purpose: {
    type: String,
    enum: ['payment', 'auth', 'reset-password', 'email-verification'],
    default: 'payment'
  },
  email: {
    type: String,
    required: false
  },
  expires: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Auto-delete after 24 hours
  }
});

// Create index for faster OTP lookups by code
otpSchema.index({ code: 1 });

// Create compound index for user-specific OTP lookups
otpSchema.index({ userId: 1, isUsed: 1, expires: 1 });

// Create TTL index based on expires field to automatically remove expired OTPs
otpSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP; 