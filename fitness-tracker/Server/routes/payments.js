// routes/payments.js
const express = require('express');
const { 
  createPayment, 
  getUserPayments, 
  getTrainerPayments, 
  updatePaymentStatus, 
  getAllPayments, 
  handleStripeWebhook,
  sendPaymentOTP,
  verifyPaymentOTP,
  verifyStripeSession,
  createPendingPayment
} = require('../controllers/paymentController');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Payment processing routes
router.post('/', auth(['user']), createPayment);
router.post('/retry', auth(['user']), createPayment);
router.post('/create-pending', auth(['user']), createPendingPayment);
// Make verify-session public so it can be accessed from the payment success page without authentication
router.get('/verify-session', auth(['user']), verifyStripeSession);
router.post('/send-otp', auth(['user']), sendPaymentOTP);
router.post('/verify-otp', auth(['user']), verifyPaymentOTP);

// Payment history routes
router.get('/user/:userId', auth(['user']), getUserPayments);
router.get('/trainer/:trainerId', auth(['trainer']), getTrainerPayments);
router.get('/all', auth(['admin']), getAllPayments);

// Payment management routes
router.put('/:paymentId', auth(['admin']), updatePaymentStatus);

// Stripe webhook (no auth required as it's called by Stripe)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

// Placeholder for payment routes
router.get('/', auth(['user', 'admin']), (req, res) => {
  res.status(200).json({ message: 'Payments route is working' });
});

module.exports = router;