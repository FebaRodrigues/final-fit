require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// Default Cloudinary image URL
const DEFAULT_PROFILE_IMAGE = "https://res.cloudinary.com/daacjyk3d/image/upload/v1740376690/fitnessApp/gfo0vamcfcurte2gc4jk.jpg";

// Hardcoded MongoDB URI
const MONGO_URI = 'mongodb+srv://febarodrigues88:nhPqFzat4hq2crm1@cluster0.mvvdq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function fixUserImages() {
  try {
    console.log('Starting to fix user profile images...');
    
    // Find all users with local image paths
    const users = await User.find({
      image: { $regex: '^/uploads/' }
    });
    
    console.log(`Found ${users.length} users with local image paths`);
    
    // Update each user with the default Cloudinary image
    for (const user of users) {
      console.log(`Updating user ${user._id} (${user.name}) - Current image: ${user.image}`);
      
      user.image = DEFAULT_PROFILE_IMAGE;
      await user.save();
      
      console.log(`Updated user ${user._id} to use default Cloudinary image`);
    }
    
    console.log('All user profile images fixed successfully');
    
    // Close the connection
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error fixing user images:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
fixUserImages(); 