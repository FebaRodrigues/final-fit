// config/cloudinaryConfig.js
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

// Log Cloudinary configuration for debugging
console.log("Cloudinary Configuration:");
console.log("CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME ? "✓ Set" : "✗ Missing");
console.log("API_KEY:", process.env.CLOUDINARY_API_KEY ? "✓ Set" : "✗ Missing");
console.log("API_SECRET:", process.env.CLOUDINARY_API_SECRET ? "✓ Set" : "✗ Missing");

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Verify configuration
try {
    // Simple ping to verify credentials
    cloudinary.api.ping((error, result) => {
        if (error) {
            console.error("Cloudinary connection error:", error.message);
        } else {
            console.log("Cloudinary connected successfully:", result.status);
        }
    });
} catch (error) {
    console.error("Error initializing Cloudinary:", error.message);
}

module.exports = cloudinary;

