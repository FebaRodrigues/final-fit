// fixMemberships.js
require('dotenv').config();
const mongoose = require('mongoose');
const Membership = require('./models/Membership');
const Payment = require('./models/Payment');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// User ID to fix memberships for
const userId = '67c890ad38dba7980a70d5af'; // Replace with your user ID

async function fixMemberships() {
  try {
    console.log(`Fixing memberships for user ${userId}`);
    
    // Find all memberships for the user
    const memberships = await Membership.find({ userId });
    console.log(`Found ${memberships.length} memberships`);
    
    // Find all completed payments for the user
    const payments = await Payment.find({ userId, status: 'Completed' });
    console.log(`Found ${payments.length} completed payments`);
    
    // Get membership IDs with completed payments
    const membershipIdsWithPayments = payments.map(payment => 
      payment.membershipId ? payment.membershipId.toString() : null
    ).filter(id => id !== null);
    
    console.log('Membership IDs with payments:', membershipIdsWithPayments);
    
    // Set all active memberships to expired
    const expiredCount = await Membership.updateMany(
      { userId, status: 'Active' },
      { status: 'Expired' }
    );
    
    console.log(`Set ${expiredCount.modifiedCount} active memberships to expired`);
    
    // Find the most recent membership with a completed payment
    let latestMembership = null;
    let latestDate = new Date(0);
    
    for (const membership of memberships) {
      const membershipId = membership._id.toString();
      const hasPayment = membershipIdsWithPayments.includes(membershipId);
      
      if (hasPayment) {
        const createdAt = new Date(membership.createdAt);
        if (createdAt > latestDate) {
          latestDate = createdAt;
          latestMembership = membership;
        }
      }
    }
    
    if (latestMembership) {
      // Activate the most recent membership with a completed payment
      const updatedMembership = await Membership.findByIdAndUpdate(
        latestMembership._id,
        { 
          status: 'Active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        },
        { new: true }
      );
      
      console.log('Activated membership:', updatedMembership);
    } else {
      console.log('No membership found with a completed payment');
    }
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    
  } catch (error) {
    console.error('Error fixing memberships:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the function
fixMemberships(); 