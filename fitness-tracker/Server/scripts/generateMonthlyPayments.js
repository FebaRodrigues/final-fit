// scripts/generateMonthlyPayments.js
require('dotenv').config();
const mongoose = require('mongoose');
const Trainer = require('../models/Trainer');
const TrainerPayment = require('../models/TrainerPayment');

// Get the month and year from command line arguments or use current month
const args = process.argv.slice(2);
const now = new Date();
const month = parseInt(args[0]) || now.getMonth() + 1; // 1-12
const year = parseInt(args[1]) || now.getFullYear();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Get all approved trainers
      const trainers = await Trainer.find({ approved: true });
      
      if (trainers.length === 0) {
        console.log('No approved trainers found');
        process.exit(0);
      }
      
      console.log(`Found ${trainers.length} approved trainers`);
      
      const paymentDate = new Date(year, month - 1, 1); // First day of the month
      const monthName = paymentDate.toLocaleString('default', { month: 'long' });
      let paymentsCreated = 0;
      
      // Create a payment for each trainer
      for (const trainer of trainers) {
        // Skip trainers who don't have an approved salary
        if (!trainer.approvedSalary) {
          console.log(`Skipping ${trainer.name} - No approved salary`);
          continue;
        }
        
        // Check if payment already exists for this month
        const existingPayment = await TrainerPayment.findOne({
          trainerId: trainer._id,
          'paymentPeriod.month': month,
          'paymentPeriod.year': year
        });
        
        if (existingPayment) {
          console.log(`Payment already exists for ${trainer.name} for ${monthName} ${year}`);
          continue;
        }
        
        const payment = new TrainerPayment({
          trainerId: trainer._id,
          amount: trainer.approvedSalary,
          paymentDate,
          status: 'completed',
          description: `Salary payment for ${monthName} ${year}`,
          paymentPeriod: {
            month,
            year
          }
        });
        
        await payment.save();
        paymentsCreated++;
        console.log(`Created payment for ${trainer.name}: $${trainer.approvedSalary}`);
      }
      
      console.log(`\nGenerated ${paymentsCreated} payments for ${monthName} ${year}`);
      
    } catch (error) {
      console.error('Error generating payments:', error);
    } finally {
      mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  }); 