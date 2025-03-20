// routes/notifications.js
const express = require('express');
const { 
  createNotification, 
  getNotifications, 
  markNotificationAsRead,
  sendNotification
} = require('../controllers/notificationController');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Create a notification (Admin or System)
router.post('/', auth(['admin']), createNotification);

// Send a notification (can be used by trainers, users, or admin)
router.post('/send', auth(['user', 'trainer', 'admin']), sendNotification);

// Get notifications for a user
router.get('/user/:recipientId', auth(['user', 'admin']), getNotifications);

// Get notifications for a trainer
router.get('/trainer/:recipientId', auth(['trainer', 'admin']), getNotifications);

// Legacy endpoint - keep for backward compatibility
router.get('/:recipientId', auth(['user', 'trainer']), getNotifications);

// Mark notification as read
router.put('/:notificationId', auth(['user', 'trainer']), markNotificationAsRead);

module.exports = router;