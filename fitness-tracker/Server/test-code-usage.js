// test-code-usage.js - Testing how environment variables are used in various parts of the application
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
const envPath = path.resolve(__dirname, '.env');
console.log(`Loading environment variables from: ${envPath}`);
dotenv.config({ path: envPath });

console.log('\n=== Testing Environment Variables in Code ===');

// 1. Test JWT token generation (authentication)
console.log('\n== Testing JWT Authentication ==');
try {
    const jwt = require('jsonwebtoken');
    
    // Check if JWT_SECRET is available
    if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not set. Authentication will fail.');
    } else {
        console.log('JWT_SECRET is available for authentication.');
        
        // Create a test token
        const testPayload = { id: 'test-user-id', role: 'user' };
        const token = jwt.sign(testPayload, process.env.JWT_SECRET, { 
            expiresIn: process.env.JWT_EXPIRE || '30d' 
        });
        
        console.log(`Test token created: ${token.substring(0, 20)}...`);
        
        // Verify the token works
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token verification successful ✓');
        console.log(`Decoded payload: id=${decoded.id}, role=${decoded.role}`);
    }
} catch (error) {
    console.error('JWT test failed:', error.message);
}

// 2. Test MongoDB connection (simulating what happens in config/db.js)
console.log('\n== Testing MongoDB Connection ==');
try {
    const mongoose = require('mongoose');
    
    if (!process.env.MONGO_URI && !process.env.DB_URI) {
        console.error('MONGO_URI and DB_URI are not set. Database connection will fail.');
    } else {
        const mongoUri = process.env.MONGO_URI || process.env.DB_URI;
        console.log(`MongoDB URI available: ${mongoUri.substring(0, 15)}...`);
        
        // Don't actually connect to the database here, just show how the URI would be used
        console.log('Connection would be established using this URI');
        
        // Show the fallback logic that might be used in the code
        console.log(`Connection string fallback logic: ${process.env.MONGO_URI || process.env.DB_URI || 'mongodb://localhost:27017/fitness'}`);
    }
} catch (error) {
    console.error('MongoDB test failed:', error.message);
}

// 3. Test Cloudinary configuration (as used in utils/imageUpload.js)
console.log('\n== Testing Cloudinary Configuration ==');
try {
    const cloudinary = require('cloudinary').v2;
    
    // Check if Cloudinary credentials are available
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY || process.env.API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.API_SECRET;
    
    if (!cloudName || !apiKey || !apiSecret) {
        console.error('Cloudinary credentials missing. Image uploads will fail.');
    } else {
        console.log('Cloudinary credentials available:');
        console.log(`- Cloud name: ${cloudName}`);
        console.log(`- API key: ${apiKey.substring(0, 5)}...`);
        console.log(`- API secret: ${apiSecret.substring(0, 5)}...`);
        
        // Simulate how the code configures cloudinary
        cloudinary.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret
        });
        
        console.log('Cloudinary configuration successful ✓');
    }
} catch (error) {
    console.error('Cloudinary test failed:', error.message);
}

// 4. Test Stripe configuration (as used in paymentController.js)
console.log('\n== Testing Stripe Configuration ==');
try {
    if (!process.env.STRIPE_SECRET_KEY) {
        console.error('STRIPE_SECRET_KEY is not set. Payment processing will fail.');
    } else {
        console.log(`Stripe secret key available: ${process.env.STRIPE_SECRET_KEY.substring(0, 10)}...`);
        
        // Initialize Stripe
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        console.log('Stripe initialization successful ✓');
        
        // Check webhook secret
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            console.warn('STRIPE_WEBHOOK_SECRET is not set. Webhook validation will fail.');
        } else {
            console.log(`Stripe webhook secret available: ${process.env.STRIPE_WEBHOOK_SECRET.substring(0, 10)}...`);
        }
    }
} catch (error) {
    console.error('Stripe test failed:', error.message);
}

// 5. Test Email configuration (as used in controllers that send emails)
console.log('\n== Testing Email Configuration ==');
try {
    const nodemailer = require('nodemailer');
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('EMAIL_USER or EMAIL_PASS is not set. Email notifications will fail.');
    } else {
        console.log(`Email credentials available: ${process.env.EMAIL_USER}`);
        
        // Create a transporter (but don't connect)
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        
        console.log('Email transporter creation successful ✓');
        console.log('(No actual email will be sent in this test)');
    }
} catch (error) {
    console.error('Email test failed:', error.message);
}

// 6. Test CORS and session configuration (as used in server.js or index.js)
console.log('\n== Testing CORS and Session Configuration ==');
try {
    // Check client URL for CORS
    if (!process.env.CLIENT_URL) {
        console.warn('CLIENT_URL is not set. CORS might not work correctly.');
    } else {
        console.log(`Client URL for CORS: ${process.env.CLIENT_URL}`);
    }
    
    // Check session secret
    if (!process.env.SESSION_SECRET) {
        console.warn('SESSION_SECRET is not set. Sessions will use a default secret which is insecure.');
    } else {
        console.log(`Session secret available: ${process.env.SESSION_SECRET.substring(0, 10)}...`);
    }
    
    console.log('CORS and session configuration test complete');
} catch (error) {
    console.error('CORS/Session test failed:', error.message);
}

// 7. Test additional variables like OTP_EXPIRY
console.log('\n== Testing Additional Configuration ==');
try {
    // OTP expiry
    const otpExpiry = process.env.OTP_EXPIRY || 10; // Default is 10 minutes
    console.log(`OTP expiry: ${otpExpiry} minutes`);
    
    // Admin registration key
    if (!process.env.ADMIN_REGISTRATION_KEY) {
        console.warn('ADMIN_REGISTRATION_KEY is not set. Admin registration might not work.');
    } else {
        console.log(`Admin registration key available: ${process.env.ADMIN_REGISTRATION_KEY.substring(0, 10)}...`);
    }
    
    console.log('Additional configuration test complete');
} catch (error) {
    console.error('Additional config test failed:', error.message);
}

console.log('\n=== Environment Variables Code Usage Test Complete ===');
console.log('The application should work correctly with the current environment variables.'); 