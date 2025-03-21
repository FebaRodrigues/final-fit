const express = require('express');
const mongoose = require('mongoose');
const { performance } = require('perf_hooks');
const router = express.Router();
const cloudinary = require('cloudinary').v2;

// Health status endpoint - explicit CORS headers to ensure it can be reached for debugging
router.get('/', async (req, res) => {
  // Add explicit CORS headers for this critical endpoint
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  try {
    const start = performance.now();
    const mongoStatus = mongoose.connection.readyState;
    
    // Check MongoDB connection
    let connected = false;
    let dbMethod = 'unknown';
    let dbName = 'unknown';
    
    // Try to get direct MongoDB client connection info
    try {
      const { getDb, getClient, isMongooseReady, isDirect } = require('../config/db');
      if (isDirect()) {
        const db = getDb();
        if (db) {
          connected = true;
          dbMethod = 'direct-client';
          dbName = db.databaseName;
        }
      } else if (isMongooseReady()) {
        connected = true;
        dbMethod = 'mongoose';
        dbName = mongoose.connection.name;
      }
    } catch (dbError) {
      // If error getting client info, fall back to just readyState
      connected = mongoStatus === 1;
    }
    
    // Check Cloudinary connection
    let cloudinaryStatus = 'unknown';
    try {
      // Simple ping test to Cloudinary
      if (cloudinary.config().cloud_name) {
        cloudinaryStatus = 'ok';
      } else {
        cloudinaryStatus = 'not-configured';
      }
    } catch (cloudinaryError) {
      cloudinaryStatus = `error: ${cloudinaryError.message}`;
    }
    
    // Prepare response
    const end = performance.now();
    const responseTime = (end - start).toFixed(2);
    
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      responseTime: `${responseTime}ms`,
      version: process.env.APP_VERSION || 'v1.0.3',
      services: {
        database: {
          connected,
          method: dbMethod,
          database: dbName
        },
        cloudinary: {
          status: cloudinaryStatus
        },
        server: {
          uptime: process.uptime().toFixed(2) + 's'
        }
      }
    });
  } catch (error) {
    // If anything fails, we still want to return something
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Additional endpoint to check MongoDB connection specifically
router.get('/db-check', async (req, res) => {
  // Add explicit CORS headers
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }

  try {
    // Try different methods to validate MongoDB connection
    let connected = false;
    let method = 'unknown';
    let database = 'unknown';
    let error = null;
    
    // Method 1: Check direct MongoDB connection
    try {
      const { getDb, isDirect } = require('../config/db');
      
      if (isDirect && typeof isDirect === 'function' && isDirect()) {
        try {
          const db = getDb();
          if (db) {
            // Try a ping to validate connection
            await db.command({ ping: 1 });
            connected = true;
            method = 'direct-client';
            database = db.databaseName;
          }
        } catch (dbError) {
          error = `Direct client error: ${dbError.message}`;
        }
      }
    } catch (directError) {
      error = directError.message;
    }
    
    // Method 2: Check mongoose connection if direct client didn't work
    if (!connected) {
      try {
        if (mongoose.connection.readyState === 1) {
          try {
            // Try a ping to validate mongoose connection
            await mongoose.connection.db.admin().command({ ping: 1 });
            connected = true;
            method = 'mongoose';
            database = mongoose.connection.db.databaseName;
          } catch (pingError) {
            error = `Mongoose ping error: ${pingError.message}`;
          }
        } else {
          error = `Mongoose not connected (state: ${mongoose.connection.readyState})`;
        }
      } catch (mongooseError) {
        error = `Mongoose error: ${mongooseError.message}`;
      }
    }
    
    // Return detailed connection status
    return res.status(200).json({
      connected,
      method,
      database,
      error,
      mongooseState: mongoose.connection.readyState,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      connected: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
