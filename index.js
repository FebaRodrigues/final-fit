// Root index.js - redirects to the actual server
console.log('Starting from root index.js');
console.log('Redirecting to fitness-tracker/Server/index.js');
console.log('Environment:', process.env.NODE_ENV);
console.log('CLIENT_URL:', process.env.CLIENT_URL);

// Setup basic CORS handling at the root level
const express = require('express');
const cors = require('cors');

const app = express();

// Apply simple CORS middleware
app.use(cors({
  origin: 'https://final-fit-frontend.vercel.app',
  credentials: true
}));

// Define a simple health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Root server is healthy' });
});

// Pass through to the real server implementation
try {
  require('./fitness-tracker/Server/index.js');
} catch (error) {
  console.error('Error starting server:', error.message);
  
  // If the main server fails, at least provide some basic endpoints
  app.get('*', (req, res) => {
    res.status(500).json({ 
      error: 'Main server failed to start', 
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  });
  
  // Start a minimal server to show errors
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Emergency server running on port ${PORT}`);
  });
} 