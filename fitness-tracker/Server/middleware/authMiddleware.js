// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Trainer = require('../models/Trainer');

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
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
    console.error('Authentication error:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Middleware to check if user is an admin
const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required' });
    }

    next();
  } catch (error) {
    console.error('Admin authorization error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Middleware to check if user is a trainer
const isTrainer = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'trainer') {
      return res.status(403).json({ message: 'Access denied. Trainer privileges required' });
    }

    next();
  } catch (error) {
    console.error('Trainer authorization error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Middleware to check if user is a regular user
const isUser = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Access denied. User privileges required' });
    }

    next();
  } catch (error) {
    console.error('User authorization error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Middleware to check if user is either an admin or a trainer
const isAdminOrTrainer = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'trainer') {
      return res.status(403).json({ message: 'Access denied. Admin or trainer privileges required' });
    }

    next();
  } catch (error) {
    console.error('Admin/Trainer authorization error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Middleware to check if user is the owner of the resource or an admin
const isResourceOwnerOrAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // If user is an admin, allow access
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if the resource belongs to the user
    const resourceUserId = req.params.userId || req.body.userId;
    
    if (!resourceUserId || resourceUserId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You can only access your own resources' });
    }

    next();
  } catch (error) {
    console.error('Resource owner authorization error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  authenticateToken,
  isAdmin,
  isTrainer,
  isUser,
  isAdminOrTrainer,
  isResourceOwnerOrAdmin
}; 