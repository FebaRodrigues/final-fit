// routes/adminRoutes2.js
const express = require('express');
const adminController = require('../controllers/adminController');
const { auth } = require('../middleware/auth');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/register', adminController.registerAdmin );
router.post('/login', adminController.loginAdmin);
router.post('/refresh-token', adminController.refreshAdminToken);
router.get('/users', auth(['admin']), adminController.manageUsers); // Only admin can manage users
router.post('/approve-trainer', auth(['admin']), adminController.approveTrainer);
router.get('/trainers', auth(['admin']), adminController.getAllTrainersForAdmin);
router.get('/trainers/:trainerId', auth(['admin']), adminController.getTrainerByIdForAdmin);
router.get('/user-activity/:id', auth(['admin']), adminController.getUserActivity);
router.post('/user-activity', auth(['admin']), adminController.createUserActivity);
router.get('/profile', auth(['admin']), adminController.getAdminProfile);
router.put('/profile', auth(['admin']), adminController.updateAdminProfile);

// Public routes
router.post('/send-otp', auth(['admin']), adminController.sendAdminRegistrationOTP);
router.post('/verify-otp', adminController.verifyAdminRegistrationOTP);

// User management
router.get('/users/:userId', auth(['admin']), adminController.getUserById);
router.put('/users/:userId', auth(['admin']), adminController.updateUser);
router.delete('/users/:userId', auth(['admin']), adminController.deleteUser);

// Trainer management
router.put('/trainers/:trainerId', auth(['admin']), adminController.updateTrainer);
router.delete('/trainers/:trainerId', auth(['admin']), adminController.deleteTrainer);

// Content management
router.get('/workout-programs', auth(['admin']), adminController.getAllWorkoutPrograms);
router.get('/nutrition-plans', auth(['admin']), adminController.getAllNutritionPlans);

// Subscription and payment management
router.get('/memberships', auth(['admin']), adminController.getAllMemberships);
router.get('/memberships/user/:userId', auth(['admin']), adminController.getUserMemberships);
router.get('/payments', auth(['admin']), adminController.getAllPayments);

// Analytics and reporting
router.get('/analytics', auth(['admin']), adminController.getAnalytics);
router.get('/progress-reports', auth(['admin']), adminController.getUserProgressReports);
router.post('/generate-report', auth(['admin']), adminController.generateReport);

// Announcements
router.get('/announcements', auth(['admin']), adminController.getAnnouncements);
router.post('/announcements', auth(['admin']), adminController.createAnnouncement);
router.put('/announcements/:id', auth(['admin']), adminController.updateAnnouncement);
router.delete('/announcements/:id', auth(['admin']), adminController.deleteAnnouncement);

// Placeholder for admin routes
router.get('/', auth(['admin']), (req, res) => {
  res.status(200).json({ message: 'Admin route is working' });
});

module.exports = router; 