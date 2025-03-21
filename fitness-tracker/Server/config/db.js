// config/db.js

const mongoose = require('mongoose');

// Cache the database connection for serverless environments
let cachedConnection = null;

const connectDB = async () => {
   try {
        // If we already have a connection, return it
        if (cachedConnection && mongoose.connection.readyState === 1) {
            console.log('Using existing MongoDB connection');
            return;
        }
        
        // Use MONGO_URI to match the .env file
        const mongoUri = process.env.MONGO_URI;
        
        if (!mongoUri) {
            throw new Error('MONGO_URI is not defined in environment variables');
        }
        
        // Set mongoose options for better connection handling in serverless environments
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, // Reduced timeout for serverless
            connectTimeoutMS: 5000,         // Reduced connection timeout
            socketTimeoutMS: 30000,         // Reduced socket timeout
            maxPoolSize: 10,                // Limit connection pool for serverless
            minPoolSize: 5,                 // Maintain minimum connections
            maxIdleTimeMS: 10000,           // Close idle connections after 10 seconds
            bufferCommands: false,          // Disable buffering for faster connect-close cycles
        };
        
        // Display connection details (with sensitive parts masked)
        const maskedUri = mongoUri.replace(/(mongodb\+srv:\/\/)([^:]+):([^@]+)@/, '$1$2:****@');
        console.log('=== MongoDB Connection Details ===');
        console.log(`Connection URI: ${maskedUri}`);
        console.log(`Connection Options: ${JSON.stringify(options, null, 2)}`);
        
        console.log('Connecting to MongoDB Atlas...');
        
        // Connect with retry logic
        let retries = 3;
        while (retries > 0) {
            try {
                await mongoose.connect(mongoUri, options);
                cachedConnection = mongoose.connection;
                break; // Connection successful, exit loop
            } catch (err) {
                retries--;
                if (retries === 0) throw err; // No more retries, propagate error
                console.log(`Connection attempt failed, retrying... (${retries} attempts left)`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
            }
        }
        
        // Display more detailed connection information
        const dbName = mongoose.connection.db.databaseName;
        console.log('=== MongoDB Connection Successful ===');
        console.log(`Connected to database: ${dbName}`);
        console.log(`Connection state: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Not connected'}`);
        console.log(`MongoDB version: ${await mongoose.connection.db.admin().serverInfo().then(info => info.version)}`);
        
        // Perform a quick ping to test the connection
        try {
            await mongoose.connection.db.admin().ping();
            console.log('✅ MongoDB ping successful');
        } catch (pingError) {
            console.error('❌ MongoDB ping failed:', pingError.message);
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
        console.error('MongoDB Atlas connection failed:', error.message);
        
        // Provide more detailed error messages based on error type
        if (error.name === 'MongoServerSelectionError') {
            console.error('Could not connect to any servers in your MongoDB Atlas cluster. One common reason is that you\'re trying to access the database from an IP that isn\'t whitelisted. Make sure your current IP address is on your Atlas cluster\'s IP whitelist: https://www.mongodb.com/docs/atlas/security-whitelist/');
        } else if (error.name === 'MongoParseError') {
            console.error('Invalid MongoDB connection string. Please check your MONGO_URI in .env file.');
        } else if (error.name === 'MongoNetworkError') {
            console.error('Network error connecting to MongoDB. Please check your internet connection.');
        } else if (error.message.includes('Authentication failed')) {
            console.error('MongoDB authentication failed. Please check your username and password in the connection string.');
        }
        
        // Don't exit the process, just log the error and continue
    }
};

// Add a listener for MongoDB connection events
mongoose.connection.on('connected', () => {
    console.log('MongoDB connection established');
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB connection disconnected');
});

// Handle application termination
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed due to app termination');
    process.exit(0);
});

module.exports = connectDB;

