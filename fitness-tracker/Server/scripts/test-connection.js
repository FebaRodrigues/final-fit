// scripts/test-connection.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Stripe = require('stripe');
const fs = require('fs');

// Try to load environment variables from multiple locations
console.log('=== Loading Environment Variables ===');

// First try the server .env file
const serverEnvPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(serverEnvPath)) {
  console.log(`Loading .env from: ${serverEnvPath}`);
  dotenv.config({ path: serverEnvPath });
} else {
  console.log(`Server .env file not found at: ${serverEnvPath}`);
}

// If MONGO_URI is still not defined, try the root .env file
if (!process.env.MONGO_URI) {
  const rootEnvPath = path.resolve(__dirname, '../../../.env');
  if (fs.existsSync(rootEnvPath)) {
    console.log(`Loading .env from: ${rootEnvPath}`);
    dotenv.config({ path: rootEnvPath });
  } else {
    console.log(`Root .env file not found at: ${rootEnvPath}`);
  }
}

// If still not defined, try one more location
if (!process.env.MONGO_URI) {
  const alternateEnvPath = path.resolve(__dirname, '../../.env');
  if (fs.existsSync(alternateEnvPath)) {
    console.log(`Loading .env from: ${alternateEnvPath}`);
    dotenv.config({ path: alternateEnvPath });
  } else {
    console.log(`Alternate .env file not found at: ${alternateEnvPath}`);
  }
}

console.log('\n=== Environment Variables Check ===');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Defined ✓' : 'Not defined ✗');
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'Defined ✓' : 'Not defined ✗');
console.log('STRIPE_PUBLISHABLE_KEY:', process.env.STRIPE_PUBLISHABLE_KEY ? 'Defined ✓' : 'Not defined ✗');
console.log('STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? 'Defined ✓' : 'Not defined ✗');
console.log('NODE_ENV:', process.env.NODE_ENV || 'Not defined');
console.log('PORT:', process.env.PORT || 'Not defined');

// Test MongoDB connection
async function testMongoDBConnection() {
  console.log('\n=== Testing MongoDB Connection ===');
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }
    
    console.log('Connecting to MongoDB Atlas...');
    console.log('Using connection string:', process.env.MONGO_URI.substring(0, 20) + '...');
    
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000
    });
    
    console.log('MongoDB Atlas connection successful! ✓');
    console.log('Connection state:', mongoose.connection.readyState === 1 ? 'Connected' : 'Not connected');
    
    // List collections to verify connection
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name).join(', '));
    
    return true;
  } catch (error) {
    console.error('MongoDB Atlas connection failed:', error.message);
    return false;
  } finally {
    // Close the connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed.');
    }
  }
}

// Test Stripe configuration
async function testStripeConfiguration() {
  console.log('\n=== Testing Stripe Configuration ===');
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
    }
    
    console.log('Initializing Stripe...');
    console.log('Using Stripe key:', process.env.STRIPE_SECRET_KEY.substring(0, 7) + '...');
    
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16'
    });
    
    // Test the connection by retrieving account information
    const account = await stripe.account.retrieve();
    console.log('Stripe connection successful! ✓');
    console.log('Account ID:', account.id);
    console.log('Account country:', account.country);
    console.log('Account business type:', account.business_type);
    
    return true;
  } catch (error) {
    console.error('Stripe configuration test failed:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  const mongoSuccess = await testMongoDBConnection();
  const stripeSuccess = await testStripeConfiguration();
  
  console.log('\n=== Test Results ===');
  console.log('MongoDB Connection:', mongoSuccess ? 'Success ✓' : 'Failed ✗');
  console.log('Stripe Configuration:', stripeSuccess ? 'Success ✓' : 'Failed ✗');
  
  if (!mongoSuccess || !stripeSuccess) {
    console.log('\n=== Troubleshooting Tips ===');
    if (!mongoSuccess) {
      console.log('- Check if your MongoDB Atlas cluster is running');
      console.log('- Verify your MongoDB connection string in the .env file');
      console.log('- Ensure your IP address is whitelisted in MongoDB Atlas');
      console.log('- Check if your MongoDB Atlas username and password are correct');
    }
    if (!stripeSuccess) {
      console.log('- Verify your Stripe API keys in the .env file');
      console.log('- Ensure you are using the correct Stripe API version');
      console.log('- Check if your Stripe account is active');
    }
  }
  
  process.exit(0);
}

runTests(); 