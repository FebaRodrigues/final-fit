// cors-fix.js - Enhanced CORS middleware for better frontend compatibility
const corsMiddleware = (req, res, next) => {
    // Primary allowed origins - strict whitelist
    const allowedOrigins = [
        'https://final-fit-frontend.vercel.app'
    ];
    
    // Get origin from request
    const origin = req.headers.origin;
    
    // Set CORS headers based on origin
    if (origin) {
        // Only allow exact matches from the whitelist
        if (allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Credentials', 'true');
        } else {
            // For non-whitelisted origins, don't set CORS headers at all
            // This will cause browsers to block the request
            console.log(`CORS blocked for origin: ${origin}`);
        }
    } else {
        // For requests without origin (like curl or Postman), allow them in development
        if (process.env.NODE_ENV !== 'production') {
            res.setHeader('Access-Control-Allow-Origin', '*');
            // Don't set credentials true when using wildcard origin
        }
    }
    
    // Required for preflight OPTIONS requests
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-auth-token');
    
    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    
    // Continue to next middleware
    next();
};

module.exports = corsMiddleware; 