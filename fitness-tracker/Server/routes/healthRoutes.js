const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Simple health check endpoint
router.get('/', async (req, res) => {
  // Check MongoDB connection status
  let dbStatus = 'unknown';
  let dbDetails = null;
  
  try {
    // Try to ping the database
    if (mongoose.connection.readyState === 1) {
      try {
        await mongoose.connection.db.admin().ping();
        dbStatus = 'connected';
        dbDetails = {
          database: mongoose.connection.db.databaseName,
          host: mongoose.connection.host,
          readyState: mongoose.connection.readyState
        };
        console.log('✅ MongoDB ping successful');
      } catch (pingError) {
        dbStatus = 'error';
        console.error('❌ MongoDB ping failed:', pingError.message);
      }
    } else {
      dbStatus = mongoose.connection.readyState === 2 ? 'connecting' : 'disconnected';
    }
  } catch (err) {
    dbStatus = 'error';
    console.error('Error checking MongoDB status:', err.message);
  }

  // Send response with detailed information
  res.status(200).json({ 
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    version: 'v1.0.3',
    database: {
      status: dbStatus,
      details: dbDetails
    },
    server: {
      uptime: Math.floor(process.uptime()) + ' seconds',
      memory: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB'
    }
  });
});

// Add a dedicated DB check endpoint
router.get('/db-check', async (req, res) => {
  try {
    console.log('Running manual MongoDB connection check');
    
    // Check existing connection
    if (mongoose.connection.readyState === 1) {
      console.log('Connection exists, checking ping...');
      try {
        await mongoose.connection.db.admin().ping();
        return res.status(200).json({
          connected: true,
          method: 'existing-connection',
          readyState: mongoose.connection.readyState,
          database: mongoose.connection.db.databaseName
        });
      } catch (pingErr) {
        console.error('Ping failed on existing connection:', pingErr);
      }
    }
    
    // Try a fresh connection if not connected
    console.log('Creating a direct test connection...');
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      return res.status(500).json({
        connected: false,
        error: 'No MONGO_URI found in environment'
      });
    }
    
    // Try a simple client connection with minimal options
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(mongoUri, {
      connectTimeoutMS: 5000,
      socketTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000
    });
    
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    const dbName = client.db().databaseName;
    await client.close();
    
    return res.status(200).json({
      connected: true,
      method: 'direct-client',
      database: dbName
    });
  } catch (error) {
    console.error('DB check failed:', error);
    return res.status(500).json({
      connected: false,
      error: error.message,
      code: error.code || 'unknown',
      name: error.name
    });
  }
});

module.exports = router;
