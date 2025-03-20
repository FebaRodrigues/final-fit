// simpleServer.js - A simplified server for testing
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Parse JSON body
app.use(express.json());

// Configure CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Mock goals endpoint
app.get('/api/goals/user/:userId', (req, res) => {
  const { userId } = req.params;
  console.log(`Received request for goals for user ${userId}`);
  
  // Return mock goals data
  res.status(200).json({
    goals: [
      {
        _id: '1',
        userId,
        goalType: 'weight loss',
        currentValue: 80,
        targetValue: 75,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        frequency: 'weekly',
        notes: '',
        progress: 25,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: '2',
        userId,
        goalType: 'weight gain',
        currentValue: 70,
        targetValue: 75,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        frequency: 'weekly',
        notes: '',
        progress: 50,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  });
});

// Mock goal stats endpoint
app.get('/api/goals/stats/:userId', (req, res) => {
  const { userId } = req.params;
  console.log(`Received request for goal stats for user ${userId}`);
  
  // Return mock stats data
  res.status(200).json({
    totalGoals: 6,
    byStatus: {
      active: 4,
      completed: 2,
      failed: 0
    },
    byType: {
      weightLoss: 1,
      weightGain: 1,
      exercise: 1,
      calorieIntake: 1,
      stepCount: 1,
      gymWorkouts: 1
    },
    avgProgress: 35,
    completionRate: 28.57
  });
});

// Start the server
const PORT = process.env.PORT || 5051;
app.listen(PORT, () => {
  console.log(`Simple test server running on port ${PORT}`);
  console.log(`Try accessing: http://localhost:${PORT}/api/health`);
}); 