// updateGoalNotes.js
require('dotenv').config();
const mongoose = require('mongoose');
const Goal = require('./models/Goal');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const updateGoalNotes = async () => {
  try {
    // Find all goals with "Test goal for debugging" in the notes
    const goalsToUpdate = await Goal.find({ notes: /Test goal for debugging/i });
    console.log(`Found ${goalsToUpdate.length} goals with test notes`);
    
    // Update all goals with "Test goal for debugging" in the notes
    const result = await Goal.updateMany(
      { notes: /Test goal for debugging/i },
      { $set: { notes: '' } }
    );
    
    console.log(`Updated ${result.modifiedCount} goals`);
    
    // Find all goals with non-empty notes
    const goalsWithNotes = await Goal.find({ notes: { $ne: '' } });
    console.log(`Remaining goals with non-empty notes: ${goalsWithNotes.length}`);
    
    if (goalsWithNotes.length > 0) {
      console.log('Sample notes:');
      goalsWithNotes.slice(0, 5).forEach(goal => {
        console.log(`- ${goal.notes}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating goal notes:', error);
    process.exit(1);
  }
};

updateGoalNotes(); 