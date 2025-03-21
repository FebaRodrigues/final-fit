// cors-fix.js - Enhanced CORS middleware for better frontend compatibility
const corsMiddleware = (req, res, next) => {
    // Primary allowed origins
    const allowedOrigins = [
        'https://final-fit-frontend.vercel.app',
        'https://final-fit-frontend-dd9nzz0bj-feba-rodrigues-projects.vercel.app',
        'https://final-fit-frontend-ev7xv9kct-feba-rodrigues-projects.vercel.app'
    ];
    
    // Get origin from request
    const origin = req.headers.origin;
    
    // Set CORS headers based on origin
    if (origin) {
        // Check if origin matches any allowed origins or pattern
        if (
            allowedOrigins.includes(origin) || 
            origin.includes('vercel.app') || 
            origin.includes('localhost')
        ) {
            res.setHeader('Access-Control-Allow-Origin', origin);
        }
    }
    
    // Required for preflight OPTIONS requests
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-auth-token');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    
    // Continue to next middleware
    next();
};

module.exports = corsMiddleware; 