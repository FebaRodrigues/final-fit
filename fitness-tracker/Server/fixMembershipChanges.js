// fixMembershipChanges.js
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

async function fixMembershipChanges() {
  try {
    console.log(`Fixing membership changes for user ${userId}`);
    
    // Find all memberships for the user
    const memberships = await Membership.find({ userId }).sort({ createdAt: -1 });
    console.log(`Found ${memberships.length} memberships`);
    
    // Find all payments for the user
    const payments = await Payment.find({ userId, status: 'Completed' }).sort({ paymentDate: -1 });
    console.log(`Found ${payments.length} completed payments`);
    
    if (payments.length === 0) {
      console.log('No completed payments found');
      await mongoose.disconnect();
      return;
    }
    
    // Get the most recent payment
    const latestPayment = payments[0];
    console.log('Latest payment:', latestPayment);
    
    // Find the membership associated with the latest payment
    const targetMembershipId = latestPayment.membershipId ? latestPayment.membershipId.toString() : null;
    
    if (!targetMembershipId) {
      console.log('Latest payment has no associated membership');
      await mongoose.disconnect();
      return;
    }
    
    console.log('Target membership ID:', targetMembershipId);
    
    // Set all active memberships to expired
    const expiredCount = await Membership.updateMany(
      { userId, status: 'Active' },
      { status: 'Expired' }
    );
    
    console.log(`Set ${expiredCount.modifiedCount} active memberships to expired`);
    
    // Activate the target membership
    const updatedMembership = await Membership.findByIdAndUpdate(
      targetMembershipId,
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
      console.log('Failed to activate membership');
    }
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    
  } catch (error) {
    console.error('Error fixing membership changes:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the function
fixMembershipChanges(); 