// routes/trainerPayments.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
    getTrainerPayments,
    createTrainerPayment,
    generateMonthlyPayments,
    getTrainerPaymentStats
} = require('../controllers/trainerPaymentController');

// Get all payments for a trainer (trainer and admin access)
router.get('/:trainerId', auth(['trainer', 'admin']), getTrainerPayments);

// Get payment statistics for a trainer (trainer and admin access)
router.get('/stats/:trainerId', auth(['trainer', 'admin']), getTrainerPaymentStats);

// Create a new payment for a trainer (admin only)
router.post('/', auth(['admin']), createTrainerPayment);

// Generate monthly payments for all trainers (admin only)
router.post('/generate-monthly', auth(['admin']), generateMonthlyPayments);

module.exports = router; 