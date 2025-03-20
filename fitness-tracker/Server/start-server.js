// server/start-server.js
require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { spawn } = require('child_process');

// Try to load environment variables
console.log('=== Loading Environment Variables ===');

// Load from the server .env file
const serverEnvPath = path.resolve(__dirname, '.env');
if (fs.existsSync(serverEnvPath)) {
  console.log(`Loading .env from: ${serverEnvPath}`);
  dotenv.config({ path: serverEnvPath });
} else {
  console.error(`Server .env file not found at: ${serverEnvPath}`);
  console.error('Please create a .env file in the Server directory with required configuration.');
  process.exit(1);
}

// Critical environment variables that must be present
const criticalVars = ['MONGO_URI', 'JWT_SECRET', 'STRIPE_SECRET_KEY'];
const missingVars = criticalVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('=== ERROR: Missing Critical Environment Variables ===');
  console.error(`The following environment variables are missing: ${missingVars.join(', ')}`);
  console.error('Please ensure these are defined in your .env file.');
  console.error('Please check your .env file and try again.');
  process.exit(1);
}

// Start the server with nodemon for auto-restarting on changes
console.log('=== Starting Server ===');
const port = process.env.PORT || 5050;
console.log(`Server will listen on port ${port}`);

// Use nodemon to start the server
const nodemon = spawn('npx', ['nodemon', 'index.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

nodemon.on('close', code => {
  console.log(`Server process exited with code ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  nodemon.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  nodemon.kill('SIGTERM');
}); 