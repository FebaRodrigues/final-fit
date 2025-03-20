// scripts/approveTrainer.js
require('dotenv').config();
const mongoose = require('mongoose');
const Trainer = require('../models/Trainer');

// Get the email from command line arguments
const trainerEmail = process.argv[2];

if (!trainerEmail) {
  console.error('Please provide a trainer email as an argument');
  console.log('Usage: node approveTrainer.js <trainer_email>');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Find the trainer by email
      const trainer = await Trainer.findOne({ email: trainerEmail });
      
      if (!trainer) {
        console.error(`No trainer found with email: ${trainerEmail}`);
        process.exit(1);
      }
      
      // Update the trainer's approved status
      trainer.approved = true;
      await trainer.save();
      
      console.log(`Trainer ${trainer.name} (${trainer.email}) has been approved successfully.`);
      
      // List all trainers and their approval status
      const allTrainers = await Trainer.find().select('name email approved');
      console.log('\nAll trainers:');
      allTrainers.forEach(t => {
        console.log(`- ${t.name} (${t.email}): ${t.approved ? 'Approved' : 'Not Approved'}`);
      });
      
    } catch (error) {
      console.error('Error approving trainer:', error);
    } finally {
      mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  }); 