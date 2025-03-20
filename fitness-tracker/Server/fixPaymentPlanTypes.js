// fixPaymentPlanTypes.js
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

async function fixPaymentPlanTypes() {
  try {
    console.log('Starting to fix payment plan types...');
    
    // Find all payments without planType
    const payments = await Payment.find({ planType: null });
    console.log(`Found ${payments.length} payments without planType`);
    
    let updatedCount = 0;
    
    for (const payment of payments) {
      if (payment.membershipId) {
        try {
          // Find the associated membership
          const membership = await Membership.findById(payment.membershipId);
          
          if (membership) {
            // Update the payment with the membership's planType
            await Payment.findByIdAndUpdate(payment._id, {
              planType: membership.planType
            });
            
            updatedCount++;
            console.log(`Updated payment ${payment._id} with planType ${membership.planType}`);
          } else {
            console.log(`Membership not found for payment ${payment._id}`);
          }
        } catch (err) {
          console.error(`Error updating payment ${payment._id}:`, err);
        }
      }
    }
    
    console.log(`Updated ${updatedCount} payments with planType`);
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    
  } catch (error) {
    console.error('Error fixing payment plan types:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the function
fixPaymentPlanTypes(); 