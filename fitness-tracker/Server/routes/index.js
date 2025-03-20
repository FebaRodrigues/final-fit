const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Public routes
router.get('/announcements', adminController.getAnnouncements);

module.exports = router; 