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

// Add this route before other routes
router.get('/debug-session', auth(['user']), (req, res) => {
  try {
    // Return session information
    const sessionInfo = {
      hasSession: !!req.session,
      sessionID: req.session?.id || 'none',
      hasOTP: !!(req.session && req.session.otp),
      otpData: req.session?.otp ? {
        exists: true,
        userId: req.session.otp.userId,
        expiresAt: req.session.otp.expires,
        codeLength: req.session.otp.code?.length || 0
      } : 'No OTP data'
    };
    
    console.log('Debug session info:', sessionInfo);
    
    return res.status(200).json({
      message: 'Session debug information',
      session: sessionInfo
    });
  } catch (error) {
    console.error('Error in debug session route:', error);
    return res.status(500).json({ message: 'Error retrieving session information' });
  }
});

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