// controllers/notificationController.js
const Notification = require('../models/Notification');
const User = require('../models/User');
const Trainer = require('../models/Trainer');

exports.createNotification = async (req, res) => {
  const { recipientId, recipientModel, type, message } = req.body;
  try {
    const notification = new Notification({ recipientId, recipientModel, type, message });
    await notification.save();
    res.status(201).json({ message: 'Notification created', notification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a welcome notification for a new user
exports.createWelcomeNotification = async (userId) => {
  try {
    const notification = new Notification({
      recipientId: userId,
      recipientModel: 'User',
      type: 'Announcement',
      message: 'Welcome to the fitness management system! Start your fitness journey today.',
      status: 'Unread',
      createdAt: new Date()
    });
    
    await notification.save();
    console.log(`Welcome notification created for user ${userId}`);
    return notification;
  } catch (error) {
    console.error('Error creating welcome notification:', error);
    return null;
  }
};

exports.sendNotification = async (req, res) => {
  const { userId, trainerId, message, type = 'Announcement' } = req.body;
  
  try {
    // Determine recipient ID and model
    let recipientId, recipientModel;
    
    if (userId) {
      // Sending to a user
      recipientId = userId;
      recipientModel = 'User';
      
      // Verify user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
    } else if (trainerId) {
      // Sending to a trainer
      recipientId = trainerId;
      recipientModel = 'Trainer';
      
      // Verify trainer exists
      const trainer = await Trainer.findById(trainerId);
      if (!trainer) {
        return res.status(404).json({ message: 'Trainer not found' });
      }
    } else {
      return res.status(400).json({ message: 'Either userId or trainerId must be provided' });
    }
    
    // Create the notification
    const notification = new Notification({
      recipientId,
      recipientModel,
      type,
      message,
      status: 'Unread'
    });
    
    await notification.save();
    
    res.status(201).json({
      message: 'Notification sent successfully',
      notification
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ message: 'Failed to send notification', error: error.message });
  }
};

exports.getNotifications = async (req, res) => {
  const { recipientId } = req.params;
  try {
    // Determine the recipient model based on the URL path
    let recipientModel;
    
    console.log('Request path:', req.originalUrl);
    
    if (req.originalUrl.includes('/user/')) {
      recipientModel = 'User';
    } else if (req.originalUrl.includes('/trainer/')) {
      recipientModel = 'Trainer';
    } else {
      // For the legacy endpoint, use the user's role to determine the model
      recipientModel = req.user && req.user.role === 'trainer' ? 'Trainer' : 'User';
    }
    
    console.log(`Fetching notifications for ${recipientModel} with ID: ${recipientId}`);
    
    // If this is a User, get their registration date
    let registrationDate = null;
    if (recipientModel === 'User') {
      const user = await User.findById(recipientId);
      if (user) {
        registrationDate = user.registrationDate || null;
      }
    }
    
    // Create sample notifications if none exist (for development purposes)
    const notificationsCount = await Notification.countDocuments({ 
      recipientId, 
      recipientModel 
    });
    
    if (notificationsCount === 0) {
      console.log(`No notifications found for ${recipientModel} ${recipientId}, creating sample notifications`);
      
      // Create sample notifications
      const sampleNotifications = [
        {
          recipientId,
          recipientModel,
          type: 'Announcement',
          message: 'Welcome to the fitness management system!',
          status: 'Unread',
          createdAt: new Date()
        },
        {
          recipientId,
          recipientModel,
          type: 'Reminder',
          message: recipientModel === 'Trainer' ? 
            'You have upcoming client sessions this week.' : 
            'Don\'t forget your workout session today!',
          status: 'Unread',
          createdAt: new Date(Date.now() - 86400000) // 1 day ago
        }
      ];
      
      await Notification.insertMany(sampleNotifications);
    }
    
    // Build the query
    const query = { 
      recipientId, 
      recipientModel
    };
    
    // Only show notifications created after the user's registration date
    if (registrationDate) {
      query.createdAt = { $gte: registrationDate };
    }
    
    const notifications = await Notification.find(query).sort({ createdAt: -1 }); // Sort by newest first
    
    console.log(`Found ${notifications.length} notifications`);
    
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.markNotificationAsRead = async (req, res) => {
  const { notificationId } = req.params;
  try {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { status: 'Read' },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.status(200).json({ message: 'Notification marked as read', notification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};