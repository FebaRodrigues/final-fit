// Root index.js - Redirects to the serverless function
const app = require('./api/serverless');

// Export for Vercel
module.exports = app; 