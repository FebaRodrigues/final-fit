// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Trainer = require('../models/Trainer');

// Authentication middleware that accepts an array of allowed roles
exports.auth = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ message: 'Authentication token is required' });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Add user data to request
      req.user = {
        id: decoded.id,
        role: decoded.role
      };
      
      console.log(`Auth middleware: User authenticated - ID: ${req.user.id}, Role: ${req.user.role}`);
      
      // Check if user has required role
      if (allowedRoles.length > 0) {
        console.log(`Auth middleware: Required roles: ${allowedRoles.join(', ')}`);
        
        if (!allowedRoles.includes(req.user.role)) {
          console.log(`Auth middleware: User role not allowed - User role: ${req.user.role}, Required roles: ${allowedRoles.join(', ')}`);
          return res.status(403).json({ message: 'Access denied. You do not have the required role.' });
        }
        
        console.log('Auth middleware: Access granted');
      }
      
      next();
    } catch (error) {
      console.error('Authentication error:', error.message);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  };
};

// Middleware to authenticate admin
exports.authenticateAdmin = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication token is required' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user is an admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required' });
    }
    
    // Add admin data to request
    req.user = {
      id: decoded.id,
      role: 'admin'
    };
    
    next();
  } catch (error) {
    console.error('Admin authentication error:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Middleware to authenticate trainer
exports.authenticateTrainer = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication token is required' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user is a trainer
    if (decoded.role !== 'trainer') {
      return res.status(403).json({ message: 'Access denied. Trainer privileges required' });
    }
    
    // Add trainer data to request
    req.user = {
      id: decoded.id,
      role: 'trainer'
    };
    
    next();
  } catch (error) {
    console.error('Trainer authentication error:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Middleware to authenticate user
exports.authenticateUser = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication token is required' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user data to request
    req.user = {
      id: decoded.id,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    console.error('User authentication error:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = {
  auth: exports.auth,
  authenticateUser: exports.authenticateUser,
  authenticateTrainer: exports.authenticateTrainer,
  authenticateAdmin: exports.authenticateAdmin
};










