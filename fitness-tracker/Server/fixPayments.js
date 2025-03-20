// fixPayments.js
require('dotenv').config();
const mongoose = require('mongoose');
const Payment = require('./models/Payment');
const Membership = require('./models/Membership');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// User ID to fix payments for
const userId = '67c890ad38dba7980a70d5af'; // Replace with your user ID

async function fixPayments() {
  try {
    console.log(`Fixing payments for user ${userId}`);
    
    // Find all memberships for the user
    const memberships = await Membership.find({ userId });
    console.log(`Found ${memberships.length} memberships`);
    
    // Find all payments for the user
    const payments = await Payment.find({ userId });
    console.log(`Found ${payments.length} payments`);
    
    // Create payments for memberships that don't have payments
    let createdCount = 0;
    
    for (const membership of memberships) {
      // Check if there's already a payment for this membership
      const existingPayment = payments.find(p => 
        p.membershipId && p.membershipId.toString() === membership._id.toString()
      );
      
      if (!existingPayment && membership.status !== 'Pending') {
        // Create a new payment for this membership
        const newPayment = new Payment({
          userId: membership.userId,
          membershipId: membership._id,
          amount: membership.price,
          type: 'Membership',
          status: 'Completed',
          paymentDate: membership.startDate || membership.createdAt,
          transactionId: `manual-${Date.now()}-${Math.floor(Math.random() * 1000)}`
        });
        
        await newPayment.save();
        createdCount++;
        
        console.log(`Created payment for membership ${membership._id}`);
      }
    }
    
    console.log(`Created ${createdCount} new payments`);
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    
  } catch (error) {
    console.error('Error fixing payments:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the function
fixPayments(); 