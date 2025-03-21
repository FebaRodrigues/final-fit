// api/serverless.js - Completely standalone serverless function for Vercel
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');

// Create the Express app
const app = express();

// Set up multer for handling file uploads
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  }
});

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

// Authentication middleware
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');
    
    // Check if no token
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-jwt-secret');
    
    // Add user to request
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(401).json({ message: 'Token is not valid', error: error.message });
  }
};

// Admin role middleware
const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin permissions required.' });
  }
};

// Trainer role middleware
const trainerMiddleware = (req, res, next) => {
  if (req.user && (req.user.role === 'trainer' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Trainer permissions required.' });
  }
};

// Root endpoint - Add this to handle the root path
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Fitness Management System API',
    status: 'online',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api',
      adminLogin: '/api/admin/login',
      adminProfile: '/api/admin/profile',
      adminUsers: '/api/admin/users',
      userRoutes: '/api/user/*',
      trainerRoutes: '/api/trainer/*'
    }
  });
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

// Debug endpoint for users (for frontend development)
app.get('/api/admin/users-debug', authMiddleware, adminMiddleware, async (req, res) => {
  console.log('Admin users debug endpoint hit:', new Date().toISOString());
  
  // Sample data in multiple formats to help frontend debugging
  const mockData = {
    // Format 1: Array directly
    users: [
      { id: 'user1', name: 'John Doe', email: 'john@example.com', role: 'user', membershipType: 'premium' },
      { id: 'user2', name: 'Jane Smith', email: 'jane@example.com', role: 'user', membershipType: 'basic' }
    ],
    
    // Format 2: Data property with array
    data: [
      { id: 'user1', name: 'John Doe', email: 'john@example.com', role: 'user', membershipType: 'premium' },
      { id: 'user2', name: 'Jane Smith', email: 'jane@example.com', role: 'user', membershipType: 'basic' }
    ],
    
    // Format 3: Nested structure with results array
    results: {
      data: [
        { id: 'user1', name: 'John Doe', email: 'john@example.com', role: 'user', membershipType: 'premium' },
        { id: 'user2', name: 'Jane Smith', email: 'jane@example.com', role: 'user', membershipType: 'basic' }
      ]
    },
    
    // Pagination info
    pagination: {
      total: 2,
      page: 1,
      pages: 1
    },
    
    // Request info for debugging
    debug: {
      timestamp: new Date().toISOString(),
      queryParams: req.query,
      headers: {
        authorization: req.headers.authorization ? 'present' : 'missing',
        'x-auth-token': req.headers['x-auth-token'] ? 'present' : 'missing'
      }
    }
  };
  
  res.status(200).json(mockData);
});

// Add mock data endpoint for testing when DB is empty
app.get('/api/admin/users-mock', authMiddleware, adminMiddleware, (req, res) => {
  console.log('Admin mock users endpoint hit:', new Date().toISOString());
  
  // Sample data that should work with frontend
  const mockUsers = [];
  
  // Generate 10 mock users
  for (let i = 1; i <= 10; i++) {
    mockUsers.push({
      id: `mock-user-${i}`,
      name: `Test User ${i}`,
      email: `user${i}@example.com`,
      role: 'user',
      membershipType: i % 3 === 0 ? 'premium' : 'basic',
      fitnessLevel: ['beginner', 'intermediate', 'advanced'][i % 3],
      profileCompleted: i % 2 === 0,
      createdAt: new Date(Date.now() - i * 86400000).toISOString() // days ago
    });
  }
  
  res.status(200).json({
    data: mockUsers,
    pagination: {
      total: mockUsers.length,
      page: 1,
      pages: 1
    }
  });
});

// Simple test endpoint for frontend debugging
app.get('/api/admin/users-simple', authMiddleware, adminMiddleware, (req, res) => {
  console.log('Admin simple users endpoint hit:', new Date().toISOString());
  
  // Simple array of users - no nested structure
  const users = [
    { id: 'user1', name: 'Test User 1', email: 'user1@example.com', role: 'user', membershipType: 'premium' },
    { id: 'user2', name: 'Test User 2', email: 'user2@example.com', role: 'user', membershipType: 'basic' },
    { id: 'user3', name: 'Test User 3', email: 'user3@example.com', role: 'user', membershipType: 'premium' }
  ];
  
  console.log('Returning simple array with length:', users.length);
  res.status(200).json(users);
});

// Debug endpoint with multiple response formats
app.get('/api/admin/format-test', authMiddleware, adminMiddleware, (req, res) => {
  console.log('Format test endpoint hit:', new Date().toISOString());
  
  // Get requested format from query param
  const format = req.query.format || 'default';
  
  // Sample data
  const users = [
    { id: 'test1', name: 'Format Test 1', email: 'test1@example.com', role: 'user' },
    { id: 'test2', name: 'Format Test 2', email: 'test2@example.com', role: 'user' }
  ];
  
  let response;
  
  // Return different formats based on query parameter
  switch(format) {
    case 'array':
      // Direct array
      response = users;
      break;
    case 'data':
      // Object with data property containing array
      response = { data: users };
      break;
    case 'users':
      // Object with users property containing array
      response = { users: users };
      break;
    case 'nested':
      // Deeply nested structure
      response = { results: { data: users } };
      break;
    case 'empty':
      // Empty array
      response = { data: [] };
      break;
    case 'null':
      // Null data
      response = { data: null };
      break;
    case 'string':
      // String data (will cause error)
      response = { data: "This is not an array" };
      break;
    default:
      // Standard format matching current API
      response = {
        data: users,
        success: true,
        pagination: { total: users.length, page: 1, pages: 1 }
      };
  }
  
  console.log('Format test responding with format:', format);
  res.status(200).json(response);
});

// MongoDB Schema Definitions
// =========================

// Define Admin schema inline
const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' },
  lastLogin: { type: Date }
});

// Define User schema inline
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  role: { type: String, default: 'user' },
  image: { type: String },
  membershipType: { type: String, default: 'basic' },
  goals: [{ type: String }],
  profileCompleted: { type: Boolean, default: false },
  fitnessLevel: { type: String, default: 'beginner' },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
});

// Define Trainer schema inline
const trainerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  role: { type: String, default: 'trainer' },
  image: { type: String },
  specialization: [{ type: String }],
  experience: { type: Number, default: 0 },
  bio: { type: String },
  certifications: [{ type: String }],
  availability: [{ type: Object }],
  rating: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
});

// MongoDB Connection
// =================

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

// Helper to get model (creates if doesn't exist)
function getModel(name, schema) {
  try {
    return mongoose.model(name);
  } catch (e) {
    return mongoose.model(name, schema);
  }
}

// USER ROUTES
// ===========

// User registration
app.post('/api/user/register', async (req, res) => {
  console.log('User registration endpoint hit:', new Date().toISOString());
  try {
    const { name, email, password } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Connect to MongoDB
    const connected = await connectDB();
    if (!connected) {
      return res.status(500).json({ message: 'Database connection failed' });
    }
    
    const User = getModel('User', userSchema);
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'user'
    });
    
    await user.save();
    
    // Generate token
    const token = jwt.sign(
      { id: user._id, role: 'user' },
      process.env.JWT_SECRET || 'fallback-jwt-secret',
      { expiresIn: '1d' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: 'user'
      }
    });
  } catch (error) {
    console.error('User registration error:', error);
    res.status(500).json({ 
      message: 'Server error during registration',
      error: error.message 
    });
  }
});

// Plural version of user registration endpoint (to match frontend URL)
app.post('/api/users/register', upload.single('image'), async (req, res) => {
  console.log('Plural users registration endpoint hit:', new Date().toISOString());
  try {
    // Get form data (support multipart/form-data for image upload)
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    
    console.log('Registration attempt with:', { 
      name, 
      email, 
      hasPassword: !!password,
      hasImage: !!req.file
    });
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Connect to MongoDB
    const connected = await connectDB();
    if (!connected) {
      return res.status(500).json({ message: 'Database connection failed' });
    }
    
    const User = getModel('User', userSchema);
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Process image if uploaded
    let imageUrl = null;
    if (req.file) {
      // In a real production app, you would upload to a service like AWS S3, Cloudinary, etc.
      // For this example, we'll pretend we saved it and return a dummy URL
      imageUrl = `https://via.placeholder.com/150?text=${encodeURIComponent(name)}`;
      console.log('Processed image for user:', imageUrl);
    }
    
    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'user',
      image: imageUrl
    });
    
    await user.save();
    
    // Generate token
    const token = jwt.sign(
      { id: user._id, role: 'user' },
      process.env.JWT_SECRET || 'fallback-jwt-secret',
      { expiresIn: '1d' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: 'user',
        image: user.image
      }
    });
  } catch (error) {
    console.error('Users (plural) registration error:', error);
    res.status(500).json({ 
      message: 'Server error during registration',
      error: error.message 
    });
  }
});

// User login
app.post('/api/user/login', async (req, res) => {
  console.log('User login endpoint hit:', new Date().toISOString());
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Connect to MongoDB
    const connected = await connectDB();
    if (!connected) {
      return res.status(500).json({ message: 'Database connection failed' });
    }
    
    const User = getModel('User', userSchema);
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { id: user._id, role: 'user' },
      process.env.JWT_SECRET || 'fallback-jwt-secret',
      { expiresIn: '1d' }
    );
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: 'user'
      }
    });
  } catch (error) {
    console.error('User login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Plural version of user login endpoint (to match frontend URL)
app.post('/api/users/login', async (req, res) => {
  console.log('Plural users login endpoint hit:', new Date().toISOString());
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt for:', email);
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Connect to MongoDB
    const connected = await connectDB();
    if (!connected) {
      return res.status(500).json({ message: 'Database connection failed' });
    }
    
    const User = getModel('User', userSchema);
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { id: user._id, role: 'user' },
      process.env.JWT_SECRET || 'fallback-jwt-secret',
      { expiresIn: '1d' }
    );
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: 'user'
      }
    });
  } catch (error) {
    console.error('Users (plural) login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user profile
app.get('/api/user/profile', authMiddleware, async (req, res) => {
  console.log('User profile endpoint hit:', new Date().toISOString());
  try {
    // Connect to MongoDB
    const connected = await connectDB();
    if (!connected) {
      return res.status(500).json({ message: 'Database connection failed' });
    }
    
    const User = getModel('User', userSchema);
    
    // Find user by ID from token
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ user });
  } catch (error) {
    console.error('User profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
app.put('/api/user/profile', authMiddleware, async (req, res) => {
  console.log('Update user profile endpoint hit:', new Date().toISOString());
  try {
    const { name, phone, goals, fitnessLevel } = req.body;
    
    // Connect to MongoDB
    const connected = await connectDB();
    if (!connected) {
      return res.status(500).json({ message: 'Database connection failed' });
    }
    
    const User = getModel('User', userSchema);
    
    // Find user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (goals) user.goals = goals;
    if (fitnessLevel) user.fitnessLevel = fitnessLevel;
    
    // Mark profile as completed if all fields are provided
    if (name && phone && goals && goals.length > 0 && fitnessLevel) {
      user.profileCompleted = true;
    }
    
    await user.save();
    
    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        goals: user.goals,
        fitnessLevel: user.fitnessLevel,
        profileCompleted: user.profileCompleted,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
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

// TRAINER ROUTES
// ==============

// Trainer registration
app.post('/api/trainer/register', async (req, res) => {
  console.log('Trainer registration endpoint hit:', new Date().toISOString());
  try {
    const { name, email, password, specialization, experience, bio } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    
    // Connect to MongoDB
    const connected = await connectDB();
    if (!connected) {
      return res.status(500).json({ message: 'Database connection failed' });
    }
    
    const Trainer = getModel('Trainer', trainerSchema);
    
    // Check if trainer exists
    const existingTrainer = await Trainer.findOne({ email });
    if (existingTrainer) {
      return res.status(400).json({ message: 'Trainer already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create trainer
    const trainer = new Trainer({
      name,
      email,
      password: hashedPassword,
      specialization: specialization || [],
      experience: experience || 0,
      bio: bio || '',
      role: 'trainer'
    });
    
    await trainer.save();
    
    // Generate token
    const token = jwt.sign(
      { id: trainer._id, role: 'trainer' },
      process.env.JWT_SECRET || 'fallback-jwt-secret',
      { expiresIn: '1d' }
    );
    
    res.status(201).json({
      token,
      trainer: {
        id: trainer._id,
        name: trainer.name,
        email: trainer.email,
        role: 'trainer',
        specialization: trainer.specialization,
        experience: trainer.experience
      }
    });
  } catch (error) {
    console.error('Trainer registration error:', error);
    res.status(500).json({ 
      message: 'Server error during registration',
      error: error.message 
    });
  }
});

// Trainer login
app.post('/api/trainer/login', async (req, res) => {
  console.log('Trainer login endpoint hit:', new Date().toISOString());
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Connect to MongoDB
    const connected = await connectDB();
    if (!connected) {
      return res.status(500).json({ message: 'Database connection failed' });
    }
    
    const Trainer = getModel('Trainer', trainerSchema);
    
    // Find trainer
    const trainer = await Trainer.findOne({ email });
    if (!trainer) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, trainer.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { id: trainer._id, role: 'trainer' },
      process.env.JWT_SECRET || 'fallback-jwt-secret',
      { expiresIn: '1d' }
    );
    
    // Update last login
    trainer.lastLogin = new Date();
    await trainer.save();
    
    res.status(200).json({
      token,
      trainer: {
        id: trainer._id,
        name: trainer.name,
        email: trainer.email,
        role: 'trainer',
        specialization: trainer.specialization,
        experience: trainer.experience
      }
    });
  } catch (error) {
    console.error('Trainer login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get trainer profile
app.get('/api/trainer/profile', authMiddleware, trainerMiddleware, async (req, res) => {
  console.log('Trainer profile endpoint hit:', new Date().toISOString());
  try {
    // Connect to MongoDB
    const connected = await connectDB();
    if (!connected) {
      return res.status(500).json({ message: 'Database connection failed' });
    }
    
    const Trainer = getModel('Trainer', trainerSchema);
    
    // Find trainer by ID from token
    const trainer = await Trainer.findById(req.user.id).select('-password');
    if (!trainer) {
      return res.status(404).json({ message: 'Trainer not found' });
    }
    
    res.status(200).json({ trainer });
  } catch (error) {
    console.error('Trainer profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ADMIN ROUTES
// ============

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
    
    const Admin = getModel('Admin', adminSchema);
    
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

// Admin profile endpoint
app.get('/api/admin/profile', authMiddleware, adminMiddleware, async (req, res) => {
  console.log('Admin profile endpoint hit:', new Date().toISOString());
  try {
    // Connect to MongoDB
    const connected = await connectDB();
    if (!connected) {
      return res.status(500).json({ 
        message: 'Database connection failed',
        timestamp: new Date().toISOString()
      });
    }
    
    const Admin = getModel('Admin', adminSchema);
    
    // Find admin by ID from token
    const admin = await Admin.findById(req.user.id).select('-password');
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    // Send admin profile
    res.status(200).json({
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role || 'admin',
        lastLogin: admin.lastLogin
      }
    });
  } catch (error) {
    console.error('Admin profile error:', error);
    res.status(500).json({ 
      message: 'Server error fetching admin profile',
      errorType: error.name, 
      errorMessage: error.message 
    });
  }
});

// Get all users (for admin dashboard)
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  console.log('Admin get users endpoint hit:', new Date().toISOString());
  try {
    // Connect to MongoDB
    const connected = await connectDB();
    if (!connected) {
      return res.status(500).json({ message: 'Database connection failed' });
    }
    
    const User = getModel('User', userSchema);
    
    // Get users with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const users = await User.find()
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await User.countDocuments();
    
    // Format users to match frontend expectations
    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      name: user.name || 'Unnamed User',
      email: user.email || 'No Email',
      role: user.role || 'user',
      membershipType: user.membershipType || 'basic',
      fitnessLevel: user.fitnessLevel || 'beginner',
      profileCompleted: user.profileCompleted || false,
      createdAt: user.createdAt || new Date()
    }));
    
    // If DB is empty, use mock data
    const finalUsers = formattedUsers.length > 0 ? formattedUsers : [
      { id: 'sample-1', name: 'John Doe', email: 'john@example.com', role: 'user', membershipType: 'premium' },
      { id: 'sample-2', name: 'Jane Smith', email: 'jane@example.com', role: 'user', membershipType: 'basic' }
    ];
    
    // Return response with multiple access patterns for maximum compatibility
    const responseData = {
      // Primary format: under 'data' key
      data: finalUsers,
      
      // Add success flag
      success: true,
      
      // Pagination info
      pagination: {
        total: total || finalUsers.length,
        page,
        pages: Math.ceil((total || finalUsers.length) / limit)
      }
    };
    
    // Add detailed logging of the response structure
    console.log('Admin users response ready with user count:', finalUsers.length);
    console.log('Response structure:', {
      hasDataArray: Array.isArray(responseData.data),
      dataLength: Array.isArray(responseData.data) ? responseData.data.length : 'not an array'
    });
    
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Admin get users error:', error);
    
    // Return fallback data on error
    const fallbackUsers = [
      { id: 'fallback-1', name: 'Fallback User 1', email: 'fallback1@example.com', role: 'user' },
      { id: 'fallback-2', name: 'Fallback User 2', email: 'fallback2@example.com', role: 'user' }
    ];
    
    res.status(200).json({
      data: fallbackUsers,
      success: true,
      pagination: { total: 2, page: 1, pages: 1 },
      error: { message: error.message, wasHandled: true }
    });
  }
});

// Get all trainers (for admin dashboard)
app.get('/api/admin/trainers', authMiddleware, adminMiddleware, async (req, res) => {
  console.log('Admin get trainers endpoint hit:', new Date().toISOString());
  try {
    // Connect to MongoDB
    const connected = await connectDB();
    if (!connected) {
      return res.status(500).json({ message: 'Database connection failed' });
    }
    
    const Trainer = getModel('Trainer', trainerSchema);
    
    // Get trainers with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const trainers = await Trainer.find()
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await Trainer.countDocuments();
    
    // Format trainers to match frontend expectations
    const formattedTrainers = trainers.map(trainer => ({
      id: trainer._id.toString(),
      name: trainer.name || 'Unnamed Trainer',
      email: trainer.email || 'No Email',
      role: trainer.role || 'trainer',
      specialization: trainer.specialization || [],
      experience: trainer.experience || 0,
      bio: trainer.bio || '',
      createdAt: trainer.createdAt || new Date()
    }));
    
    // If DB is empty, use mock data
    const finalTrainers = formattedTrainers.length > 0 ? formattedTrainers : [
      { id: 'sample-1', name: 'Alex Smith', email: 'alex@example.com', role: 'trainer', specialization: ['Cardio', 'HIIT'] },
      { id: 'sample-2', name: 'Sam Jones', email: 'sam@example.com', role: 'trainer', specialization: ['Strength', 'Yoga'] }
    ];
    
    // Return response with multiple access patterns for maximum compatibility
    const responseData = {
      // Primary format: under 'data' key
      data: finalTrainers,
      
      // Add success flag
      success: true,
      
      // Pagination info
      pagination: {
        total: total || finalTrainers.length,
        page,
        pages: Math.ceil((total || finalTrainers.length) / limit)
      }
    };
    
    console.log('Admin trainers response ready with trainer count:', finalTrainers.length);
    
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Admin get trainers error:', error);
    
    // Return fallback data on error
    const fallbackTrainers = [
      { id: 'fallback-1', name: 'Fallback Trainer 1', email: 'fallback1@example.com', role: 'trainer', specialization: ['Cardio'] },
      { id: 'fallback-2', name: 'Fallback Trainer 2', email: 'fallback2@example.com', role: 'trainer', specialization: ['Yoga'] }
    ];
    
    res.status(200).json({
      data: fallbackTrainers,
      success: true,
      pagination: { total: 2, page: 1, pages: 1 },
      error: { message: error.message, wasHandled: true }
    });
  }
});

// Get dashboard statistics
app.get('/api/admin/statistics', authMiddleware, adminMiddleware, async (req, res) => {
  console.log('Admin statistics endpoint hit:', new Date().toISOString());
  try {
    // Connect to MongoDB
    const connected = await connectDB();
    if (!connected) {
      return res.status(500).json({ message: 'Database connection failed' });
    }
    
    const User = getModel('User', userSchema);
    const Trainer = getModel('Trainer', trainerSchema);
    
    // Get counts
    const userCount = await User.countDocuments();
    const trainerCount = await Trainer.countDocuments();
    
    // Get active users (logged in within the last 7 days)
    const activeDate = new Date();
    activeDate.setDate(activeDate.getDate() - 7);
    
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: activeDate }
    });
    
    // Get new users (registered within the last 30 days)
    const newUserDate = new Date();
    newUserDate.setDate(newUserDate.getDate() - 30);
    
    const newUsers = await User.countDocuments({
      createdAt: { $gte: newUserDate }
    });
    
    // Return data in consistent format
    res.status(200).json({
      data: {
        userCount,
        trainerCount,
        activeUsers,
        newUsers,
        recentActivity: {
          activeUsers,
          newUsers
        }
      },
      success: true
    });
  } catch (error) {
    console.error('Admin statistics error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      success: false 
    });
  }
});

// SHARED ROUTES
// ============

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