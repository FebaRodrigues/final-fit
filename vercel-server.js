// vercel-server.js - Simplified server for Vercel deployment
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

// CORS configuration
app.use(cors({
  origin: 'https://final-fit-frontend.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));

// Handle OPTIONS requests for preflight
app.options('*', cors());

// Body parser
app.use(express.json());

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
    message: 'API is running in serverless mode',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Simple debug endpoint
app.get('/api/debug', (req, res) => {
  res.status(200).json({
    message: 'Debug endpoint is working',
    timestamp: new Date().toISOString(),
    headers: req.headers,
    environment: process.env.NODE_ENV || 'production',
    clientUrl: process.env.CLIENT_URL || 'not set'
  });
});

// Admin login endpoint (standalone implementation)
app.post('/api/admin/login', async (req, res) => {
  try {
    console.log('Admin login request received:', req.body);
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Connect to MongoDB (lazy connection)
    if (mongoose.connection.readyState !== 1) {
      const mongoUri = process.env.MONGO_URI;
      if (!mongoUri) {
        return res.status(500).json({ message: 'Database connection string is not configured' });
      }
      
      try {
        await mongoose.connect(mongoUri, {
          useNewUrlParser: true,
          useUnifiedTopology: true
        });
        console.log('MongoDB connected for admin login');
      } catch (dbError) {
        console.error('MongoDB connection error:', dbError);
        return res.status(500).json({ message: 'Failed to connect to database', error: dbError.message });
      }
    }
    
    // Define Admin schema on-the-fly if not already defined
    let Admin;
    try {
      Admin = mongoose.model('Admin');
    } catch (e) {
      const adminSchema = new mongoose.Schema({
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: { type: String, default: 'admin' },
        lastLogin: { type: Date }
      });
      Admin = mongoose.model('Admin', adminSchema);
    }
    
    // Find the admin
    const admin = await Admin.findOne({ email });
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
    
    // Update last login time
    admin.lastLogin = new Date();
    await admin.save();
    
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Fallback route
app.all('*', (req, res) => {
  res.status(404).json({ 
    message: 'Endpoint not found',
    method: req.method,
    path: req.path
  });
});

// Only start the server if this file is run directly (not for Vercel)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

// Export the Express app for Vercel
module.exports = app; 