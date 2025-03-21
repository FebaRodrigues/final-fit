// config/db.js

const mongoose = require('mongoose');

// Track if we've already tried to connect
let isConnecting = false;
let connectionEstablished = false;

const connectDB = async () => {
   try {
        // If we're already connected, return early
        if (mongoose.connection.readyState === 1) {
            console.log('MongoDB connection already established, reusing existing connection');
            connectionEstablished = true;
            return;
        }

        // If connection is already in progress, wait for it
        if (isConnecting) {
            console.log('MongoDB connection attempt already in progress');
            // Wait for connection to complete
            await new Promise(resolve => {
                const checkConnection = setInterval(() => {
                    if (connectionEstablished || mongoose.connection.readyState === 1) {
                        clearInterval(checkConnection);
                        resolve();
                    }
                }, 100);
            });
            return;
        }

        isConnecting = true;
        
        // Use MONGO_URI to match the .env file
        const mongoUri = process.env.MONGO_URI;
        
        if (!mongoUri) {
            throw new Error('MONGO_URI is not defined in environment variables');
        }
        
        // Set mongoose options optimized for serverless environments
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,  // Shorter timeout for serverless
            connectTimeoutMS: 5000,          // Faster connection timeout
            socketTimeoutMS: 10000,          // Faster socket timeout
            maxPoolSize: 5,                  // Limit pool size for serverless
            minPoolSize: 1,                  // Ensure at least one connection is kept
            family: 4                        // Use IPv4, avoids issues with some networks
        };
        
        // Display connection details (with sensitive parts masked)
        const maskedUri = mongoUri.replace(/(mongodb\+srv:\/\/)([^:]+):([^@]+)@/, '$1$2:****@');
        console.log('=== MongoDB Connection Details ===');
        console.log(`Connection URI: ${maskedUri}`);
        console.log(`Connection Options: ${JSON.stringify(options, null, 2)}`);
        
        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(mongoUri, options);
        
        // Connection successful
        connectionEstablished = true;
        isConnecting = false;
        
        // Display more detailed connection information
        const dbName = mongoose.connection.db.databaseName;
        console.log('=== MongoDB Connection Successful ===');
        console.log(`Connected to database: ${dbName}`);
        console.log(`Connection state: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Not connected'}`);
        
        // Only fetch server info if we're not in a serverless environment
        if (process.env.NODE_ENV !== 'production') {
            try {
                const serverInfo = await mongoose.connection.db.admin().serverInfo();
                console.log(`MongoDB version: ${serverInfo.version}`);
            } catch (err) {
                console.log(`MongoDB server info not available: ${err.message}`);
            }
        }
        
        // Drop the problematic index on the payments collection
        try {
            const db = mongoose.connection.db;
            const collections = await db.listCollections({ name: 'payments' }).toArray();
            
            if (collections.length > 0) {
                console.log('Checking for problematic index on payments collection...');
                const indexes = await db.collection('payments').indexes();
                const hasTransactionIdIndex = indexes.some(index => index.name === 'transactionId_1');
                
                if (hasTransactionIdIndex) {
                    console.log('Dropping problematic index on payments collection...');
                    await db.collection('payments').dropIndex('transactionId_1');
                    console.log('Successfully dropped index transactionId_1');
                } else {
                    console.log('Index transactionId_1 not found, no need to drop');
                }
            } else {
                console.log('Payments collection not found, no need to drop index');
            }
        } catch (indexError) {
            // If the index doesn't exist, that's fine
            if (indexError.code !== 27) {
                console.warn('Warning: Failed to drop index:', indexError.message);
            } else {
                console.log('Index transactionId_1 does not exist, no need to drop');
            }
        }
    } catch (error) {
        isConnecting = false;
        console.error('MongoDB Atlas connection failed:', error.message);
        
        // Check if IP is in the whitelist
        const ipCheckMsg = "Please ensure that the IP address of this server is whitelisted in MongoDB Atlas. " +
                          "For Vercel deployments, set the MongoDB network access to 0.0.0.0/0 (allow from anywhere).";
        console.error(ipCheckMsg);
        
        // Provide more detailed error messages based on error type
        if (error.name === 'MongoServerSelectionError') {
            console.error('Could not connect to any MongoDB server. Please check:');
            console.error('1. Your network connection');
            console.error('2. MongoDB Atlas cluster status');
            console.error('3. IP whitelist settings in MongoDB Atlas');

            // Attempt to ping cloudinary to check general connectivity
            try {
                const cloudinary = require('cloudinary').v2;
                const result = await cloudinary.api.ping();
                console.log(`✅ Cloudinary ping successful: ${result.status}`);
            } catch (cloudErr) {
                console.log(`❌ Cloudinary ping failed: ${cloudErr.message}`);
                console.log('This suggests a general connectivity issue, not specific to MongoDB');
            }
            
        } else if (error.name === 'MongoParseError') {
            console.error('Invalid MongoDB connection string. Please check your MONGO_URI in .env file.');
        } else if (error.name === 'MongoNetworkError') {
            console.error('Network error connecting to MongoDB. Please check your internet connection.');
        } else if (error.message.includes('Authentication failed')) {
            console.error('MongoDB authentication failed. Please check your username and password in the connection string.');
        }
    }
};

// Add a listener for MongoDB connection events
mongoose.connection.on('connected', () => {
    console.log('MongoDB connection established');
    connectionEstablished = true;
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB connection disconnected');
    connectionEstablished = false;
});

// Handle application termination
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed due to app termination');
    process.exit(0);
});

module.exports = connectDB;

