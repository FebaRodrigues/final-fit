// test-env-extended.js
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load .env file using absolute path
const envPath = path.resolve(__dirname, '.env');
console.log(`Looking for .env at: ${envPath}`);

if (fs.existsSync(envPath)) {
    console.log(`Found .env file, loading...`);
    try {
        const result = dotenv.config({ path: envPath });
        if (result.error) {
            console.error('Error parsing .env file:', result.error);
        } else {
            console.log('Successfully loaded .env file');
        }
    } catch (error) {
        console.error('Error loading .env file:', error);
    }
} else {
    console.error('ERROR: .env file not found at', envPath);
}

console.log('\n=== Environment Variables Test ===');

// Group variables by category
const variableGroups = {
    'Core Configuration': [
        'PORT',
        'MONGO_URI',
        'DB_URI',
        'JWT_SECRET',
        'JWT_EXPIRE',
        'NODE_ENV',
        'CLIENT_URL',
        'SESSION_SECRET',
        'API_URL'
    ],
    'Email Configuration': [
        'EMAIL_SERVICE',
        'EMAIL_USER',
        'EMAIL_PASS'
    ],
    'Cloudinary Configuration': [
        'CLOUDINARY_CLOUD_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET',
        'CLOUDINARY_UPLOAD_PRESET',
        'CLOUD_NAME',
        'API_KEY',
        'API_SECRET'
    ],
    'Stripe Configuration': [
        'STRIPE_SECRET_KEY',
        'STRIPE_WEBHOOK_SECRET',
        'STRIPE_PUBLISHABLE_KEY'
    ],
    'Additional Settings': [
        'OTP_EXPIRY',
        'ADMIN_REGISTRATION_KEY'
    ]
};

// Test all environment variables by group
let unsetCount = 0;
let setCount = 0;

console.log('\n=== Testing Environment Variables by Category ===');
Object.keys(variableGroups).forEach(groupName => {
    console.log(`\n== ${groupName} ==`);
    
    variableGroups[groupName].forEach(varName => {
        const value = process.env[varName];
        if (value) {
            setCount++;
            if (varName.includes('SECRET') || varName.includes('KEY') || varName.includes('URI') || varName.includes('PASS')) {
                // Mask sensitive values
                console.log(`${varName}: set ✓ (value: ${value.substring(0, 3)}...${value.substring(value.length - 3)})`);
            } else {
                console.log(`${varName}: ${value}`);
            }
        } else {
            unsetCount++;
            console.log(`${varName}: not set ✗`);
        }
    });
});

// Test accessing variables programmatically with fallbacks
console.log('\n=== Testing Programmatic Access with Fallbacks ===');

// Test Cloudinary variables (which use fallbacks in the code)
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY || process.env.API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.API_SECRET;

console.log(`cloudName: ${cloudName ? 'set ✓' : 'not set ✗'}`);
console.log(`apiKey: ${apiKey ? 'set ✓' : 'not set ✗'}`);
console.log(`apiSecret: ${apiSecret ? 'set ✓' : 'not set ✗'}`);

// Test JWT variables with fallbacks
const jwtExpire = process.env.JWT_EXPIRE || '30d';
console.log(`JWT_EXPIRE (with fallback): ${jwtExpire}`);

// Summary
console.log('\n=== Environment Variables Summary ===');
console.log(`Total variables checked: ${setCount + unsetCount}`);
console.log(`Variables set: ${setCount}`);
console.log(`Variables not set: ${unsetCount}`);

if (unsetCount > 0) {
    console.log('\nSome environment variables are not set. Check if they are required for your application.');
} else {
    console.log('\nAll environment variables are set. Your application should be configured correctly.');
}

// Test if the important modules that use these variables can be required
console.log('\n=== Testing Module Loading ===');

try {
    console.log('Testing MongoDB connection module...');
    const connectDB = require('./config/db');
    console.log('MongoDB connection module loaded successfully ✓');
} catch (error) {
    console.error('Failed to load MongoDB connection module ✗:', error.message);
}

try {
    console.log('Testing Stripe module...');
    if (process.env.STRIPE_SECRET_KEY) {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        console.log('Stripe module loaded successfully ✓');
    } else {
        console.log('Skipped Stripe module test (STRIPE_SECRET_KEY not set)');
    }
} catch (error) {
    console.error('Failed to load Stripe module ✗:', error.message);
}

try {
    console.log('Testing Cloudinary module...');
    if (cloudName && apiKey && apiSecret) {
        const cloudinary = require('cloudinary').v2;
        cloudinary.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret
        });
        console.log('Cloudinary module loaded successfully ✓');
    } else {
        console.log('Skipped Cloudinary module test (missing configuration)');
    }
} catch (error) {
    console.error('Failed to load Cloudinary module ✗:', error.message);
} 