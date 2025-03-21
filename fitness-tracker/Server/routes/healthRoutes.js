const express = require('express');
const router = express.Router();

// Simple health check endpoint
router.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || '7000',
    version: 'v1.0.3-otp-fix',
    deployedAt: '2024-03-21',
    features: [
      'Direct OTP generation', 
      'Universal OTP verification', 
      'Enhanced error handling'
    ],
    server: {
      node: process.version,
      uptime: Math.floor(process.uptime()) + ' seconds',
      memory: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB'
    }
  });
});

// Note: Example code was removed to prevent server crash

module.exports = router;
