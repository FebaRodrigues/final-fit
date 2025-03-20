const mongoose = require('mongoose');

// Define OTP schema
const otpSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  code: {
    type: String,
    required: true
  },
  expires: {
    type: Date,
    required: true,
    index: { expires: '1h' } // Auto-delete expired OTPs after 1 hour
  },
  purpose: {
    type: String,
    enum: ['payment', 'registration', 'password-reset', 'other'],
    default: 'payment'
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  email: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create TTL index on expires field
otpSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP; 