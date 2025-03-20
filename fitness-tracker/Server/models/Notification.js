// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, refPath: 'recipientModel', required: true },
  recipientModel: { type: String, enum: ['User', 'Trainer'], required: true },
  type: { 
    type: String, 
    enum: [
      'Reminder', 
      'Announcement', 
      'Payment', 
      'Appointment', 
      'Goal', 
      'Workout', 
      'Progress', 
      'trainer_message',
      'progress_report'
    ], 
    required: true 
  },
  message: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Unread', 'Read'], 
    default: 'Unread' 
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notification', notificationSchema);