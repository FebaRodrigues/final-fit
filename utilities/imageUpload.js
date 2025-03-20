const cloudinary = require("cloudinary").v2;
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configure Cloudinary with the correct environment variable names
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY || process.env.API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET || process.env.API_SECRET
});

// Log configuration for debugging
console.log("Cloudinary Configuration:");
console.log("CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME ? "✓ Set" : "✗ Missing");
console.log("API_KEY:", process.env.CLOUDINARY_API_KEY || process.env.API_KEY ? "✓ Set" : "✗ Missing");
console.log("API_SECRET:", process.env.CLOUDINARY_API_SECRET || process.env.API_SECRET ? "✓ Set" : "✗ Missing");

const uploadToCloudinary = async (filePath) => {
    try {
        console.log("Uploading to Cloudinary...", filePath);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.error("File not found at path:", filePath);
            throw new Error("File not found at path: " + filePath);
        }
        
        // Check if Cloudinary is properly configured
        if (!(process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME) || 
            !(process.env.CLOUDINARY_API_KEY || process.env.API_KEY) || 
            !(process.env.CLOUDINARY_API_SECRET || process.env.API_SECRET)) {
            console.error("Cloudinary configuration missing. Check environment variables.");
            throw new Error("Cloudinary configuration missing. Please check your environment variables.");
        }
        
        // Upload the file
        const result = await cloudinary.uploader.upload(filePath, {
            folder: "fitnessApp",
            use_filename: true,
            unique_filename: true,
            resource_type: "auto" // Automatically detect resource type
        });

        console.log("Upload successful:", result.secure_url);
        
        // Clean up the local file after upload
        try {
            fs.unlinkSync(filePath);
            console.log("Temporary file removed:", filePath);
        } catch (unlinkError) {
            console.error("Error removing temporary file:", unlinkError);
        }
        
        return result;
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        
        // Provide more detailed error information
        if (error.http_code) {
            console.error(`HTTP Error ${error.http_code}: ${error.message}`);
        }
        
        // Don't delete the file on error so we can retry
        throw error; // Re-throw the error to be handled by the caller
    }
};

module.exports = uploadToCloudinary; 