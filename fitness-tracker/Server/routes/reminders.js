//routes/reminders.js
const express = require('express');
const { setReminder, getReminders } = require('../controllers/reminderController'); // Adjust the path as necessary

const router = express.Router();

// Define the routes
router.post('/', setReminder); // POST /api/reminders
router.get('/:userId', getReminders); // GET /api/reminders/:userId

module.exports = router;
