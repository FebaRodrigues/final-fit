// test-client-env.js - Check client-side environment variables
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Define expected client-side variables
const expectedViteVars = [
    'VITE_APP_NAME',
    'VITE_SERVER_URL',
    'VITE_DEMO_MODE',
    'VITE_ENABLE_STRIPE',
    'VITE_STRIPE_PUBLISHABLE_KEY',
    'VITE_API_URL',
    'VITE_CLOUDINARY_CLOUD_NAME',
    'VITE_CLOUDINARY_UPLOAD_PRESET'
];

// Potentially problematic variables that should not be exposed client-side
const potentiallyProblematicVars = [
    'VITE_CLOUDINARY_API_SECRET',
    'VITE_CLOUDINARY_API_KEY',
    'VITE_JWT_SECRET',
    'VITE_STRIPE_SECRET_KEY'
];

console.log('=== Testing Client-Side Environment Variables ===');

// Find client .env file
const clientEnvPath = path.resolve(__dirname, '../Client/gym/.env');
console.log(`Looking for client .env at: ${clientEnvPath}`);

if (!fs.existsSync(clientEnvPath)) {
    console.error('ERROR: Client .env file not found');
    process.exit(1);
}

console.log('Client .env file found ✓');

// Read and parse client .env file
const clientEnvContent = fs.readFileSync(clientEnvPath, 'utf8');
const clientEnvLines = clientEnvContent.split('\n');

// Parse the client .env file manually to extract variable names
const clientEnvVars = {};
clientEnvLines.forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
        const equalIndex = line.indexOf('=');
        if (equalIndex > 0) {
            const key = line.substring(0, equalIndex).trim();
            const value = line.substring(equalIndex + 1).trim();
            clientEnvVars[key] = value;
        }
    }
});

// Check if expected variables are present
console.log('\n== Checking Required Client Variables ==');
let missingCount = 0;

expectedViteVars.forEach(varName => {
    if (clientEnvVars[varName]) {
        // Don't show values for security reasons
        console.log(`${varName}: set ✓`);
    } else {
        console.log(`${varName}: not set ✗`);
        missingCount++;
    }
});

// Check for potentially problematic variables
console.log('\n== Checking for Potentially Problematic Variables ==');
let problematicCount = 0;

potentiallyProblematicVars.forEach(varName => {
    if (clientEnvVars[varName]) {
        console.log(`${varName}: set ⚠️ (SECURITY RISK: This should not be exposed client-side)`);
        problematicCount++;
    } else {
        console.log(`${varName}: not set ✓`);
    }
});

// Compare with server variables to ensure consistency
console.log('\n== Checking Consistency with Server Variables ==');

// Load server .env
const serverEnvPath = path.resolve(__dirname, '.env');
dotenv.config({ path: serverEnvPath });

// Check server-client consistency for key values
const consistencyChecks = [
    {
        serverVar: 'STRIPE_PUBLISHABLE_KEY',
        clientVar: 'VITE_STRIPE_PUBLISHABLE_KEY',
        description: 'Stripe publishable key'
    },
    {
        serverVar: 'CLOUDINARY_CLOUD_NAME',
        clientVar: 'VITE_CLOUDINARY_CLOUD_NAME',
        description: 'Cloudinary cloud name'
    },
    {
        serverVar: 'CLOUDINARY_UPLOAD_PRESET',
        clientVar: 'VITE_CLOUDINARY_UPLOAD_PRESET',
        description: 'Cloudinary upload preset'
    }
];

let inconsistencyCount = 0;

consistencyChecks.forEach(check => {
    const serverValue = process.env[check.serverVar];
    const clientValue = clientEnvVars[check.clientVar];
    
    if (!serverValue && !clientValue) {
        console.log(`${check.description}: Both not set ⚠️`);
        inconsistencyCount++;
    } else if (!serverValue) {
        console.log(`${check.description}: Only set in client ⚠️`);
        inconsistencyCount++;
    } else if (!clientValue) {
        console.log(`${check.description}: Only set in server ⚠️`);
        inconsistencyCount++;
    } else if (serverValue === clientValue) {
        console.log(`${check.description}: Consistent across server and client ✓`);
    } else {
        console.log(`${check.description}: Values differ between server and client ⚠️`);
        inconsistencyCount++;
    }
});

// Check API URL consistency
const serverPort = process.env.PORT || '5050';
const expectedApiUrl = `http://localhost:${serverPort}/api`;
if (clientEnvVars['VITE_API_URL'] && clientEnvVars['VITE_API_URL'] !== expectedApiUrl) {
    console.log(`API URL inconsistency: Server is ${serverPort} but client VITE_API_URL is ${clientEnvVars['VITE_API_URL']} ⚠️`);
    inconsistencyCount++;
} else if (clientEnvVars['VITE_API_URL'] === expectedApiUrl) {
    console.log(`API URL: Consistent with server port ✓`);
}

// Summary
console.log('\n=== Client Environment Variables Summary ===');
console.log(`Total variables checked: ${expectedViteVars.length}`);
console.log(`Missing variables: ${missingCount}`);
console.log(`Potentially problematic variables: ${problematicCount}`);
console.log(`Inconsistencies with server: ${inconsistencyCount}`);

if (missingCount > 0 || problematicCount > 0 || inconsistencyCount > 0) {
    console.log('\nThere are issues with the client environment variables that should be addressed.');
} else {
    console.log('\nClient environment variables are configured correctly.');
} 