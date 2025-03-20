// routes/appointment.js

const express = require('express');
const { bookAppointment, getAppointments, updateAppointmentStatus, getAppointmentsForTrainer } = require('../controllers/appointmentController');
const router = express.Router();

// Add a console log to show that the appointments routes are loaded
console.log('Appointments routes loaded!');

// Create a new appointment
router.post('/', bookAppointment);

// Specific routes should come before generic ones with path parameters
// Get appointments for a trainer
router.get('/trainer/:trainerId', (req, res, next) => {
  console.log(`Trainer appointment request for trainerId: ${req.params.trainerId}`);
  getAppointmentsForTrainer(req, res, next);
});

// Update appointment status
router.put('/:appointmentId', updateAppointmentStatus);

// Get appointments for a user
// This should be the last route to avoid conflicts
router.get('/:userId', (req, res, next) => {
  console.log(`Appointment request for userId: ${req.params.userId}`);
  getAppointments(req, res, next);
});

module.exports = router;