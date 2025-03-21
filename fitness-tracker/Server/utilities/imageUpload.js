//utilities/imageUpload.js
const cloudinary = require("cloudinary").v2;
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configure Cloudinary (only once at module load)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Log configuration on startup
console.log("Cloudinary Configuration Status:", {
    cloud_name_set: !!process.env.CLOUDINARY_CLOUD_NAME,
    api_key_set: !!process.env.CLOUDINARY_API_KEY,
    api_secret_set: !!process.env.CLOUDINARY_API_SECRET
});

/**
 * Enhanced upload function with retries and improved error handling
 * @param {string} filePath - Path to the file to upload
 * @returns {Promise<object|null>} - Cloudinary response or null on failure
 */
const uploadToCloudinary = async (filePath) => {
    // Max retry attempts
    const MAX_RETRIES = 3;
    let attempts = 0;
    
    while (attempts < MAX_RETRIES) {
        attempts++;
        console.log(`Cloudinary upload attempt ${attempts}/${MAX_RETRIES} for: ${filePath}`);
        
        try {
            // Verify file exists and is readable
            if (!fs.existsSync(filePath)) {
                console.error(`File not found at path: ${filePath}`);
                return null;
            }
            
            // Verify file has content
            const stats = fs.statSync(filePath);
            if (stats.size === 0) {
                console.error(`File is empty (0 bytes): ${filePath}`);
                return null;
            }
            
            // Verify Cloudinary is configured
            if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
                console.error("Cloudinary credentials missing. Check environment variables.");
                return null;
            }
            
            // Perform the upload with timeout handling
            const uploadPromise = cloudinary.uploader.upload(filePath, {
                folder: "fitnessApp",
                use_filename: true,
                unique_filename: true,
                resource_type: "auto",
                timeout: 60000 // 60 second timeout
            });
            
            // Set a timeout in case Cloudinary hangs
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Upload timed out')), 65000)
            );
            
            // Race between upload and timeout
            const result = await Promise.race([uploadPromise, timeoutPromise]);
            
            console.log("Cloudinary upload successful:", result.secure_url);
            
            // Clean up local file after successful upload
            try {
                fs.unlinkSync(filePath);
                console.log("Temporary file removed:", filePath);
            } catch (unlinkError) {
                console.error("Error removing temporary file:", unlinkError);
                // Non-critical error, continue
            }
            
            return result;
            
        } catch (error) {
            console.error(`Cloudinary upload error (attempt ${attempts}/${MAX_RETRIES}):`, error.message);
            
            if (attempts < MAX_RETRIES) {
                // Wait before retrying (exponential backoff)
                const delay = Math.pow(2, attempts) * 1000;
                console.log(`Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                console.error("Max upload retries reached. Giving up.");
                return null;
            }
        }
    }
    
    return null;
};

module.exports = {
    uploadToCloudinary
};
