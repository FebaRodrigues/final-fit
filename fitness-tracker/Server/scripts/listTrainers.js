// scripts/listTrainers.js
require('dotenv').config();
const mongoose = require('mongoose');
const Trainer = require('../models/Trainer');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Get all trainers
      const trainers = await Trainer.find().select('name email approved specialties');
      
      console.log(`\nTotal trainers: ${trainers.length}`);
      console.log('\nApproved trainers:');
      const approvedTrainers = trainers.filter(t => t.approved);
      
      if (approvedTrainers.length === 0) {
        console.log('  No approved trainers found.');
      } else {
        approvedTrainers.forEach(t => {
          console.log(`- ${t.name} (${t.email})`);
          console.log(`  Specialties: ${t.specialties?.join(', ') || 'None'}`);
        });
      }
      
      console.log('\nPending approval:');
      const pendingTrainers = trainers.filter(t => !t.approved);
      
      if (pendingTrainers.length === 0) {
        console.log('  No pending trainers found.');
      } else {
        pendingTrainers.forEach(t => {
          console.log(`- ${t.name} (${t.email})`);
          console.log(`  Specialties: ${t.specialties?.join(', ') || 'None'}`);
        });
      }
      
    } catch (error) {
      console.error('Error listing trainers:', error);
    } finally {
      mongoose.disconnect();
      console.log('\nDisconnected from MongoDB');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  }); 