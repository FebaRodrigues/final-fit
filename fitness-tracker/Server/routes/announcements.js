// routes/announcements.js
const express = require('express');
const { 
  createAnnouncement, 
  getAnnouncements 
} = require('../controllers/announcementController');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Create an announcement (Admin)
router.post('/', auth(['admin']), createAnnouncement);

// Get announcements (All, Users, Trainers)
router.get('/', auth(['user', 'trainer', 'admin']), getAnnouncements);

module.exports = router;