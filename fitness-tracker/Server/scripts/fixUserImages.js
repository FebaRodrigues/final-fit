// scripts/fixUserImages.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// Default image URL from Cloudinary
const DEFAULT_IMAGE_URL = 'https://res.cloudinary.com/daacjyk3d/image/upload/v1718193000/fitnessApp/default-profile_wnmjxr.png';

// Hardcoded MongoDB URI
const MONGODB_URI = 'mongodb+srv://fitness:fitness@cluster0.ixm9qzj.mongodb.net/fitness-tracker?retryWrites=true&w=majority';

async function fixUserImages() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected successfully');

    // Find all users with invalid or missing image URLs
    const users = await User.find({
      $or: [
        { image: { $exists: false } },
        { image: null },
        { image: '' },
        { image: { $regex: /^\/uploads\// } } // Local path pattern
      ]
    });

    console.log(`Found ${users.length} users with invalid or missing image URLs`);

    // Update each user with the default image URL
    let updatedCount = 0;
    for (const user of users) {
      console.log(`Updating user ${user.email || user.name} (${user._id})`);
      console.log(`  Old image: ${user.image || 'none'}`);
      
      user.image = DEFAULT_IMAGE_URL;
      await user.save();
      
      console.log(`  New image: ${user.image}`);
      updatedCount++;
    }

    console.log(`Successfully updated ${updatedCount} users with default image URL`);
  } catch (error) {
    console.error('Error fixing user images:', error);
  } finally {
    // Close the MongoDB connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Run the function
fixUserImages(); 