// routes/progressReports.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const ProgressReport = require('../models/ProgressReport');
const User = require('../models/User');
const Workout = require('../models/Workout');
const Goal = require('../models/Goal');

// Create a new progress report
router.post('/', auth(['trainer', 'admin']), async (req, res) => {
  try {
    const { 
      trainerId, 
      clientId, 
      period, 
      notes, 
      recommendations, 
      progressData, 
      metrics 
    } = req.body;
    
    // Validate required fields
    if (!trainerId || !clientId) {
      return res.status(400).json({ message: 'Trainer ID and Client ID are required' });
    }
    
    // Create the progress report
    const newReport = new ProgressReport({
      trainerId,
      clientId,
      period,
      notes,
      recommendations,
      progressData,
      metrics
    });
    
    const savedReport = await newReport.save();
    res.status(201).json(savedReport);
  } catch (error) {
    console.error('Error creating progress report:', error);
    res.status(500).json({ message: 'Failed to create progress report', error: error.message });
  }
});

// Get all progress reports for a client
router.get('/client/:clientId', auth(['user', 'trainer', 'admin']), async (req, res) => {
  try {
    const { clientId } = req.params;
    
    // Find all reports for this client
    const reports = await ProgressReport.find({ clientId })
      .sort({ createdAt: -1 }) // Newest first
      .populate('trainerId', 'name email');
    
    res.status(200).json(reports);
  } catch (error) {
    console.error('Error fetching progress reports:', error);
    res.status(500).json({ message: 'Failed to fetch progress reports', error: error.message });
  }
});

// Get a specific progress report by ID
router.get('/:reportId', auth(['user', 'trainer', 'admin']), async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const report = await ProgressReport.findById(reportId)
      .populate('trainerId', 'name email')
      .populate('clientId', 'name email');
    
    if (!report) {
      return res.status(404).json({ message: 'Progress report not found' });
    }
    
    res.status(200).json(report);
  } catch (error) {
    console.error('Error fetching progress report:', error);
    res.status(500).json({ message: 'Failed to fetch progress report', error: error.message });
  }
});

// Get all progress reports created by a trainer
router.get('/trainer/:trainerId', auth(['trainer', 'admin']), async (req, res) => {
  try {
    const { trainerId } = req.params;
    
    const reports = await ProgressReport.find({ trainerId })
      .sort({ createdAt: -1 }) // Newest first
      .populate('clientId', 'name email');
    
    res.status(200).json(reports);
  } catch (error) {
    console.error('Error fetching trainer progress reports:', error);
    res.status(500).json({ message: 'Failed to fetch trainer progress reports', error: error.message });
  }
});

module.exports = router; 