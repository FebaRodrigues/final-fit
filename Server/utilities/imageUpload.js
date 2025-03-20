const cloudinary = require("cloudinary").v2;
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configure Cloudinary with hardcoded values
cloudinary.config({
    cloud_name: 'daacjyk3d',
    api_key: '529398839939766',
    api_secret: 'uh7GzWkQ4A5Hc2bfh-RyBk8AAFI'
});

// Log configuration for debugging
console.log("Cloudinary Configuration:");
console.log("CLOUD_NAME: daacjyk3d");
console.log("API_KEY: 529398839939766");
console.log("API_SECRET: ✓ Set");

const uploadToCloudinary = async (filePath) => {
    try {
        console.log("Uploading to Cloudinary...", filePath);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.error("File not found at path:", filePath);
            throw new Error("File not found at path: " + filePath);
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