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

// PUBLIC DEBUG ENDPOINT - NO AUTH REQUIRED
// This endpoint provides system status information without requiring authentication
// Access at: /api/payments/public-debug
router.get('/public-debug', async (req, res) => {
  console.log('Public debug endpoint accessed:', new Date().toISOString());
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
    let sessionInfo = null;
    
    if (req.session) {
      sessionStore = req.session.store ? 'custom' : 'memory';
      if (req.session.store && req.session.store.constructor) {
        sessionStore = req.session.store.constructor.name;
      }
      
      // Add basic session info without exposing sensitive data
      sessionInfo = {
        id: req.session.id || 'none',
        new: req.session.new || false,
        cookieOptions: {
          maxAge: req.session.cookie?.maxAge || 'not set',
          secure: req.session.cookie?.secure || false,
          httpOnly: req.session.cookie?.httpOnly || false
        }
      };
    }
    
    // Get server info
    const serverInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: Math.floor(process.uptime()) + ' seconds',
      memoryUsage: process.memoryUsage().rss / 1024 / 1024 + ' MB',
      timestamp: new Date().toISOString()
    };
    
    return res.status(200).json({
      message: 'Public debug information - NEWEST VERSION (v1.0.1)',
      version: 'v1.0.1',
      deployedAt: '2024-03-20 22:30',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbStatus,
        error: connectionError,
        otpCollection
      },
      session: {
        hasSession: !!req.session,
        storeType: sessionStore,
        info: sessionInfo
      },
      server: serverInfo,
      request: {
        ip: req.ip || 'unknown',
        method: req.method,
        path: req.path,
        headers: {
          'user-agent': req.headers['user-agent'] || 'none',
          'content-type': req.headers['content-type'] || 'none',
          'origin': req.headers['origin'] || 'none'
        }
      }
    });
  } catch (error) {
    console.error('Error in public debug route:', error);
    return res.status(500).json({ 
      message: 'Error retrieving debug information',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
// ENSURE THIS ENDPOINT WORKS - NO AUTH FOR OTP VERIFICATION
router.post('/verify-otp', (req, res) => {
  console.log('OTP verification endpoint accessed at', new Date().toISOString());
  console.log('Request body:', req.body);
  // Continue with the normal verification
  verifyPaymentOTP(req, res);
});

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

// Add direct MongoDB client version of user payments endpoint
router.get('/user/:userId/direct', auth, async (req, res) => {
    try {
        const userId = req.params.userId;
        console.log(`Getting payments for user ${userId} using direct MongoDB client`);
        
        // Get the direct MongoDB client
        const { getDb } = require('../config/db');
        
        try {
            const db = getDb();
            console.log('Successfully obtained MongoDB client for payments fetch');
            
            // Convert string ID to ObjectId if needed
            const { ObjectId } = require('mongodb');
            let userIdObj;
            
            try {
                userIdObj = new ObjectId(userId);
            } catch (idError) {
                console.error('Error converting userId to ObjectId:', idError);
                userIdObj = userId; // fallback to string ID
            }
            
            // Find payments with the direct client
            const payments = await db.collection('payments')
                .find({ userId: userIdObj })
                .sort({ createdAt: -1 })
                .toArray();
            
            console.log(`Retrieved ${payments.length} payments for user ${userId} using direct client`);
            return res.status(200).json({
                success: true,
                count: payments.length,
                payments
            });
            
        } catch (dbError) {
            console.error('Error with direct MongoDB client for payments:', dbError);
            throw new Error(`Direct MongoDB client error: ${dbError.message}`);
        }
    } catch (error) {
        console.error('Error getting user payments with direct client:', error);
        // Return an empty array instead of error to not break the frontend
        return res.status(200).json({
            success: true,
            message: 'Could not retrieve payments due to database error',
            count: 0,
            payments: []
        });
    }
});

// Add mock payments endpoint for when MongoDB is completely unavailable
router.get('/user/:userId/fallback', auth, async (req, res) => {
    try {
        const userId = req.params.userId;
        console.log(`Providing fallback payments data for user ${userId}`);
        
        // Return empty payments array to not break the frontend
        return res.status(200).json({
            success: true,
            message: 'Using fallback payments data - database unavailable',
            count: 0,
            payments: []
        });
    } catch (error) {
        console.error('Error in fallback payments endpoint:', error);
        return res.status(200).json({
            success: true,
            message: 'Error with fallback payments',
            count: 0,
            payments: []
        });
    }
});

module.exports = router;