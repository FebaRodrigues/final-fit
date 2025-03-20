// Root index.js - redirects to the actual server
console.log('Starting from root index.js');
console.log('Redirecting to fitness-tracker/Server/index.js');

// Check if the .env files exist and create them if needed
const fs = require('fs');
const path = require('path');

// Create Server .env if it doesn't exist
const serverEnvPath = path.join(__dirname, 'fitness-tracker', 'Server', '.env');
if (!fs.existsSync(serverEnvPath)) {
  console.log('Creating .env file for the server...');
  const serverEnvContent = `
PORT=5050
MONGO_URI=mongodb+srv://your-mongodb-uri
JWT_SECRET=your-jwt-secret
NODE_ENV=development
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:5173
SESSION_SECRET=your-session-secret

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your-webhook-secret
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key

# OTP Expiry (in minutes)
OTP_EXPIRY=10

# Admin Registration Key
ADMIN_REGISTRATION_KEY=your-admin-registration-key
`;
  fs.writeFileSync(serverEnvPath, serverEnvContent);
  console.log('Server .env file created. Please update it with your actual credentials.');
}

// Create Client .env if it doesn't exist
const clientEnvPath = path.join(__dirname, 'fitness-tracker', 'Client', 'gym', '.env');
if (!fs.existsSync(clientEnvPath)) {
  console.log('Creating .env file for the client...');
  const clientEnvContent = `
VITE_APP_NAME=TrackFit
VITE_SERVER_URL=http://localhost:5050
VITE_DEMO_MODE=false
VITE_ENABLE_STRIPE=false

VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key

VITE_API_URL=http://localhost:5050/api

# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_API_KEY=your-api-key
VITE_CLOUDINARY_API_SECRET=your-api-secret
VITE_CLOUDINARY_UPLOAD_PRESET=fitness_app_preset
`;
  fs.writeFileSync(clientEnvPath, clientEnvContent);
  console.log('Client .env file created. Please update it with your actual credentials.');
}

// Simply require the actual server file
try {
  require('./fitness-tracker/Server/index.js');
} catch (error) {
  console.error('Error starting server:', error.message);
  process.exit(1);
} 