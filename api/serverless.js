// api/serverless.js - Completely standalone serverless function for Vercel
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Create the Express app
const app = express();

// CORS configuration
app.use(cors({
  origin: 'https://final-fit-frontend.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));

// Handle OPTIONS requests
app.options('*', cors());

// Body parser
app.use(express.json());

// Add manual CORS headers as fallback
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://final-fit-frontend.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Serverless function is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'API is healthy',
    timestamp: new Date().toISOString()
  });
});

// Root API endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'API is running in pure serverless mode',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint
app.get('/api/debug', (req, res) => {
  res.status(200).json({
    message: 'Debug endpoint',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'unknown',
    headers: req.headers
  });
});

// User routes
// ============

// Test user endpoint
app.get('/api/user/test', (req, res) => {
  res.json({ message: 'User routes are working' });
});

// Test login endpoint that bypasses database
app.post('/api/user/login-test', async (req, res) => {
  try {
    console.log('Test login endpoint accessed:', new Date().toISOString());
    
    const { email, password } = req.body;
    
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Return a mock successful response
    return res.status(200).json({
      message: 'Test login successful',
      user: {
        id: 'test-user-123',
        name: 'Test User',
        email: email,
        role: 'user'
      },
      token: 'test-jwt-token-123',
      testMode: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test login error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin routes
// ============

// Connect to MongoDB only when needed
async function connectDB() {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('Connecting to MongoDB...');
      const mongoUri = process.env.MONGO_URI;
      if (!mongoUri) {
        throw new Error('MongoDB URI not configured');
      }
      
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('MongoDB connected successfully');
    }
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return false;
  }
}

// Define Admin schema inline
const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' },
  lastLogin: { type: Date }
});

// Admin login endpoint
app.post('/api/admin/login', async (req, res) => {
  console.log('Admin login endpoint hit:', new Date().toISOString());
  
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required',
        provided: { email: !!email, password: !!password }
      });
    }
    
    // Connect to MongoDB
    const connected = await connectDB();
    if (!connected) {
      return res.status(500).json({ 
        message: 'Database connection failed',
        timestamp: new Date().toISOString()
      });
    }
    
    // Get Admin model
    let Admin;
    try {
      Admin = mongoose.model('Admin');
    } catch (e) {
      Admin = mongoose.model('Admin', adminSchema);
    }
    
    // Find admin
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { id: admin._id, role: 'admin' },
      process.env.JWT_SECRET || 'fallback-jwt-secret',
      { expiresIn: '1h' }
    );
    
    // Update last login time (fire and forget)
    admin.lastLogin = new Date();
    admin.save().catch(err => console.error('Error updating last login time:', err));
    
    // Send response
    res.status(200).json({
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ 
      message: 'Server error processing login',
      errorType: error.name, 
      errorMessage: error.message 
    });
  }
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.status(200).json({
    message: 'CORS test successful',
    origin: req.headers.origin || 'none',
    timestamp: new Date().toISOString()
  });
});

// Catch-all route
app.all('*', (req, res) => {
  res.status(404).json({
    message: 'Endpoint not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Export for Vercel
module.exports = app; 