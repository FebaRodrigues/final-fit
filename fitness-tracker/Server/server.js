// server.js - Alternative server entry point
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Try to load environment variables from multiple locations
console.log('=== Loading Environment Variables ===');

// First try the server .env file
const serverEnvPath = path.resolve(__dirname, '.env');
if (fs.existsSync(serverEnvPath)) {
  console.log(`Loading .env from: ${serverEnvPath}`);
  dotenv.config({ path: serverEnvPath });
} else {
  console.log(`Server .env file not found at: ${serverEnvPath}`);
}

// If MONGO_URI is still not defined, try the root .env file
if (!process.env.MONGO_URI) {
  const rootEnvPath = path.resolve(__dirname, '../../.env');
  if (fs.existsSync(rootEnvPath)) {
    console.log(`Loading .env from: ${rootEnvPath}`);
    dotenv.config({ path: rootEnvPath });
  } else {
    console.log(`Root .env file not found at: ${rootEnvPath}`);
  }
}

// Connect to MongoDB
const connectDB = require('./config/db');

// Verify critical environment variables
if (!process.env.MONGO_URI) {
  console.error('ERROR: MONGO_URI is not defined in environment variables');
}

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('ERROR: STRIPE_SECRET_KEY is not defined in environment variables');
}

const app = express();

// Function to initialize the application
const initializeApp = async () => {
  try {
    // First connect to MongoDB and wait for connection to be established
    console.log('Connecting to MongoDB before initializing the application...');
    await connectDB();
    console.log('MongoDB connection established successfully');
    
    // Session configuration - initialized after DB connection
    app.use(session({
      secret: process.env.SESSION_SECRET || 'your-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax'
      }
    }));
    
    // Parse JSON body
    app.use(express.json());
    
    // Configure CORS
    app.use(cors({
      origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
    
    // Serve static files from the public directory
    const publicDir = path.join(__dirname, 'public');
    if (!fs.existsSync(publicDir)) {
      console.log(`Public directory not found at: ${publicDir}`);
      // Create the directory
      try {
        fs.mkdirSync(path.join(publicDir, 'uploads'), { recursive: true });
        console.log(`Created public uploads directory at: ${path.join(publicDir, 'uploads')}`);
      } catch (err) {
        console.error('Error creating public uploads directory:', err);
      }
    }
    
    // Serve static files
    console.log(`Serving static files from: ${publicDir}`);
    app.use(express.static(publicDir));
    app.use('/uploads', express.static(path.join(publicDir, 'uploads')));
    
    // Enhanced request logging middleware
    app.use((req, res, next) => {
        const start = Date.now();
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} from ${ip}`);
        console.log(`Headers: ${JSON.stringify(req.headers)}`);
        
        if (req.body && Object.keys(req.body).length > 0) {
            // Log the body but hide sensitive fields
            const sanitizedBody = { ...req.body };
            if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
            if (sanitizedBody.token) sanitizedBody.token = '[REDACTED]';
            console.log(`Body: ${JSON.stringify(sanitizedBody)}`);
        }
        
        // Capture response when it completes
        res.on('finish', () => {
            const duration = Date.now() - start;
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} completed with status ${res.statusCode} in ${duration}ms`);
        });
        
        next();
    });
    
    // Basic health check endpoint
    app.get('/api/health', (req, res) => {
      res.status(200).json({ 
        status: 'ok', 
        message: 'Server is running',
        mongoConnected: mongoose.connection.readyState === 1,
        stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
        database: mongoose.connection.db?.databaseName || 'unknown'
      });
    });
    
    // Import routes
    const userRoutes = require('./routes/users');
    const trainerRoutes = require('./routes/trainerRoutes');
    // Use only the adminRoutes2 file to avoid conflicts
    const adminRoutes = require('./routes/adminRoutes2');
    // const adminRoutesAlt = require('./routes/admin');
    const workoutRoutes = require('./routes/workouts');
    const workoutProgramRoutes = require('./routes/workoutPrograms');
    const nutritionRoutes = require('./routes/nutrition');
    const nutritionPlanRoutes = require('./routes/nutritionPlans');
    const paymentRoutes = require('./routes/payments');
    const membershipRoutes = require('./routes/memberships');
    const goalRoutes = require('./routes/goals');
    // Add workoutLogs routes
    const workoutLogRoutes = require('./routes/workoutLogs');
    // Add appointments routes
    const appointmentRoutes = require('./routes/appointments');
    // Add notifications routes
    const notificationRoutes = require('./routes/notifications');
    // New routes
    const foodDatabaseRoutes = require('./routes/foodDatabase');
    const recipeRoutes = require('./routes/recipes');
    const spaRoutes = require('./routes/spa');
    const analyticsRoutes = require('./routes/analytics');
    
    // Import the index routes
    const indexRoutes = require('./routes/index');
    
    // Register routes
    app.use('/api', indexRoutes); // Public routes
    app.use('/api/users', userRoutes);
    app.use('/api/trainers', trainerRoutes);
    // Register only the admin route file
    app.use('/api/admin', adminRoutes);
    app.use('/api/workouts', workoutRoutes);
    app.use('/api/workout-programs', workoutProgramRoutes);
    app.use('/api/nutrition', nutritionRoutes);
    app.use('/api/nutrition-plans', nutritionPlanRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/memberships', membershipRoutes);
    app.use('/api/goals', goalRoutes);
    // Add workoutLogs routes
    app.use('/api/workout-logs', workoutLogRoutes);
    // Add appointments routes
    app.use('/api/appointments', appointmentRoutes);
    // Register notifications routes
    app.use('/api/notifications', notificationRoutes);
    // New routes
    app.use('/api/food-database', foodDatabaseRoutes);
    app.use('/api/recipes', recipeRoutes);
    app.use('/api/spa', spaRoutes);
    app.use('/api/analytics', analyticsRoutes);
    
    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ 
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    });
    
    // Always use port 5050 to maintain data consistency
    const PORT = 5050;
    
    // Start the server with better error handling
    try {
      const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
        console.log(`MongoDB connection status: ${mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'}`);
        console.log(`Connected to database: ${mongoose.connection.db?.databaseName || 'unknown'}`);
        
        // Save the port to a file for the client to detect
        try {
          const portFilePath = path.join(__dirname, '..', 'current-port.txt');
          fs.writeFileSync(portFilePath, PORT.toString());
          console.log(`Port ${PORT} saved to ${portFilePath}`);
          
          // Also save to client public directory if it exists
          const clientPublicPath = path.join(__dirname, '..', 'Client', 'gym', 'public', 'server-port.txt');
          if (fs.existsSync(path.dirname(clientPublicPath))) {
            fs.writeFileSync(clientPublicPath, PORT.toString());
            console.log(`Port ${PORT} saved to client public directory`);
          }
        } catch (err) {
          console.error('Error saving port to file:', err);
        }
      });
  
      server.on('error', (e) => {
        if (e.code === 'EADDRINUSE') {
          console.error(`Port ${PORT} is already in use. Please close any other applications using this port.`);
          console.error('This application must run on port 5050 to maintain data consistency.');
          process.exit(1);
        } else {
          console.error('Server error:', e);
        }
      });
  
      return server;
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
};

// Call the initialization function to properly start the app
initializeApp(); 