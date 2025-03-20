const express = require('express');
const router = express.Router();

// Simple health check endpoint
router.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || '7000'
  });
});

// Note: Example code was removed to prevent server crash

module.exports = router;
