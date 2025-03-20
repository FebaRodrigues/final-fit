// models/Payment.js
const mongoose = require('mongoose');

// Drop any existing indexes on the payments collection before defining the schema
const dropIndexes = async () => {
  try {
    if (mongoose.connection.readyState === 1) { // Connected
      const collections = await mongoose.connection.db.listCollections({ name: 'payments' }).toArray();
      if (collections.length > 0) {
        console.log('Dropping problematic index on payments collection...');
        try {
          await mongoose.connection.db.collection('payments').dropIndex('transactionId_1');
          console.log('Successfully dropped index transactionId_1');
        } catch (indexError) {
          console.log('Index transactionId_1 does not exist, no need to drop');
        }
        
        // Also drop the stripeSessionId index if it exists
        try {
          await mongoose.connection.db.collection('payments').dropIndex('stripeSessionId_1');
          console.log('Successfully dropped index stripeSessionId_1');
        } catch (indexError) {
          console.log('Index stripeSessionId_1 does not exist, no need to drop');
        }
      }
    }
  } catch (error) {
    console.warn('Warning: Failed to drop indexes:', error.message);
  }
};

// Try to drop indexes immediately if connected
dropIndexes();

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer', default: null },
  membershipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Membership', default: null },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'SpaBooking', default: null },
  amount: { type: Number, required: true },
  type: { 
    type: String, 
    enum: ['Membership', 'TrainerSession', 'SpaService'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Completed', 'Failed'], 
    default: 'Pending'
  },
  planType: {
    type: String,
    enum: ['Basic', 'Premium', 'Elite'],
    default: null
  },
  description: { type: String, default: null },
  paymentDate: { type: Date, default: Date.now },
  transactionId: { type: String, default: null, index: false },
  stripeSessionId: { type: String, default: null },
}, { timestamps: true });

// Explicitly create a non-unique index for transactionId
paymentSchema.index({ transactionId: 1 }, { unique: false });

// Create a unique index for stripeSessionId but only for non-null values
paymentSchema.index({ stripeSessionId: 1 }, { unique: true, sparse: true, partialFilterExpression: { stripeSessionId: { $type: "string" } } });

// Ensure the model is only compiled once
let Payment;
try {
  Payment = mongoose.model('Payment');
} catch (error) {
  Payment = mongoose.model('Payment', paymentSchema);
}

module.exports = Payment;