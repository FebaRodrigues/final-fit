require('dotenv').config();
const mongoose = require('mongoose');
const Payment = require('../models/Payment');

async function fixDatabase() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Drop all indexes on the payments collection
    try {
      console.log('Dropping all indexes on payments collection...');
      await mongoose.connection.db.collection('payments').dropIndexes();
      console.log('Successfully dropped all indexes');
    } catch (indexError) {
      console.error('Error dropping indexes:', indexError);
    }

    // Find and clean up duplicate payments
    console.log('Finding pending payments with null transactionId...');
    const pendingPayments = await Payment.find({ 
      status: 'Pending', 
      transactionId: null 
    }).sort({ createdAt: -1 });

    console.log(`Found ${pendingPayments.length} pending payments with null transactionId`);

    // Group payments by membershipId
    const paymentsByMembership = {};
    pendingPayments.forEach(payment => {
      const membershipId = payment.membershipId ? payment.membershipId.toString() : 'null';
      if (!paymentsByMembership[membershipId]) {
        paymentsByMembership[membershipId] = [];
      }
      paymentsByMembership[membershipId].push(payment);
    });

    // Keep only the most recent payment for each membership
    let deletedCount = 0;
    for (const membershipId in paymentsByMembership) {
      const payments = paymentsByMembership[membershipId];
      if (payments.length > 1) {
        // Sort by createdAt in descending order
        payments.sort((a, b) => b.createdAt - a.createdAt);
        
        // Keep the first one (most recent), delete the rest
        for (let i = 1; i < payments.length; i++) {
          console.log(`Deleting duplicate payment ${payments[i]._id} for membership ${membershipId}`);
          await Payment.findByIdAndDelete(payments[i]._id);
          deletedCount++;
        }
      }
    }

    console.log(`Deleted ${deletedCount} duplicate payments`);

    // Recreate the correct indexes
    console.log('Creating correct indexes...');
    await mongoose.connection.db.collection('payments').createIndex(
      { transactionId: 1 }, 
      { unique: false }
    );
    
    await mongoose.connection.db.collection('payments').createIndex(
      { stripeSessionId: 1 }, 
      { unique: true, sparse: true }
    );
    
    console.log('Successfully created correct indexes');

    console.log('Database fix completed successfully');
  } catch (error) {
    console.error('Error fixing database:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

fixDatabase(); 