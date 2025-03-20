// checkConfig.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('Checking server configuration...');

// Check environment variables
console.log('\nEnvironment Variables:');
console.log('PORT:', process.env.PORT || '(not set, will default to 5051)');
console.log('MONGO_URI:', process.env.MONGO_URI ? '(set)' : '(not set)');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '(set)' : '(not set)');
console.log('CLIENT_URL:', process.env.CLIENT_URL || '(not set)');
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '(set)' : '(not set)');

// Check if required files exist
console.log('\nChecking required files:');
const requiredFiles = [
  'index.js',
  'config/db.js',
  'models/Goal.js',
  'controllers/goalController.js',
  'routes/goals.js'
];

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} does not exist`);
  }
});

// Check MongoDB connection
console.log('\nChecking MongoDB connection:');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    
    // Check if collections exist
    const collections = ['goals', 'users', 'memberships', 'payments'];
    collections.forEach(async (collection) => {
      try {
        const count = await mongoose.connection.db.collection(collection).countDocuments();
        console.log(`✅ Collection '${collection}' exists with ${count} documents`);
      } catch (err) {
        console.log(`❌ Error checking collection '${collection}':`, err.message);
      }
    });
    
    // Close connection after 2 seconds to allow time for collection checks
    setTimeout(() => {
      mongoose.connection.close();
      console.log('\nConfiguration check complete.');
    }, 2000);
  })
  .catch(err => {
    console.log('❌ MongoDB connection error:', err.message);
    console.log('\nConfiguration check complete with errors.');
  });

// Check if server can listen on the specified port
const net = require('net');
const port = process.env.PORT || 5051;
const server = net.createServer();

server.once('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`❌ Port ${port} is already in use. Another server might be running.`);
  } else {
    console.log(`❌ Error checking port ${port}:`, err.message);
  }
});

server.once('listening', () => {
  console.log(`✅ Port ${port} is available`);
  server.close();
});

server.listen(port); 