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
  // Additional user profile fields
  age: { type: Number },
  height: { type: Number },
  weight: { type: Number },
  gender: { type: String, enum: ['male', 'female', 'other', ''] },
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

// Define Membership schema inline
const membershipSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  plan: { type: String, required: true, enum: ['basic', 'premium', 'unlimited'] },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  paymentId: { type: String },
  status: { type: String, default: 'active', enum: ['active', 'expired', 'canceled'] },
  features: [{ type: String }],
  renewalPrice: { type: Number },
  autoRenew: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Define Workout schema inline
const workoutSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  title: { type: String, required: true },
  description: { type: String },
  exercises: [{
    name: { type: String, required: true },
    sets: { type: Number, default: 3 },
    reps: { type: Number, default: 10 },
    weight: { type: Number },
    duration: { type: Number }, // in seconds
    notes: { type: String }
  }],
  duration: { type: Number }, // in minutes
  date: { type: Date, default: Date.now },
  type: { type: String, enum: ['strength', 'cardio', 'flexibility', 'balance', 'custom'] },
  status: { type: String, default: 'planned', enum: ['planned', 'completed', 'missed'] },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Define Meal schema inline
const mealSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  date: { type: Date, default: Date.now },
  type: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'], required: true },
  name: { type: String, required: true },
  foods: [{
    name: { type: String, required: true },
    calories: { type: Number },
    protein: { type: Number }, // in grams
    carbs: { type: Number }, // in grams
    fat: { type: Number }, // in grams
    servingSize: { type: String },
    quantity: { type: Number, default: 1 }
  }],
  calories: { type: Number },
  protein: { type: Number }, // in grams
  carbs: { type: Number }, // in grams
  fat: { type: Number }, // in grams
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
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

// Get user profile (singular version)
app.get('/api/user/profile', authMiddleware, async (req, res) => {
  console.log('User profile endpoint hit (singular):', new Date().toISOString());
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

// Get user profile - plural version for frontend compatibility
app.get('/api/users/profile', authMiddleware, async (req, res) => {
  console.log('Plural users profile endpoint hit:', new Date().toISOString());
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
    
    // Format response to match frontend expectations
    res.status(200).json({ 
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image || null,
        membershipType: user.membershipType || 'basic',
        fitnessLevel: user.fitnessLevel || 'beginner',
        profileCompleted: user.profileCompleted || false,
        goals: user.goals || []
      }
    });
  } catch (error) {
    console.error('User profile error (plural endpoint):', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile - singular version for backward compatibility
app.put('/api/user/profile', authMiddleware, upload.single('image'), async (req, res) => {
  console.log('Update user profile endpoint hit (singular):', new Date().toISOString());
  try {
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
    
    // Process image if uploaded
    let imageUrl = user.image;  // Keep existing image by default
    if (req.file) {
      imageUrl = `https://via.placeholder.com/150?text=${encodeURIComponent(req.body.name || user.name)}`;
    }
    
    // Update fields
    const updateFields = [
      'name', 'phone', 'goals', 'fitnessLevel', 
      'age', 'height', 'weight', 'gender', 'membershipType'
    ];
    
    // Apply updates
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        // Handle array fields (like goals)
        if (field === 'goals' && typeof req.body[field] === 'string') {
          try {
            user[field] = JSON.parse(req.body[field]);
          } catch (e) {
            user[field] = req.body[field].split(',').map(goal => goal.trim());
          }
        } else {
          user[field] = req.body[field];
        }
      }
    });
    
    // Set image
    user.image = imageUrl;
    
    // Mark profile as completed if key fields are provided
    if (user.name && (user.age || req.body.age) && (user.gender || req.body.gender)) {
      user.profileCompleted = true;
    }
    
    await user.save();
    
    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        image: user.image,
        age: user.age || '',
        height: user.height || '',
        weight: user.weight || '',
        gender: user.gender || '',
        goals: user.goals || [],
        fitnessLevel: user.fitnessLevel || 'beginner',
        profileCompleted: user.profileCompleted,
        membershipType: user.membershipType || 'basic',
        role: user.role
      },
      success: true
    });
  } catch (error) {
    console.error('Update user profile error (singular endpoint):', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile - plural version for frontend compatibility
app.put('/api/users/profile', authMiddleware, upload.single('image'), async (req, res) => {
  console.log('Update user profile endpoint hit (plural):', new Date().toISOString());
  try {
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
    
    console.log('Received form data:', {
      name: req.body.name,
      hasImage: !!req.file,
      fields: Object.keys(req.body)
    });
    
    // Process image if uploaded
    let imageUrl = user.image;  // Keep existing image by default
    if (req.file) {
      // In a real production app, you would upload to a service like AWS S3, Cloudinary, etc.
      // For this example, we'll pretend we saved it and return a dummy URL
      imageUrl = `https://via.placeholder.com/150?text=${encodeURIComponent(req.body.name || user.name)}`;
      console.log('Processed new profile image:', imageUrl);
    }
    
    // Update fields
    const updateFields = [
      'name', 'phone', 'goals', 'fitnessLevel', 
      'age', 'height', 'weight', 'gender', 'membershipType'
    ];
    
    // Apply updates
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        // Handle array fields (like goals)
        if (field === 'goals' && typeof req.body[field] === 'string') {
          try {
            user[field] = JSON.parse(req.body[field]);
          } catch (e) {
            user[field] = req.body[field].split(',').map(goal => goal.trim());
          }
        } else {
          user[field] = req.body[field];
        }
      }
    });
    
    // Set image
    user.image = imageUrl;
    
    // Mark profile as completed if key fields are provided
    if (user.name && (user.age || req.body.age) && (user.gender || req.body.gender)) {
      user.profileCompleted = true;
    }
    
    await user.save();
    
    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        image: user.image,
        age: user.age || '',
        height: user.height || '',
        weight: user.weight || '',
        gender: user.gender || '',
        goals: user.goals || [],
        fitnessLevel: user.fitnessLevel || 'beginner',
        profileCompleted: user.profileCompleted,
        membershipType: user.membershipType || 'basic',
        role: user.role
      },
      success: true
    });
  } catch (error) {
    console.error('Update user profile error (plural endpoint):', error);
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

// MEMBERSHIP ROUTES
// ==============

// Get user membership
app.get('/api/memberships/user/:userId', authMiddleware, async (req, res) => {
  console.log('Get user membership endpoint hit:', new Date().toISOString());
  
  try {
    const { userId } = req.params;
    
    // Basic validation
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Verify user has permission to access this membership
    // Users can only access their own membership, admins can access any
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Not authorized to access this membership' });
    }
    
    // Connect to MongoDB
    const connected = await connectDB();
    if (!connected) {
      return res.status(500).json({ message: 'Database connection failed' });
    }
    
    // Get the model
    const Membership = getModel('Membership', membershipSchema);
    
    // Find active membership for user
    const membership = await Membership.findOne({
      userId,
      status: 'active',
      endDate: { $gt: new Date() } // Not expired
    }).sort({ endDate: -1 }); // Get the one with furthest end date if multiple
    
    if (!membership) {
      // No active membership found, return mock data
      return res.status(200).json({
        membership: null,
        message: 'No active membership found'
      });
    }
    
    // Return membership data
    return res.status(200).json({
      membership: {
        id: membership._id.toString(),
        userId: membership.userId.toString(),
        plan: membership.plan,
        startDate: membership.startDate,
        endDate: membership.endDate,
        status: membership.status,
        features: membership.features || [],
        renewalPrice: membership.renewalPrice,
        autoRenew: membership.autoRenew
      }
    });
  } catch (error) {
    console.error('Get membership error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create Mock Membership (for testing)
app.post('/api/memberships/create-mock', authMiddleware, async (req, res) => {
  console.log('Create mock membership endpoint hit:', new Date().toISOString());
  
  try {
    const { userId, plan = 'basic' } = req.body;
    
    // Basic validation
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Verify user has permission (only self or admin)
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Not authorized to create membership' });
    }
    
    // Connect to MongoDB
    const connected = await connectDB();
    if (!connected) {
      return res.status(500).json({ message: 'Database connection failed' });
    }
    
    // Get the model
    const Membership = getModel('Membership', membershipSchema);
    
    // Set end date based on plan (30 days for basic, 90 for premium, 365 for unlimited)
    const today = new Date();
    const endDate = new Date();
    
    switch (plan) {
      case 'premium':
        endDate.setDate(today.getDate() + 90);
        break;
      case 'unlimited':
        endDate.setDate(today.getDate() + 365);
        break;
      default: // basic
        endDate.setDate(today.getDate() + 30);
    }
    
    // Generate features based on plan
    let features = ['workout_tracking', 'meal_planning'];
    if (plan === 'premium' || plan === 'unlimited') {
      features.push('trainer_consultation', 'personalized_plans');
    }
    if (plan === 'unlimited') {
      features.push('premium_content', 'priority_support', 'group_classes');
    }
    
    // Create membership
    const membership = new Membership({
      userId,
      plan,
      startDate: today,
      endDate,
      paymentId: `mock-payment-${Date.now()}`,
      status: 'active',
      features,
      renewalPrice: plan === 'basic' ? 9.99 : (plan === 'premium' ? 19.99 : 29.99),
      autoRenew: false
    });
    
    await membership.save();
    
    // Return membership data
    return res.status(201).json({
      membership: {
        id: membership._id.toString(),
        userId: membership.userId.toString(),
        plan: membership.plan,
        startDate: membership.startDate,
        endDate: membership.endDate,
        status: membership.status,
        features: membership.features,
        renewalPrice: membership.renewalPrice,
        autoRenew: membership.autoRenew
      },
      message: 'Mock membership created successfully'
    });
  } catch (error) {
    console.error('Create mock membership error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// WORKOUT ROUTES
// ==============

// Get user workouts
app.get('/api/workouts/user/:userId', authMiddleware, async (req, res) => {
  console.log('Get user workouts endpoint hit:', new Date().toISOString());
  
  try {
    const { userId } = req.params;
    
    // Basic validation
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Verify user has permission to access these workouts
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Not authorized to access these workouts' });
    }
    
    // Connect to MongoDB
    const connected = await connectDB();
    if (!connected) {
      return res.status(500).json({ message: 'Database connection failed' });
    }
    
    // Get the model
    const Workout = getModel('Workout', workoutSchema);
    
    // Optional query parameters
    const { limit = 10, page = 1, status, type, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query
    const query = { userId };
    if (status) query.status = status;
    if (type) query.type = type;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    // Get workouts
    const workouts = await Workout.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Workout.countDocuments(query);
    
    // Format workouts for response
    const formattedWorkouts = workouts.map(workout => ({
      id: workout._id.toString(),
      userId: workout.userId.toString(),
      title: workout.title,
      description: workout.description || '',
      exercises: workout.exercises || [],
      duration: workout.duration || 0,
      date: workout.date,
      type: workout.type || 'custom',
      status: workout.status,
      notes: workout.notes || '',
      createdAt: workout.createdAt
    }));
    
    // Return response
    return res.status(200).json({
      workouts: formattedWorkouts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      },
      success: true
    });
  } catch (error) {
    console.error('Get workouts error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a workout
app.post('/api/workouts', authMiddleware, async (req, res) => {
  console.log('Create workout endpoint hit:', new Date().toISOString());
  
  try {
    const { title, description, exercises, duration, date, type, notes } = req.body;
    
    // Basic validation
    if (!title) {
      return res.status(400).json({ message: 'Workout title is required' });
    }
    
    // Connect to MongoDB
    const connected = await connectDB();
    if (!connected) {
      return res.status(500).json({ message: 'Database connection failed' });
    }
    
    // Get the model
    const Workout = getModel('Workout', workoutSchema);
    
    // Create new workout
    const workout = new Workout({
      userId: req.user.id,
      title,
      description,
      exercises: exercises || [],
      duration: duration || 0,
      date: date ? new Date(date) : new Date(),
      type: type || 'custom',
      status: 'planned',
      notes: notes || ''
    });
    
    await workout.save();
    
    // Return the created workout
    return res.status(201).json({
      workout: {
        id: workout._id.toString(),
        userId: workout.userId.toString(),
        title: workout.title,
        description: workout.description || '',
        exercises: workout.exercises || [],
        duration: workout.duration || 0,
        date: workout.date,
        type: workout.type || 'custom',
        status: workout.status,
        notes: workout.notes || '',
        createdAt: workout.createdAt
      },
      success: true,
      message: 'Workout created successfully'
    });
  } catch (error) {
    console.error('Create workout error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a single workout
app.get('/api/workouts/:workoutId', authMiddleware, async (req, res) => {
  console.log('Get workout details endpoint hit:', new Date().toISOString());
  
  try {
    const { workoutId } = req.params;
    
    // Basic validation
    if (!workoutId) {
      return res.status(400).json({ message: 'Workout ID is required' });
    }
    
    // Connect to MongoDB
    const connected = await connectDB();
    if (!connected) {
      return res.status(500).json({ message: 'Database connection failed' });
    }
    
    // Get the model
    const Workout = getModel('Workout', workoutSchema);
    
    // Find the workout
    const workout = await Workout.findById(workoutId);
    
    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }
    
    // Verify user has permission to access this workout
    if (req.user.role !== 'admin' && req.user.id !== workout.userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this workout' });
    }
    
    // Return the workout
    return res.status(200).json({
      workout: {
        id: workout._id.toString(),
        userId: workout.userId.toString(),
        title: workout.title,
        description: workout.description || '',
        exercises: workout.exercises || [],
        duration: workout.duration || 0,
        date: workout.date,
        type: workout.type || 'custom',
        status: workout.status,
        notes: workout.notes || '',
        createdAt: workout.createdAt
      },
      success: true
    });
  } catch (error) {
    console.error('Get workout details error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a workout
app.put('/api/workouts/:workoutId', authMiddleware, async (req, res) => {
  console.log('Update workout endpoint hit:', new Date().toISOString());
  
  try {
    const { workoutId } = req.params;
    const { title, description, exercises, duration, date, type, status, notes } = req.body;
    
    // Basic validation
    if (!workoutId) {
      return res.status(400).json({ message: 'Workout ID is required' });
    }
    
    // Connect to MongoDB
    const connected = await connectDB();
    if (!connected) {
      return res.status(500).json({ message: 'Database connection failed' });
    }
    
    // Get the model
    const Workout = getModel('Workout', workoutSchema);
    
    // Find the workout
    const workout = await Workout.findById(workoutId);
    
    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }
    
    // Verify user has permission to update this workout
    if (req.user.role !== 'admin' && req.user.id !== workout.userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this workout' });
    }
    
    // Update fields
    if (title) workout.title = title;
    if (description !== undefined) workout.description = description;
    if (exercises) workout.exercises = exercises;
    if (duration !== undefined) workout.duration = duration;
    if (date) workout.date = new Date(date);
    if (type) workout.type = type;
    if (status) workout.status = status;
    if (notes !== undefined) workout.notes = notes;
    
    await workout.save();
    
    // Return the updated workout
    return res.status(200).json({
      workout: {
        id: workout._id.toString(),
        userId: workout.userId.toString(),
        title: workout.title,
        description: workout.description || '',
        exercises: workout.exercises || [],
        duration: workout.duration || 0,
        date: workout.date,
        type: workout.type || 'custom',
        status: workout.status,
        notes: workout.notes || '',
        createdAt: workout.createdAt
      },
      success: true,
      message: 'Workout updated successfully'
    });
  } catch (error) {
    console.error('Update workout error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a workout
app.delete('/api/workouts/:workoutId', authMiddleware, async (req, res) => {
  console.log('Delete workout endpoint hit:', new Date().toISOString());
  
  try {
    const { workoutId } = req.params;
    
    // Basic validation
    if (!workoutId) {
      return res.status(400).json({ message: 'Workout ID is required' });
    }
    
    // Connect to MongoDB
    const connected = await connectDB();
    if (!connected) {
      return res.status(500).json({ message: 'Database connection failed' });
    }
    
    // Get the model
    const Workout = getModel('Workout', workoutSchema);
    
    // Find the workout
    const workout = await Workout.findById(workoutId);
    
    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }
    
    // Verify user has permission to delete this workout
    if (req.user.role !== 'admin' && req.user.id !== workout.userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this workout' });
    }
    
    // Delete the workout
    await Workout.findByIdAndDelete(workoutId);
    
    // Return success
    return res.status(200).json({
      success: true,
      message: 'Workout deleted successfully'
    });
  } catch (error) {
    console.error('Delete workout error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// NUTRITION ROUTES
// ===============

// Get user meals
app.get('/api/meals/user/:userId', authMiddleware, async (req, res) => {
  console.log('Get user meals endpoint hit:', new Date().toISOString());
  
  try {
    const { userId } = req.params;
    
    // Basic validation
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Verify user has permission to access these meals
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Not authorized to access these meals' });
    }
    
    // Connect to MongoDB
    const connected = await connectDB();
    if (!connected) {
      return res.status(500).json({ message: 'Database connection failed' });
    }
    
    // Get the model
    const Meal = getModel('Meal', mealSchema);
    
    // Optional query parameters
    const { limit = 10, page = 1, startDate, endDate, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query
    const query = { userId };
    if (type) query.type = type;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    // Get meals
    const meals = await Meal.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Meal.countDocuments(query);
    
    // Format meals for response
    const formattedMeals = meals.map(meal => ({
      id: meal._id.toString(),
      userId: meal.userId.toString(),
      date: meal.date,
      type: meal.type,
      name: meal.name,
      foods: meal.foods || [],
      calories: meal.calories || 0,
      protein: meal.protein || 0,
      carbs: meal.carbs || 0,
      fat: meal.fat || 0,
      notes: meal.notes || '',
      createdAt: meal.createdAt
    }));
    
    // Return response
    return res.status(200).json({
      meals: formattedMeals,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      },
      success: true
    });
  } catch (error) {
    console.error('Get meals error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a meal
app.post('/api/meals', authMiddleware, async (req, res) => {
  console.log('Create meal endpoint hit:', new Date().toISOString());
  
  try {
    const { date, type, name, foods, calories, protein, carbs, fat, notes } = req.body;
    
    // Basic validation
    if (!type || !name) {
      return res.status(400).json({ message: 'Meal type and name are required' });
    }
    
    // Connect to MongoDB
    const connected = await connectDB();
    if (!connected) {
      return res.status(500).json({ message: 'Database connection failed' });
    }
    
    // Get the model
    const Meal = getModel('Meal', mealSchema);
    
    // Create meal
    const meal = new Meal({
      userId: req.user.id,
      date: date ? new Date(date) : new Date(),
      type,
      name,
      foods: foods || [],
      calories: calories || 0,
      protein: protein || 0,
      carbs: carbs || 0,
      fat: fat || 0,
      notes: notes || ''
    });
    
    await meal.save();
    
    // Return created meal
    return res.status(201).json({
      meal: {
        id: meal._id.toString(),
        userId: meal.userId.toString(),
        date: meal.date,
        type: meal.type,
        name: meal.name,
        foods: meal.foods || [],
        calories: meal.calories || 0,
        protein: meal.protein || 0,
        carbs: meal.carbs || 0,
        fat: meal.fat || 0,
        notes: meal.notes || '',
        createdAt: meal.createdAt
      },
      success: true,
      message: 'Meal created successfully'
    });
  } catch (error) {
    console.error('Create meal error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get nutrition summary for user by date range
app.get('/api/nutrition/summary/:userId', authMiddleware, async (req, res) => {
  console.log('Get nutrition summary endpoint hit:', new Date().toISOString());
  
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Basic validation
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Verify user has permission
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Not authorized to access this data' });
    }
    
    // Connect to MongoDB
    const connected = await connectDB();
    if (!connected) {
      return res.status(500).json({ message: 'Database connection failed' });
    }
    
    // Get the model
    const Meal = getModel('Meal', mealSchema);
    
    // Build query for date range
    const query = { userId };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    } else {
      // Default to last 7 days if no dates specified
      const defaultStartDate = new Date();
      defaultStartDate.setDate(defaultStartDate.getDate() - 7);
      query.date = { $gte: defaultStartDate };
    }
    
    // Get meals in date range
    const meals = await Meal.find(query).sort({ date: 1 });
    
    // Calculate daily totals
    const dailyTotals = {};
    meals.forEach(meal => {
      const dateStr = meal.date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!dailyTotals[dateStr]) {
        dailyTotals[dateStr] = {
          date: dateStr,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          mealCount: 0
        };
      }
      
      dailyTotals[dateStr].calories += meal.calories || 0;
      dailyTotals[dateStr].protein += meal.protein || 0;
      dailyTotals[dateStr].carbs += meal.carbs || 0;
      dailyTotals[dateStr].fat += meal.fat || 0;
      dailyTotals[dateStr].mealCount += 1;
    });
    
    // Convert to array and calculate averages
    const dailySummary = Object.values(dailyTotals);
    
    // Calculate overall summary
    const overallSummary = {
      totalDays: dailySummary.length,
      avgCalories: dailySummary.length ? dailySummary.reduce((sum, day) => sum + day.calories, 0) / dailySummary.length : 0,
      avgProtein: dailySummary.length ? dailySummary.reduce((sum, day) => sum + day.protein, 0) / dailySummary.length : 0,
      avgCarbs: dailySummary.length ? dailySummary.reduce((sum, day) => sum + day.carbs, 0) / dailySummary.length : 0,
      avgFat: dailySummary.length ? dailySummary.reduce((sum, day) => sum + day.fat, 0) / dailySummary.length : 0,
      totalCalories: dailySummary.reduce((sum, day) => sum + day.calories, 0),
      totalProtein: dailySummary.reduce((sum, day) => sum + day.protein, 0),
      totalCarbs: dailySummary.reduce((sum, day) => sum + day.carbs, 0),
      totalFat: dailySummary.reduce((sum, day) => sum + day.fat, 0)
    };
    
    return res.status(200).json({
      dailySummary,
      overallSummary,
      success: true
    });
  } catch (error) {
    console.error('Get nutrition summary error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
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