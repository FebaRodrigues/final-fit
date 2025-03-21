// vercel-server.js - Completely standalone server for Vercel deployment
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config();

// Create the Express app
const app = express();

// CORS configuration - Allow requests from the frontend
app.use(cors({
  origin: 'https://final-fit-frontend.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));

// Handle OPTIONS requests
app.options('*', cors());

// Body parser for JSON requests
app.use(express.json());

// Manual CORS headers as a fallback
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://final-fit-frontend.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Vercel server is healthy',
    timestamp: new Date().toISOString()
  });
});

// API root endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'API is running in standalone mode',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Debug endpoint
app.get('/api/debug', (req, res) => {
  res.status(200).json({
    message: 'Debug endpoint is working',
    timestamp: new Date().toISOString(),
    headers: req.headers,
    environment: process.env.NODE_ENV || 'production',
    clientUrl: process.env.CLIENT_URL || 'not set',
    mongoUri: process.env.MONGO_URI ? 'Set (hidden)' : 'Not set'
  });
});

// Connect to MongoDB (if needed)
async function connectToMongoDB() {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('MongoDB connected');
    }
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return false;
  }
}

// Define Admin Schema
const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' },
  lastLogin: { type: Date }
});

// Admin model (define only once)
let Admin;
try {
  Admin = mongoose.model('Admin');
} catch (e) {
  Admin = mongoose.model('Admin', adminSchema);
}

// Admin login endpoint
app.post('/api/admin/login', async (req, res) => {
  console.log('Admin login endpoint hit at', new Date().toISOString());
  try {
    // Log request body safely
    console.log('Admin login request received:', { 
      email: req.body?.email ? '****' + req.body.email.substring(4) : 'not provided', 
      passwordProvided: !!req.body?.password 
    });
    
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required',
        provided: { email: !!email, password: !!password }
      });
    }
    
    // Connect to MongoDB
    const dbConnected = await connectToMongoDB();
    if (!dbConnected) {
      return res.status(500).json({ message: 'Database connection failed' });
    }
    
    // Find the admin
    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Compare password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { id: admin._id, role: 'admin' },
      process.env.JWT_SECRET || 'serverless-jwt-secret',
      { expiresIn: '1h' }
    );
    
    // Update last login time (but don't wait for it)
    admin.lastLogin = new Date();
    admin.save().catch(err => console.error('Error updating last login time:', err));
    
    // Send response
    console.log('Admin login successful for', email);
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Test route that doesn't need database access
app.get('/api/test', (req, res) => {
  res.status(200).json({
    message: 'Test endpoint is working',
    timestamp: new Date().toISOString()
  });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.status(200).json({
    message: 'CORS is configured correctly',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// Fallback route
app.all('*', (req, res) => {
  res.status(404).json({ 
    message: 'Endpoint not found',
    method: req.method,
    path: req.path
  });
});

// Start the server if running directly
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export the Express app
module.exports = app; 