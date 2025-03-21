// config/db.js

const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');

// Cache the database connection for serverless environments
let cachedConnection = null;
let cachedDb = null;

const connectDB = async () => {
   try {
        // If we already have a connection, return it
        if (cachedConnection && mongoose.connection.readyState === 1) {
            console.log('Using existing MongoDB connection');
            return mongoose.connection;
        }
        
        // Use MONGO_URI to match the .env file but ensure it has the database name
        let mongoUri = process.env.MONGO_URI || '';
        
        if (!mongoUri) {
            throw new Error('MONGO_URI is not defined in environment variables');
        }
        
        // Make sure the URI includes the database name "test"
        if (!mongoUri.includes('/test?')) {
            // Add the database name "test" before the query parameters
            mongoUri = mongoUri.replace('/?', '/test?');
            console.log('Added database name "test" to MongoDB URI');
        }
        
        // Set mongoose options for better connection handling in serverless environments
        const options = {
            useNewUrlParser: true,            // Use the new URL parser (recommended)
            useUnifiedTopology: true,         // Use the new Server Discovery and Monitoring engine
            serverSelectionTimeoutMS: 10000,  // Reduced from 30s to 10s to fail faster in serverless
            connectTimeoutMS: 10000,          // Reduced from 30s to 10s to fail faster in serverless
            socketTimeoutMS: 45000,           // Timeout for socket operations
            maxPoolSize: 10,                  // Limit connection pool for serverless
            minPoolSize: 1,                   // Reduced minimum connections for serverless
            maxIdleTimeMS: 10000,             // Close idle connections after 10 seconds
            bufferCommands: false,            // Disable buffering for faster connect-close cycles
            family: 4                         // Force IPv4 (can help with some networking issues)
        };
        
        // Display connection details (with sensitive parts masked)
        const maskedUri = mongoUri.replace(/(mongodb\+srv:\/\/)([^:]+):([^@]+)@/, '$1$2:****@');
        console.log('=== MongoDB Connection Details ===');
        console.log(`Connection URI: ${maskedUri}`);
        console.log(`Connection Options: ${JSON.stringify(options, null, 2)}`);
        
        console.log('Connecting to MongoDB Atlas...');
        
        // Try direct MongoClient approach first for serverless environments
        try {
            console.log('Attempting direct MongoClient connection...');
            const client = new MongoClient(mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 10000,  // Reduced timeout for serverless
                connectTimeoutMS: 10000,          // Reduced timeout for serverless
                socketTimeoutMS: 45000,           // Timeout for socket operations
                maxPoolSize: 10,                  // Limit pool size
                minPoolSize: 1                    // Reduced for serverless
            });
            
            await client.connect();
            
            // Test the connection with a ping
            await client.db('admin').command({ ping: 1 });
            
            // Store the client and db in cache - explicitly use "test" database
            cachedDb = client.db('test');
            cachedConnection = client;
            
            console.log('=== Direct MongoDB Connection Successful ===');
            console.log(`Connected to database: ${cachedDb.databaseName}`);
            console.log('Using native MongoClient instead of Mongoose');
            
            // Return early - we're using direct client instead of mongoose
            return client;
            
        } catch (directError) {
            console.warn('Direct MongoClient connection failed:', directError.message);
            console.log('Falling back to Mongoose connection...');
            // Continue with mongoose as fallback
        }
        
        // Connect with retry logic (mongoose fallback)
        let retries = 2; // Reduced from 3 to 2 for faster failure in serverless
        let conn = null;
        
        while (retries > 0) {
            try {
                conn = await mongoose.connect(mongoUri, options);
                cachedConnection = mongoose.connection;
                
                console.log(`MongoDB Connected: ${conn.connection.host}`);
                
                break; // Connection successful, exit loop
            } catch (err) {
                retries--;
                if (retries === 0) throw err; // No more retries, propagate error
                console.log(`Connection attempt failed, retrying... (${retries} attempts left)`);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry (reduced for serverless)
            }
        }
        
        // Display more detailed connection information
        const dbName = mongoose.connection.db.databaseName;
        console.log('=== MongoDB Connection Successful ===');
        console.log(`Connected to database: ${dbName}`);
        console.log(`Connection state: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Not connected'}`);
        
        // Perform a quick ping to test the connection
        try {
            await mongoose.connection.db.admin().ping();
            console.log('✅ MongoDB ping successful');
        } catch (pingError) {
            console.error('❌ MongoDB ping failed:', pingError.message);
        }
        
        return conn;
    } catch (error) {
        console.error('MongoDB Atlas connection failed:', error.message);
        
        // Provide more detailed error messages based on error type
        if (error.name === 'MongoServerSelectionError') {
            console.error('Could not connect to any servers in your MongoDB Atlas cluster. Make sure your current IP address is on your Atlas cluster\'s IP whitelist.');
        } else if (error.name === 'MongoParseError') {
            console.error('Invalid MongoDB connection string. Please check your MONGO_URI in .env file.');
        } else if (error.name === 'MongoNetworkError') {
            console.error('Network error connecting to MongoDB. Please check your internet connection.');
        } else if (error.message.includes('Authentication failed')) {
            console.error('MongoDB authentication failed. Please check your username and password in the connection string.');
        }
        
        // In production, don't exit the process
        if (process.env.NODE_ENV === 'production') {
            console.error('Continuing despite MongoDB connection failure in production environment');
            return null;
        }
        
        // In development, exit the process
        console.error('Exiting due to MongoDB connection failure in development environment');
        process.exit(1);
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

// Function to get the database (either mongoose or direct client)
const getDb = () => {
    if (cachedDb) {
        return cachedDb; // Return the direct MongoClient db if available
    }
    
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection.db; // Return mongoose connection if available
    }
    
    throw new Error('No database connection available');
};

// Function to get the MongoDB client
const getClient = () => {
    if (cachedConnection) {
        return cachedConnection; // Direct client
    }
    
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection.getClient(); // Mongoose client
    }
    
    throw new Error('No client connection available');
};

// Check if we're using direct client or mongoose
const isDirect = () => {
    return !!cachedDb && !!cachedConnection && !(cachedConnection instanceof mongoose.Connection);
};

// Check if mongoose is ready
const isMongooseReady = () => {
    return mongoose.connection.readyState === 1;
};

// Handle application termination
process.on('SIGINT', async () => {
    if (cachedConnection) {
        if (cachedConnection.close) {
            // Direct MongoDB client
            await cachedConnection.close();
        } else if (cachedConnection.disconnect) {
            // Mongoose connection
            await cachedConnection.disconnect();
        }
    }
    console.log('MongoDB connection closed due to app termination');
    process.exit(0);
});

module.exports = connectDB;
// Export the getDb function for direct client access
module.exports.getDb = getDb;
module.exports.getClient = getClient;
module.exports.isDirect = isDirect;
module.exports.isMongooseReady = isMongooseReady;

