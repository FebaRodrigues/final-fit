const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

console.log('Starting Fitness Management System...');

// Determine the command to use based on the OS
const isWindows = os.platform() === 'win32';
const command = isWindows ? 'cmd.exe' : 'bash';
const args = isWindows ? ['/c'] : ['-c'];

// Create a .env file for the server if it doesn't exist
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
  console.log('.env file created for Server. Please update it with your actual credentials.');
}

// Create a .env file for the client if it doesn't exist
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
  console.log('.env file created for Client. Please update it with your actual credentials.');
}

// Start the server
console.log('Starting Server...');
const serverProcess = spawn(
  command,
  [...args, 'cd fitness-tracker/Server && node index.js'],
  {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NODE_ENV: 'development' }
  }
);

// Start the client
console.log('Starting Client...');
const clientProcess = spawn(
  command,
  [...args, 'cd fitness-tracker/Client/gym && npm run dev'],
  {
    stdio: 'inherit',
    shell: true
  }
);

console.log('Both server and client should be starting now.');
console.log('Server is running at http://localhost:5050');
console.log('Client is running at http://localhost:5173');

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down...');
  serverProcess.kill();
  clientProcess.kill();
  process.exit();
});

// Handle child process errors
serverProcess.on('error', (error) => {
  console.error('Server process error:', error);
});

clientProcess.on('error', (error) => {
  console.error('Client process error:', error);
});

// Handle child process exit
serverProcess.on('exit', (code) => {
  console.log(`Server process exited with code ${code}`);
});

clientProcess.on('exit', (code) => {
  console.log(`Client process exited with code ${code}`);
}); 