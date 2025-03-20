// routes/trainers.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// Placeholder for trainer routes
router.get('/', auth(['admin']), (req, res) => {
  res.status(200).json({ message: 'Trainers route is working' });
});

module.exports = router; 