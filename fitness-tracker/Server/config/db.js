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
        
        // Force the connection string to have the right format - explicitly construct it
        const originalUri = mongoUri;
        
        // Extract credentials from original URI
        let username, password, host;
        try {
            // Parse the MongoDB URI to extract parts
            const uriMatch = originalUri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)/);
            if (uriMatch) {
                username = uriMatch[1];
                password = uriMatch[2];
                host = uriMatch[3];
                
                // Reconstruct the URI with explicit database and auth source
                mongoUri = `mongodb+srv://${username}:${password}@${host}/test?authSource=admin&retryWrites=true&w=majority`;
                console.log('Reconstructed MongoDB URI with explicit database and auth source');
            }
        } catch (parseError) {
            console.error('Failed to parse MongoDB URI:', parseError.message);
            // Continue with original URI
            mongoUri = originalUri;
        }
        
        // Set mongoose options for better connection handling in serverless environments
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
            socketTimeoutMS: 45000, 
            maxPoolSize: 10,
            minPoolSize: 1,
            maxIdleTimeMS: 10000,
            bufferCommands: false,
            family: 4,
            // Add explicit auth database 
            authSource: 'admin',
            // Force single connection to avoid pooling issues in serverless
            poolSize: 1
        };
        
        // Display connection details (with sensitive parts masked)
        const maskedUri = mongoUri.replace(/(mongodb\+srv:\/\/)([^:]+):([^@]+)@/, '$1$2:****@');
        console.log('=== MongoDB Connection Details ===');
        console.log(`Connection URI: ${maskedUri}`);
        console.log(`Connection Options: ${JSON.stringify(options, null, 2)}`);
        
        console.log('Connecting to MongoDB Atlas...');
        
        // Try direct MongoClient approach with simpler, more reliable options
        try {
            console.log('Attempting direct MongoClient connection...');
            const client = new MongoClient(mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 10000,
                connectTimeoutMS: 10000,
                socketTimeoutMS: 30000,
                maxPoolSize: 1,  // Single connection for serverless
                retryWrites: true,
                authSource: 'admin'
            });
            
            // Simple connect with timeouts
            await Promise.race([
                client.connect(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Connection timeout after 9 seconds')), 9000)
                )
            ]);
            
            // Simple ping with timeout
            await Promise.race([
                client.db('admin').command({ ping: 1 }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Ping timeout after 5 seconds')), 5000)
                )
            ]);
            
            // Store the client and db in cache - explicitly use "test" database
            cachedDb = client.db('test');
            cachedConnection = client;
            
            console.log('=== Direct MongoDB Connection Successful ===');
            console.log(`Connected to database: ${cachedDb.databaseName}`);
            console.log('Using native MongoClient instead of Mongoose');
            
            // Return early - we're using direct client instead of mongoose
            return client;
            
        } catch (directError) {
            console.error('Direct MongoClient connection failed:', directError.message);
            console.log('Falling back to Mongoose connection...');
            // Continue with mongoose as fallback
        }
        
        // Connect with retry logic (mongoose fallback)
        let retries = 1; // Single retry for serverless environment
        let conn = null;
        
        while (retries >= 0) {
            try {
                conn = await Promise.race([
                    mongoose.connect(mongoUri, options),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Mongoose connection timeout after 9 seconds')), 9000)
                    )
                ]);
                
                cachedConnection = mongoose.connection;
                
                console.log(`MongoDB Connected: ${conn.connection.host}`);
                
                break; // Connection successful, exit loop
            } catch (err) {
                retries--;
                if (retries < 0) throw err; // No more retries, propagate error
                console.log(`Connection attempt failed, retrying... (${retries} attempts left)`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Short wait before retry
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
        
        // Detailed error for internal server error response
        const errorDetails = {
            message: error.message,
            name: error.name,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        };
        console.error('MongoDB connection error details:', JSON.stringify(errorDetails));
        
        // In production, don't exit the process - allow failover to a local mock or in-memory DB
        if (process.env.NODE_ENV === 'production') {
            console.error('Continuing without MongoDB in production environment - using emergency mode');
            
            // Return a mock DB connection to prevent app from crashing
            return {
                // Mock a connection to prevent crashes
                connection: {
                    readyState: 1,
                    db: {
                        databaseName: 'emergency-mock-db'
                    }
                }
            };
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
    
    // Emergency mock DB for production to prevent crashes
    if (process.env.NODE_ENV === 'production') {
        console.warn('Using emergency mock DB - database operations will fail silently');
        return {
            collection: (name) => ({
                findOne: async () => null,
                find: async () => ({ toArray: async () => [] }),
                insertOne: async () => ({ insertedId: 'mock-id' }),
                updateOne: async () => ({ modifiedCount: 0 }),
                deleteOne: async () => ({ deletedCount: 0 })
            })
        };
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

