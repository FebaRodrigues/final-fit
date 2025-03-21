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
    // Try to get direct MongoDB client connection
    const { getDb, getClient, isMongooseReady, isDirect } = require('../config/db');
    let connected = false;
    let method = 'unknown';
    let database = 'unknown';
    
    if (isDirect()) {
      const db = getDb();
      if (db) {
        connected = true;
        method = 'direct-client';
        database = db.databaseName;
      }
    } else if (isMongooseReady()) {
      connected = true;
      method = 'mongoose';
      database = mongoose.connection.name;
    }
    
    res.status(200).json({
      connected,
      method,
      database
    });
  } catch (error) {
    res.status(500).json({
      connected: false,
      error: error.message
    });
  }
});

module.exports = router;
