// cors-fix.js - Enhanced CORS middleware for better frontend compatibility
const corsMiddleware = (req, res, next) => {
    // Primary allowed origins - strict whitelist
    const allowedOrigins = [
        'https://final-fit-frontend.vercel.app',
        'http://localhost:5173',
        'http://localhost:5174'
    ];
    
    // Get origin from request
    const origin = req.headers.origin;
    
    // Set CORS headers for all requests regardless of method
    if (origin) {
        // Only allow exact matches from the whitelist
        if (allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
            res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-auth-token');
            // Allow expose Authorization header if needed
            res.setHeader('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range');
            // Increase max age for preflight cache to reduce OPTIONS requests
            res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
        } else {
            console.log(`CORS blocked for origin: ${origin}`);
        }
    } else {
        // For requests without origin (like curl or Postman), allow them in development
        if (process.env.NODE_ENV !== 'production') {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
            res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-auth-token');
        }
    }
    
    // Immediate response for OPTIONS requests
    if (req.method === 'OPTIONS') {
        console.log('Handling OPTIONS preflight request');
        return res.status(200).end();
    }
    
    // Continue to next middleware
    next();
};

module.exports = corsMiddleware; 