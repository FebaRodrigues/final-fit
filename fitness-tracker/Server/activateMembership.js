// activateMembership.js
require('dotenv').config();
const mongoose = require('mongoose');
const Membership = require('./models/Membership');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// User ID and Membership ID to activate
const userId = '67c890ad38dba7980a70d5af'; // Replace with your user ID
const membershipId = '67cbfd904630be9e6d217d70'; // Replace with the membership ID you want to activate

async function activateMembership() {
  try {
    console.log(`Activating membership ${membershipId} for user ${userId}`);
    
    // Set all active memberships to expired
    const expiredCount = await Membership.updateMany(
      { userId, status: 'Active' },
      { status: 'Expired' }
    );
    
    console.log(`Set ${expiredCount.modifiedCount} active memberships to expired`);
    
    // Activate the specified membership
    const updatedMembership = await Membership.findByIdAndUpdate(
      membershipId,
      { 
        status: 'Active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      },
      { new: true }
    );
    
    if (updatedMembership) {
      console.log('Activated membership:', updatedMembership);
    } else {
      console.log('Membership not found');
    }
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    
  } catch (error) {
    console.error('Error activating membership:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the function
activateMembership(); 