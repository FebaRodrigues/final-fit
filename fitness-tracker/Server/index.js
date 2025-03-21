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

// Initialize MongoStore configuration but defer creation until DB is connected
const getMongoStore = () => {
  return MongoStore.create({
    mongoUrl: ENV.MONGO_URI,
    ttl: 60 * 60, // 1 hour session timeout
    autoRemove: 'native', // Use MongoDB's TTL index
    touchAfter: 24 * 3600, // Only update the session once per day unless data changes
    crypto: {
      secret: ENV.SESSION_SECRET // Encrypt session data
    },
    collectionName: 'sessions' // Specify collection name
  });
};

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

// Configure CORS - Set it up early in the middleware chain
const corsOptions = {
  origin: ['https://final-fit-frontend.vercel.app', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'x-auth-token'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Backup CORS headers for any route that might bypass the CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || 'https://final-fit-frontend.vercel.app');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-auth-token');
  res.header('Access-Control-Max-Age', '86400');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`OPTIONS request received from ${req.headers.origin} for ${req.path}`);
    return res.status(204).end();
  }
  next();
});

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
    timestamp: new Date().toISOString(),
    mongodb: {
      connectionStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      database: mongoose.connection.db?.databaseName || 'not connected'
    }
  });
});

// Add a CORS test endpoint
app.get('/api/test-cors', (req, res) => {
  console.log('CORS test endpoint accessed from:', req.headers.origin);
  res.status(200).json({
    success: true,
    message: 'CORS is working correctly',
    timestamp: new Date().toISOString(),
    headers: {
      'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': res.getHeader('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': res.getHeader('Access-Control-Allow-Headers'),
      'Access-Control-Allow-Credentials': res.getHeader('Access-Control-Allow-Credentials')
    },
    request: {
      origin: req.headers.origin,
      referer: req.headers.referer,
      host: req.headers.host,
      method: req.method,
      path: req.path
    }
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

// CRITICAL: First establish database connection, then initialize session middleware and routes
const startServer = async () => {
  try {
    // Wait for the database connection before proceeding
    console.log('Establishing MongoDB connection before starting server...');
    await connectDB();
    console.log('MongoDB connection established successfully');
    
    // Now that the database is connected, initialize the session store
    const store = getMongoStore();
    
    // Session configuration - initialize after DB connection
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
          
          if (!verifyOtp) {
            return res.status(500).json({
              message: 'Failed to save OTP',
              serverTime: new Date().toISOString()
            });
          }
          
          return res.status(200).json({
            message: 'OTP generated successfully',
            otp: otp, // Return OTP directly in response (for testing only)
            expiryDate: expiryDate,
            userId: userId,
            serverTime: new Date().toISOString()
          });
          
        } catch (dbError) {
          console.error('Database error generating OTP:', dbError);
          return res.status(500).json({
            message: 'Database error generating OTP',
            error: dbError.message,
            serverTime: new Date().toISOString()
          });
        }
        
      } catch (error) {
        console.error('Error generating OTP:', error);
        return res.status(500).json({
          message: 'Error generating OTP',
          error: error.message,
          serverTime: new Date().toISOString()
        });
      }
    });
    
    // Import and register routes here
    // Define routes to avoid circular dependencies
    const userRoutes = require('./routes/userRoutes');
    const adminRoutes = require('./routes/adminRoutes');
    
    // Register routes after DB connection is established
    app.use('/api/users', userRoutes);
    app.use('/api/admin', adminRoutes);

    // Start the Express server
    app.listen(ENV.PORT, () => {
      console.log(`Server running on port ${ENV.PORT}`);
      console.log(`API available at: http://localhost:${ENV.PORT}/api`);
      console.log(`Health check at: http://localhost:${ENV.PORT}/api/health`);
      console.log(`MongoDB connection status: ${mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'}`);
      console.log(`Connected to database: ${mongoose.connection.db?.databaseName || 'unknown'}`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();