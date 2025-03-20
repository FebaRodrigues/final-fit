// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateAdmin } = require('../middleware/auth');

// Authentication routes (no auth middleware needed)
router.post('/register', adminController.registerAdmin);
router.post('/login', adminController.loginAdmin);

// Protected routes (require admin authentication)
// Admin profile
router.get('/profile', authenticateAdmin, adminController.getAdminProfile);
router.put('/profile', authenticateAdmin, adminController.updateAdminProfile);

// User management
router.get('/users', authenticateAdmin, adminController.manageUsers);
router.get('/users/:userId', authenticateAdmin, adminController.getUserById);
router.put('/users/:userId', authenticateAdmin, adminController.updateUser);
router.delete('/users/:userId', authenticateAdmin, adminController.deleteUser);
router.get('/users/:userId/activity', authenticateAdmin, adminController.getUserActivity);
router.post('/user-activity', authenticateAdmin, adminController.createUserActivity);

// Trainer management
router.get('/trainers', authenticateAdmin, adminController.getAllTrainersForAdmin);
router.get('/trainers/:trainerId', authenticateAdmin, adminController.getTrainerByIdForAdmin);
router.put('/trainers/:trainerId', authenticateAdmin, adminController.updateTrainer);
router.delete('/trainers/:trainerId', authenticateAdmin, adminController.deleteTrainer);
router.post('/trainers/approve', authenticateAdmin, adminController.approveTrainer);
router.get('/trainers/:trainerId/activity', authenticateAdmin, adminController.getTrainerActivity);

// Content management
router.get('/workout-programs', authenticateAdmin, adminController.getAllWorkoutPrograms);
router.get('/nutrition-plans', authenticateAdmin, adminController.getAllNutritionPlans);

// Subscription and payment management
router.get('/memberships', authenticateAdmin, adminController.getAllMemberships);
router.get('/memberships/user/:userId', authenticateAdmin, adminController.getUserMemberships);
router.get('/payments', authenticateAdmin, adminController.getAllPayments);

// Analytics and reporting
router.get('/analytics', authenticateAdmin, adminController.getAnalytics);
router.get('/progress-reports', authenticateAdmin, adminController.getUserProgressReports);
router.post('/generate-report', authenticateAdmin, adminController.generateReport);

module.exports = router; 