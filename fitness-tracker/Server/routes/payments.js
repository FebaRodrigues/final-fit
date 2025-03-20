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
const OTP = require('../models/OTP');
const router = express.Router();

// Add a public debug endpoint without auth requirement - placed at the top for priority
router.get('/public-debug', async (req, res) => {
  try {
    // Get database health info
    let dbStatus = 'unknown';
    let connectionError = null;
    let otpCollection = null;
    
    try {
      const mongoose = require('mongoose');
      dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
      
      if (dbStatus === 'connected') {
        // Count OTPs in the database
        const otpCount = await require('../models/OTP').countDocuments();
        const activeOtpCount = await require('../models/OTP').countDocuments({
          isUsed: false,
          expires: { $gt: new Date() }
        });
        
        otpCollection = {
          totalCount: otpCount,
          activeCount: activeOtpCount
        };
      }
    } catch (dbErr) {
      connectionError = dbErr.message;
      console.error('Database check error:', dbErr);
    }
    
    // Check session store
    let sessionStore = 'none';
    if (req.session) {
      sessionStore = req.session.store ? 'custom' : 'memory';
      if (req.session.store && req.session.store.constructor) {
        sessionStore = req.session.store.constructor.name;
      }
    }
    
    return res.status(200).json({
      message: 'Public debug information',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbStatus,
        error: connectionError,
        otpCollection
      },
      session: {
        hasSession: !!req.session,
        sessionID: req.session?.id || 'none',
        store: sessionStore
      }
    });
  } catch (error) {
    console.error('Error in public debug route:', error);
    return res.status(500).json({ 
      message: 'Error retrieving debug information',
      error: error.message
    });
  }
});

// Debug route with enhanced OTP information
router.get('/debug-session', auth(['user']), async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get OTPs from database for this user
    let dbOtps = [];
    try {
      dbOtps = await OTP.find({ 
        userId,
        isUsed: false,
        expires: { $gt: new Date() }
      }).select('code expires purpose createdAt');
    } catch (err) {
      console.error('Error fetching OTPs from database:', err);
    }
    
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
      } : 'No OTP data',
      dbOtps: dbOtps.length > 0 ? {
        count: dbOtps.length,
        otps: dbOtps.map(otp => ({
          id: otp._id,
          purpose: otp.purpose,
          expiresAt: otp.expires,
          createdAt: otp.createdAt
        }))
      } : 'No valid OTPs in database'
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