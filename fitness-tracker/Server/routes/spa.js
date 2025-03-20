// routes/spa.js
const express = require('express');
const { 
  getAllSpaServices,
  getSpaServiceById,
  createSpaService,
  updateSpaService,
  deleteSpaService,
  getUserSpaBookings,
  checkFreeSessionEligibility,
  createBooking,
  updateSpaBookingStatus,
  cancelSpaBooking,
  getAllSpaBookings,
  generateSpaReport
} = require('../controllers/spaController');
const { auth } = require('../middleware/auth');
const membershipAccess = require('../middleware/membershipAccess');
const router = express.Router();

// SPA Services routes
router.get('/services', auth(['user', 'trainer', 'admin']), membershipAccess.basic, getAllSpaServices);
router.get('/services/:serviceId', auth(['user', 'trainer', 'admin']), membershipAccess.basic, getSpaServiceById);
router.post('/services', auth(['admin']), createSpaService);
router.put('/services/:serviceId', auth(['admin']), updateSpaService);
router.delete('/services/:serviceId', auth(['admin']), deleteSpaService);

// SPA Bookings routes
router.get('/bookings/user/:userId', auth(['user', 'admin']), membershipAccess.basic, getUserSpaBookings);
router.get('/bookings/free-eligibility/:userId', auth(['user', 'admin']), membershipAccess.basic, checkFreeSessionEligibility);
router.post('/bookings', auth(['user']), membershipAccess.basic, createBooking);
router.put('/bookings/:bookingId', auth(['admin']), updateSpaBookingStatus);
router.delete('/bookings/:bookingId', auth(['user', 'admin']), membershipAccess.basic, cancelSpaBooking);
router.get('/bookings', auth(['admin']), getAllSpaBookings);

// SPA Reports route
router.get('/report', auth(['admin']), generateSpaReport);

module.exports = router; 