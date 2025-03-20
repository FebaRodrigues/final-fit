// test-env.js
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
const vars = [
    'JWT_SECRET',
    'JWT_EXPIRE',
    'MONGO_URI',
    'SESSION_SECRET',
    'STRIPE_SECRET_KEY',
    'CLIENT_URL',
    'NODE_ENV',
    'CLOUDINARY_CLOUD_NAME'
];

vars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
        if (varName.includes('SECRET') || varName.includes('KEY') || varName.includes('URI')) {
            console.log(`${varName}: set ✓ (value: ${value.substring(0, 3)}...${value.substring(value.length - 3)})`);
        } else {
            console.log(`${varName}: ${value}`);
        }
    } else {
        console.log(`${varName}: not set ✗`);
    }
}); 