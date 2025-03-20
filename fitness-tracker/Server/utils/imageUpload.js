const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Upload image to Cloudinary
const uploadToCloudinary = async (filePath) => {
  try {
    console.log('Uploading to Cloudinary:', filePath);
    
    // Verify file exists
    if (!fs.existsSync(filePath)) {
      console.error("File does not exist at path:", filePath);
      return null;
    }
    
    // Configure Cloudinary using environment variables
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    
    // Log configuration for debugging
    console.log('Cloudinary Configuration:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key_set: process.env.CLOUDINARY_API_KEY ? true : false,
      api_secret_set: process.env.CLOUDINARY_API_SECRET ? true : false
    });
    
    // Upload directly with cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "fitnessApp",
      use_filename: true,
      unique_filename: true,
      resource_type: "auto"
    });
    
    console.log("Cloudinary upload result:", result);
    
    if (result && result.secure_url) {
      // Clean up the local file
      try {
        fs.unlinkSync(filePath);
        console.log("Temporary file removed:", filePath);
      } catch (unlinkError) {
        console.error("Error removing temporary file:", unlinkError);
      }
      
      return result;
    } else {
      console.error('Cloudinary upload failed - no secure URL returned');
      return null;
    }
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return null;
  }
};

module.exports = { uploadToCloudinary }; 