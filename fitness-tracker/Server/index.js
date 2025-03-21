// index.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const MongoStore = require('connect-mongo');
const corsMiddleware = require('./middleware/cors-fix');

// Load environment variables
console.log('=== Loading Environment Variables ===');
dotenv.config();

// Set default values for required environment variables
const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-key-change-in-production',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  SESSION_SECRET: process.env.SESSION_SECRET || 'session-secret-change-in-production'
};

// Validate critical environment variables
if (!ENV.MONGO_URI) {
  console.error('ERROR: MONGO_URI is not defined in environment variables');
  process.exit(1);
}

// Connect to MongoDB
connectDB();

// Initialize MongoStore for session storage
const store = MongoStore.create({
  mongoUrl: ENV.MONGO_URI,
  ttl: 60 * 60, // 1 hour session timeout
  autoRemove: 'native', // Use MongoDB's TTL index
  touchAfter: 24 * 3600, // Only update the session once per day unless data changes
  crypto: {
    secret: ENV.SESSION_SECRET // Encrypt session data
  },
  collectionName: 'sessions' // Specify collection name
});

// Initialize Stripe with the secret key
let stripe;
try {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16' // Specify the API version
  });
  console.log('Stripe initialized successfully with key:', process.env.STRIPE_SECRET_KEY.substring(0, 7) + '...');
} catch (error) {
  console.error('Failed to initialize Stripe:', error.message);
}

// Create the Express app
const app = express();

// IMPORTANT: Add direct debug endpoints BEFORE any other middleware
// These endpoints will be available even if other routes have issues

// Very simple debug endpoint that doesn't require any imports or middleware
app.get('/debug', (req, res) => {
  console.log('Root debug endpoint accessed:', new Date().toISOString());
  res.status(200).json({
    message: 'Root debug endpoint is working',
    timestamp: new Date().toISOString(),
    version: 'v1.0.2 DIRECT ROUTE',
  });
});

// Direct debug endpoint that doesn't rely on the router system
app.get('/api/direct-debug', (req, res) => {
  console.log('Direct debug endpoint accessed:', new Date().toISOString());
  
  let dbStatus = 'unknown';
  try {
    dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  } catch (e) {
    dbStatus = 'error: ' + e.message;
  }
  
  res.status(200).json({
    message: 'Direct debug endpoint is working (bypasses router)',
    timestamp: new Date().toISOString(),
    version: 'v1.0.2 DIRECT ROUTE',
    deploymentTime: '2024-03-20 23:00',
    environment: process.env.NODE_ENV || 'development',
    mongodb: {
      connectionStatus: dbStatus
    },
    request: {
      path: req.path,
      method: req.method,
      headers: req.headers ? {
        host: req.headers.host,
        userAgent: req.headers['user-agent'],
        referer: req.headers.referer
      } : 'none'
    }
  });
});

// First, apply a custom CORS middleware for added flexibility
app.use(corsMiddleware);

// Then use the standard cors module with proper configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    // Whitelist specific origins
    const whitelist = [
      'https://final-fit-frontend.vercel.app',
      'https://final-fit-frontend-dd9nzz0bj-feba-rodrigues-projects.vercel.app',
      'https://final-fit-frontend-ev7xv9kct-feba-rodrigues-projects.vercel.app'
    ];
    
    // Check if origin is in whitelist or matches vercel.app or localhost
    if (
      whitelist.indexOf(origin) !== -1 || 
      origin.includes('vercel.app') || 
      origin.includes('localhost')
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'x-auth-token'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
}));

// Session configuration
app.use(session({
  secret: ENV.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: store,
  cookie: { 
    secure: ENV.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
  }
}));

// Parse raw body for Stripe webhooks
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Parse JSON body for other routes
app.use(express.json());

// Add a simple test endpoint to check if new deployments are working
app.get('/api/test-debug', (req, res) => {
  console.log('Test debug endpoint accessed:', new Date().toISOString());
  res.status(200).json({
    message: 'Test debug endpoint is working - NEWEST VERSION',
    timestamp: new Date().toISOString(),
    deploymentTime: '2024-03-20 22:30',
    version: 'v1.0.1',
    environment: process.env.NODE_ENV || 'development',
    mongodb: {
      connectionStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    },
    session: {
      exists: !!req.session,
      id: req.session?.id || 'none'
    }
  });
});

// Add a health endpoint at the beginning of the routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    environment: ENV.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Add a fallback route for the root path
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Fitness Management System API is running', port: ENV.PORT });
});

// Add a handler for the /api path
app.get('/api', (req, res) => {
    res.status(200).json({ 
        message: 'API is running!', 
        environment: ENV.NODE_ENV,
        endpoints: [
            '/api/users',
            '/api/trainers',
            '/api/admin',
            '/api/workouts',
            '/api/nutrition',
            '/api/memberships',
            '/api/payments',
            '/api/appointments',
            '/api/goals',
            '/api/health',
            '/api/notifications',
            '/api/announcements',
            '/api/reports',
            '/api/test-debug',
            '/api/payments/public-debug',
            '/api/direct-debug',
            '/debug'
        ],
        documentation: 'Contact the developer for API documentation'
    });
});

// Add emergency debug endpoints
app.get('/emergency-debug', (req, res) => {
  res.json({
    message: 'Emergency debug endpoint is working',
    serverTime: new Date().toISOString(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Add a new direct OTP generator endpoint right after the emergency-debug endpoint
app.get('/generate-new-otp/:userId', async (req, res) => {
  try {
    console.log('New OTP generator endpoint accessed:', new Date().toISOString());
    
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({
        message: 'userId parameter is required',
        serverTime: new Date().toISOString()
      });
    }
    
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryDate = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    // Directly create an OTP in the database
    const OTP = require('./models/OTP');
    
    try {
      // First invalidate existing OTPs
      await OTP.updateMany(
        { userId: { $in: [userId.toString(), userId] }, isUsed: false },
        { isUsed: true }
      );
      
      // Create new OTP
      const otpRecord = new OTP({
        userId: userId.toString(),
        code: otp,
        expires: expiryDate,
        purpose: 'payment',
        email: 'test@example.com' // Dummy email since we're not actually sending it
      });
      
      const savedOTP = await otpRecord.save();
      
      // Check if it was saved correctly
      const verifyOtp = await OTP.findOne({
        userId: userId.toString(),
        code: otp,
        isUsed: false
      });
      
      // Return the OTP details
      return res.status(200).json({
        message: 'New OTP generated successfully',
        otp: otp,
        userId: userId.toString(),
        expiresAt: expiryDate.toISOString(),
        savedToDatabase: !!verifyOtp,
        otpId: savedOTP._id.toString(),
        serverTime: new Date().toISOString()
      });
    } catch (dbError) {
      console.error('Database error in OTP generator:', dbError);
      return res.status(500).json({
        message: 'Error creating OTP',
        error: dbError.message,
        serverTime: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error in OTP generator endpoint:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message,
      serverTime: new Date().toISOString()
    });
  }
});

// Emergency OTP verification endpoint
app.post('/emergency-verify-otp', async (req, res) => {
  try {
    console.log('EMERGENCY OTP VERIFICATION ATTEMPT', new Date().toISOString());
    console.log('Request body:', req.body);
    
    const { otp, userId } = req.body;
    
    if (!otp || !userId) {
      return res.status(400).json({ 
        message: 'OTP and userId are required',
        serverTime: new Date().toISOString()
      });
    }
    
    // Convert to strings
    const otpString = otp.toString();
    const userIdString = userId.toString();
    
    // Load OTP model dynamically
    const OTP = require('./models/OTP');
    const Membership = require('./models/Membership');
    
    // Log all OTPs in database for debugging
    const allOTPs = await OTP.find({});
    console.log(`Found ${allOTPs.length} total OTPs in database`);
    
    // Check for any OTP with matching code
    const matchingOTP = await OTP.findOne({ code: otpString });
    if (matchingOTP) {
      console.log('Found OTP with matching code:', matchingOTP);
    } else {
      console.log('No OTP with matching code found');
    }
    
    // Look for an OTP matching both the user and code
    const validOTP = await OTP.findOne({
      userId: { $in: [userIdString, userId] },
      code: otpString,
      isUsed: false,
      expires: { $gt: new Date() }
    });
    
    if (!validOTP) {
      return res.status(400).json({ 
        message: 'No valid OTP found for this user/code combination',
        otpCount: allOTPs.length,
        hasMatchingCode: !!matchingOTP,
        serverTime: new Date().toISOString()
      });
    }
    
    // Mark OTP as used
    validOTP.isUsed = true;
    await validOTP.save();
    
    // Find any pending membership
    const pendingMembership = await Membership.findOne({ 
      userId: { $in: [userIdString, userId] },
      status: 'Pending' 
    }).sort({ createdAt: -1 });
    
    return res.status(200).json({
      message: 'OTP verified successfully via emergency endpoint',
      otpId: validOTP._id,
      hasPendingMembership: !!pendingMembership,
      pendingMembership: pendingMembership || null,
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in emergency OTP verification:', error);
    return res.status(500).json({
      message: 'Server error during emergency OTP verification',
      error: error.message,
      serverTime: new Date().toISOString()
    });
  }
});

// Add a new direct OTP verification endpoint
app.post('/verify-any-otp', async (req, res) => {
  try {
    console.log('Direct OTP verification endpoint accessed:', new Date().toISOString());
    console.log('Request body:', req.body);
    
    const { otp, userId } = req.body;
    
    if (!otp) {
      return res.status(400).json({
        message: 'OTP is required',
        serverTime: new Date().toISOString()
      });
    }
    
    // Convert values to strings
    const otpString = otp.toString();
    const userIdString = userId ? userId.toString() : null;
    
    // Load OTP model
    const OTP = require('./models/OTP');
    
    // Get all available OTPs 
    const allOTPs = await OTP.find({}).sort({ createdAt: -1 }).limit(10);
    
    // Find OTPs that match the provided code
    const matchingOTPs = await OTP.find({ code: otpString });
    
    // Check if there's any valid OTP with this code (unused and not expired)
    const validOTP = await OTP.findOne({
      code: otpString,
      isUsed: false,
      expires: { $gt: new Date() }
    });
    
    // If we have a userId, also try to find an OTP specifically for this user
    let userSpecificOTP = null;
    if (userIdString) {
      userSpecificOTP = await OTP.findOne({
        userId: { $in: [userIdString, userId] },
        isUsed: false,
        expires: { $gt: new Date() }
      });
    }
    
    // If we found a valid OTP, mark it as used
    if (validOTP) {
      validOTP.isUsed = true;
      await validOTP.save();
    }
    
    return res.status(200).json({
      message: 'OTP verification check completed',
      otpProvided: otpString,
      userIdProvided: userIdString,
      recentOTPs: allOTPs.map(o => ({
        id: o._id,
        code: o.code,
        userId: o.userId,
        isUsed: o.isUsed,
        expires: o.expires,
        isExpired: o.expires < new Date()
      })),
      matchingOTPsFound: matchingOTPs.length,
      validOTPFound: !!validOTP,
      userSpecificOTPFound: !!userSpecificOTP,
      verification: {
        success: !!validOTP,
        method: validOTP ? 'any_matching_code' : 'not_found',
        otpDetails: validOTP ? {
          id: validOTP._id,
          userId: validOTP.userId,
          createdAt: validOTP.createdAt
        } : null
      },
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in direct OTP verification endpoint:', error);
    return res.status(500).json({
      message: 'Server error in OTP verification',
      error: error.message,
      serverTime: new Date().toISOString()
    });
  }
});

// Add a version endpoint at the root level for quick verification
app.get('/version', (req, res) => {
  res.json({
    version: 'v1.0.2',
    deployedAt: new Date().toISOString(),
    message: 'OTP fix version with direct endpoints',
    features: [
      'Direct OTP generation', 
      'Universal OTP verification', 
      'Enhanced error handling',
      'Session-independent OTP checking'
    ]
  });
});

// Routes
const userRoutes = require('./routes/users');
const trainerRoutes = require('./routes/trainerRoutes');
const adminRoutes = require('./routes/adminRoutes2');
const workoutRoutes = require('./routes/workouts');
const nutritionRoutes = require('./routes/nutrition');
const membershipRoutes = require('./routes/memberships');
const paymentRoutes = require('./routes/payments');
const appointmentRoutes = require('./routes/appointments');
const goalRoutes = require('./routes/goals');
const healthRoutes = require('./routes/healthRoutes');
const notificationRoutes = require('./routes/notifications');
const announcementRoutes = require('./routes/announcements');
const reportRoutes = require('./routes/reports');
const workoutProgramRoutes = require('./routes/workout-programs');
const reminderRoutes = require('./routes/reminders');
const workoutLogRoutes = require('./routes/workoutLogs');
const nutritionPlanRoutes = require('./routes/nutritionPlans');
const analyticsRoutes = require('./routes/analytics');
const progressReportRoutes = require('./routes/progressReports');
const trainerPaymentRoutes = require('./routes/trainerPayments');
// Add food database and recipe routes
const foodDatabaseRoutes = require('./routes/foodDatabase');
const recipeRoutes = require('./routes/recipes');
// Add SPA routes
const spaRoutes = require('./routes/spa');

console.log('All routes loaded successfully');

// API routes
app.use('/api/users', userRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/workout-programs', workoutProgramRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/workout-logs', workoutLogRoutes);
app.use('/api/nutrition-plans', nutritionPlanRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/progress-reports', progressReportRoutes);
app.use('/api/trainer-payments', trainerPaymentRoutes);
// Add food database and recipe routes
app.use('/api/food-database', foodDatabaseRoutes);
app.use('/api/recipes', recipeRoutes);
// Add SPA routes
app.use('/api/spa', spaRoutes);

console.log('All routes registered successfully');

// Add a catch-all route at the end to handle any invalid API routes
app.all('/api/*', (req, res) => {
  // Extract the path that was tried
  const attemptedPath = req.path;
  
  // List available valid endpoints
  const availableEndpoints = [
    '/api/users',
    '/api/trainers',
    '/api/admin',
    '/api/workouts',
    '/api/nutrition',
    '/api/memberships',
    '/api/payments',
    '/api/appointments',
    '/api/goals',
    '/api/health',
    '/api/notifications',
    '/api/announcements',
    '/api/reports',
    '/api/workout-programs',
    '/api/reminders',
    '/api/workout-logs',
    '/api/nutrition-plans',
    '/api/analytics',
    '/api/progress-reports',
    '/api/trainer-payments',
    '/api/food-database',
    '/api/recipes',
    '/api/spa',
    '/api/payments/public-debug',
    '/api/test-debug',
    '/api/direct-debug',
    '/debug'
  ];
  
  res.status(404).json({
    error: `Cannot ${req.method} ${attemptedPath}`,
    message: 'The requested API endpoint does not exist or you may not have permission to access it.',
    availableEndpoints,
    helpfulEndpoints: [
      '/api/health',
      '/api/payments/public-debug',
      '/api/test-debug',
      '/api/direct-debug',
      '/debug'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Internal Server Error',
    error: ENV.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server if not being imported
if (require.main === module) {
  app.listen(ENV.PORT, () => {
    console.log(`Server running on port ${ENV.PORT}`);
    console.log(`Environment: ${ENV.NODE_ENV}`);
    console.log(`Client URL: ${ENV.CLIENT_URL}`);
  });
}

// Export for Vercel serverless functions
module.exports = app;