// scripts/createTestTrainer.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Trainer = require('../models/Trainer');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Check if test trainer already exists
      const existingTrainer = await Trainer.findOne({ email: 'trainer@test.com' });
      
      if (existingTrainer) {
        console.log('Test trainer already exists. Updating to approved status.');
        existingTrainer.approved = true;
        await existingTrainer.save();
        console.log('Test trainer updated:', existingTrainer);
      } else {
        // Create a new test trainer
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        const newTrainer = new Trainer({
          name: 'Test Trainer',
          email: 'trainer@test.com',
          password: hashedPassword,
          specialties: ['Weight Loss', 'Strength Training', 'Yoga'],
          approved: true,
          bio: 'Experienced trainer with 5+ years of experience in fitness coaching.',
          phone: '555-123-4567',
          availability: [
            { day: 'Monday', startTime: '09:00', endTime: '17:00' },
            { day: 'Wednesday', startTime: '09:00', endTime: '17:00' },
            { day: 'Friday', startTime: '09:00', endTime: '17:00' }
          ],
          experience: [
            {
              position: 'Senior Fitness Trainer',
              organization: 'FitLife Gym',
              startYear: '2018',
              endYear: 'Present',
              description: 'Personal training and group fitness classes'
            }
          ]
        });
        
        await newTrainer.save();
        console.log('Test trainer created successfully:', newTrainer);
      }
      
      // List all trainers
      const allTrainers = await Trainer.find();
      console.log(`Total trainers in database: ${allTrainers.length}`);
      console.log('All trainers:', allTrainers.map(t => ({ 
        id: t._id, 
        name: t.name, 
        email: t.email, 
        approved: t.approved 
      })));
      
    } catch (error) {
      console.error('Error creating test trainer:', error);
    } finally {
      mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  }); 