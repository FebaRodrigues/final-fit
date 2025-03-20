// createTestGoal.js
require('dotenv').config();
const mongoose = require('mongoose');
const Goal = require('./models/Goal');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const createTestGoal = async () => {
  try {
    // Find a user to assign the goal to
    const user = await User.findOne({ role: 'user' });
    
    if (!user) {
      console.error('No user found in the database');
      process.exit(1);
    }
    
    console.log(`Found user: ${user.name} (${user._id})`);
    
    // Create a test goal
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    
    const testGoal = new Goal({
      userId: user._id,
      goalType: 'weight loss',
      currentValue: 80,
      targetValue: 75,
      deadline: nextMonth,
      frequency: 'weekly',
      notes: '',
      progress: 25, // 25% progress
      status: 'active',
      milestones: [
        {
          title: 'First milestone',
          targetValue: 78,
          notes: '',
          completed: false
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await testGoal.save();
    console.log('Test goal created successfully:', testGoal);
    
    // Create a completed goal
    const completedGoal = new Goal({
      userId: user._id,
      goalType: 'weight gain',
      currentValue: 70,
      targetValue: 75,
      deadline: nextMonth,
      frequency: 'weekly',
      notes: '',
      progress: 100, // 100% progress
      status: 'completed',
      milestones: [
        {
          title: 'First milestone',
          targetValue: 72,
          notes: '',
          completed: true,
          completedAt: new Date()
        }
      ],
      createdAt: new Date(today.setDate(today.getDate() - 30)), // Created 30 days ago
      updatedAt: new Date()
    });
    
    await completedGoal.save();
    console.log('Completed test goal created successfully:', completedGoal);
    
    // Create goals for other types
    const goalTypes = ['exercise', 'calorie intake', 'step count', 'gym workouts'];
    
    for (const type of goalTypes) {
      const goal = new Goal({
        userId: user._id,
        goalType: type,
        currentValue: 50,
        targetValue: 100,
        deadline: nextMonth,
        frequency: 'weekly',
        notes: '',
        progress: Math.floor(Math.random() * 100), // Random progress
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await goal.save();
      console.log(`${type} test goal created successfully:`, goal);
    }
    
    console.log('All test goals created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating test goals:', error);
    process.exit(1);
  }
};

createTestGoal(); 