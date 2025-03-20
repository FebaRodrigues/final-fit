//utilities/imageUpload.js
const cloudinary = require("cloudinary").v2;
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configure Cloudinary using environment variables
const cloudinaryConfig = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
};

// Set configuration
cloudinary.config(cloudinaryConfig);

// Debug Cloudinary configuration
console.log("============ CLOUDINARY DEBUG INFO ============");
console.log("Current Cloudinary Configuration:");
console.log("Cloud Name:", cloudinaryConfig.cloud_name);
console.log("API Key:", cloudinaryConfig.api_key);
console.log("API Secret is set:", !!cloudinaryConfig.api_secret);

// Test the configuration immediately
cloudinary.api.ping()
  .then(result => {
    console.log("✅ Cloudinary ping successful:", result.status);
  })
  .catch(error => {
    console.error("❌ Cloudinary ping failed!", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
  });

/**
 * Upload an image to Cloudinary
 * @param {string} filePath Path to the image file
 * @returns {Promise<string>} URL of the uploaded image
 */
const uploadToCloudinary = async (filePath) => {
    console.log("=== Starting Cloudinary upload ===");
    console.log("File path:", filePath);
    
    // Verify Cloudinary configuration again before upload
    console.log("Cloudinary upload using configuration:",
                cloudinary.config().cloud_name,
                cloudinary.config().api_key,
                cloudinary.config().api_secret ? "[SECRET SET]" : "[SECRET MISSING]");
    
    try {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.error(`❌ File doesn't exist at path: ${filePath}`);
            throw new Error(`File doesn't exist: ${filePath}`);
        }
        
        // Get file info
        const stats = fs.statSync(filePath);
        console.log(`File size: ${stats.size} bytes`);
        
        if (stats.size === 0) {
            console.error("❌ File is empty (0 bytes)");
            throw new Error("File is empty and cannot be uploaded");
        }
        
        if (!stats.isFile()) {
            console.error("❌ Path exists but is not a file");
            throw new Error("Path exists but is not a file");
        }
        
        // Try both direct file upload and data URI approach
        try {
            console.log("Attempting direct file upload approach");
            
            // Simple upload options with debugging
            const uploadOptions = {
                folder: "fitnessApp",
                resource_type: "auto", // auto-detect file type
                timeout: 120000,       // 2 minute timeout
                use_filename: true,
                unique_filename: true
            };
            
            console.log("Upload options:", JSON.stringify(uploadOptions));
            
            // Log file details
            const fileExt = path.extname(filePath).toLowerCase();
            console.log("File extension:", fileExt);
            
            // Upload to Cloudinary directly using path
            console.log("Starting direct file upload to Cloudinary...");
            const result = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload(filePath, uploadOptions, (error, result) => {
                    if (error) {
                        console.error("❌ Direct Cloudinary upload failed:", error);
                        reject(error);
                    } else {
                        console.log("✅ Direct Cloudinary upload successful");
                        resolve(result);
                    }
                });
            });
            
            console.log("Upload complete - secure_url:", result.secure_url);
            return {
                url: result.secure_url,
                public_id: result.public_id,
                version: result.version,
                format: result.format
            };
            
        } catch (directUploadError) {
            console.error("Direct file upload failed, trying with data URI approach instead");
            console.error("Error was:", directUploadError.message);
            
            // Read file as data URI approach (fallback)
            console.log("Reading file as buffer for data URI approach");
            const fileBuffer = fs.readFileSync(filePath);
            console.log("File buffer size:", fileBuffer.length, "bytes");
            
            const fileExt = path.extname(filePath).toLowerCase();
            const mimeType = fileExt === '.png' ? 'image/png' : 
                            fileExt === '.gif' ? 'image/gif' : 
                            'image/jpeg';
            
            console.log("Using mime type:", mimeType);
            
            const base64Data = fileBuffer.toString('base64');
            const dataUri = `data:${mimeType};base64,${base64Data}`;
            
            console.log(`Created data URI (length: ${dataUri.length} characters)`);
            
            // Upload options for data URI approach
            const dataUriOptions = {
                folder: "fitnessApp", 
                resource_type: "image",
                timeout: 120000
            };
            
            // Upload to Cloudinary using data URI
            console.log("Starting data URI upload to Cloudinary...");
            const dataUriResult = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload(dataUri, dataUriOptions, (error, result) => {
                    if (error) {
                        console.error("❌ Data URI Cloudinary upload error:", error);
                        reject(error);
                    } else {
                        console.log("✅ Data URI Cloudinary upload successful");
                        resolve(result);
                    }
                });
            });
            
            console.log("Data URI upload complete - secure_url:", dataUriResult.secure_url);
            return {
                url: dataUriResult.secure_url,
                public_id: dataUriResult.public_id,
                version: dataUriResult.version,
                format: dataUriResult.format
            };
        }
    } catch (error) {
        console.error("❌ CLOUDINARY ERROR:", error);
        
        // Log detailed error information
        if (error.http_code) {
            console.error(`HTTP error ${error.http_code}: ${error.message}`);
        }
        
        // Log the full error details
        const errorDetails = {
            message: error.message,
            name: error.name,
            stack: error.stack,
            ...(error.error && { innerError: error.error }),
            ...(error.response && { response: error.response })
        };
        console.error("Full error details:", JSON.stringify(errorDetails, null, 2));
        
        throw new Error(`Cloudinary upload failed: ${error.message}`);
    } finally {
        // Always clean up the temporary file
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`✅ Temporary file deleted: ${filePath}`);
            }
        } catch (cleanupError) {
            console.error(`Failed to delete temporary file: ${filePath}`, cleanupError);
        }
    }
};

module.exports = {
    uploadToCloudinary
};
