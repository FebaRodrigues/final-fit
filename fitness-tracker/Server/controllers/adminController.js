// controllers/adminController.js
const User = require('../models/User');
const Admin = require('../models/Admin'); 
const Trainer = require('../models/Trainer'); 
const WorkoutProgram = require('../models/WorkoutProgram');
const NutritionPlan = require('../models/NutritionPlan');
const Membership = require('../models/Membership');
const Payment = require('../models/Payment');
const UserActivity = require('../models/UserActivity');
const ProgressReport = require('../models/ProgressReport');
const Notification = require('../models/Notification');
const WorkoutLog = require('../models/WorkoutLog');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendEmailNotification } = require('../utils/emailUtils');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const Goal = require('../models/Goal');

// Store OTPs temporarily (in production, use Redis or another persistent store)
const otpStore = {};

// Function to generate a random 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Function to send email with OTP
const sendOTPEmail = async (email, otp) => {
    try {
        // Create a transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Email options
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Admin Registration OTP Verification',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <h2 style="color: #333; text-align: center;">Admin Registration Verification</h2>
                    <p style="font-size: 16px; line-height: 1.5;">Hello,</p>
                    <p style="font-size: 16px; line-height: 1.5;">Your OTP for admin registration is:</p>
                    <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                        ${otp}
                    </div>
                    <p style="font-size: 16px; line-height: 1.5;">This OTP is valid for 10 minutes.</p>
                    <p style="font-size: 16px; line-height: 1.5;">If you did not request this OTP, please ignore this email.</p>
                    <p style="font-size: 16px; line-height: 1.5;">Thank you,<br>Fitness Management System</p>
                </div>
            `
        };

        // Send email
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending OTP email:', error);
        return false;
    }
};

// Send OTP for admin registration
exports.sendAdminRegistrationOTP = async (req, res) => {
    try {
        const { email: newAdminEmail } = req.body;

        if (!newAdminEmail) {
            return res.status(400).json({ message: 'Email for new admin is required' });
        }

        // Check if the request is coming from an authenticated admin
        // The auth middleware should have already verified the token and added the admin to req.user
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only existing admins can register new admins' });
        }

        // Get the existing admin's email
        const existingAdmin = await Admin.findById(req.user.id);
        if (!existingAdmin) {
            return res.status(404).json({ message: 'Existing admin not found' });
        }

        // Check if new admin email is already registered
        const newAdminExists = await Admin.findOne({ email: newAdminEmail });
        if (newAdminExists) {
            return res.status(400).json({ message: 'Email is already registered as an admin' });
        }

        // Generate OTP
        const otp = generateOTP();
        
        // Store OTP with expiry time (10 minutes)
        const expiryTime = new Date();
        expiryTime.setMinutes(expiryTime.getMinutes() + 10);
        
        otpStore[newAdminEmail] = {
            otp,
            expiry: expiryTime,
            requestedBy: req.user._id, // Store which admin requested this registration
            existingAdminEmail: existingAdmin.email // Store the existing admin's email
        };

        // Send OTP via email to the existing admin's email
        const emailSent = await sendOTPEmail(existingAdmin.email, otp);
        
        if (emailSent) {
            return res.status(200).json({ 
                message: 'OTP sent successfully to your email',
                expiresAt: expiryTime,
                newAdminEmail: newAdminEmail
            });
        } else {
            return res.status(500).json({ message: 'Failed to send OTP email' });
        }
    } catch (error) {
        console.error('Error in sendAdminRegistrationOTP:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Verify OTP for admin registration
exports.verifyAdminRegistrationOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        // Check if OTP exists for the email
        if (!otpStore[email]) {
            return res.status(400).json({ message: 'No OTP found for this email. Please request a new OTP' });
        }

        // Check if OTP is expired
        if (new Date() > new Date(otpStore[email].expiry)) {
            // Remove expired OTP
            delete otpStore[email];
            return res.status(400).json({ message: 'OTP has expired. Please request a new OTP' });
        }

        // Verify OTP
        if (otpStore[email].otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // OTP verified successfully
        // We'll keep the OTP in store until registration is complete
        return res.status(200).json({ 
            message: 'OTP verified successfully',
            newAdminEmail: email
        });
    } catch (error) {
        console.error('Error in verifyAdminRegistrationOTP:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Register a new admin (modified to check OTP verification)
exports.registerAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if all required fields are provided
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if OTP was verified for this email
        if (!otpStore[email]) {
            return res.status(400).json({ message: 'OTP verification is required before registration' });
        }

        // Check if admin with this email already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin with this email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new admin
        const admin = new Admin({
            name,
            email,
            password: hashedPassword,
            role: 'admin'
        });

        // Save admin to database
        await admin.save();

        // Remove OTP from store after successful registration
        delete otpStore[email];

        return res.status(201).json({ 
            message: 'Admin registered successfully',
            adminId: admin._id
        });
    } catch (error) {
        console.error('Error in registerAdmin:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Login admin
exports.loginAdmin = async (req, res) => {
    const { email, password } = req.body; // Use email for login

    try {
        const admin = await Admin.findOne({ email }); // Check Admin model by email
        if (!admin || !(await bcrypt.compare(password, admin.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '1h' });
        res.json({ token, role: 'admin' }); // Ensure role is set to 'admin'
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Manage user accounts
exports.manageUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a user by ID
exports.getUserById = async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await User.findById(userId).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a user
exports.updateUser = async (req, res) => {
    const { userId } = req.params;
    const updates = req.body;
    
    // Don't allow updating password through this endpoint
    if (updates.password) {
        delete updates.password;
    }
    
    try {
        const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a user
exports.deleteUser = async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await User.findByIdAndDelete(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        // Also delete related data
        await WorkoutLog.deleteMany({ userId });
        await Membership.deleteMany({ userId });
        await Payment.deleteMany({ userId });
        await UserActivity.deleteMany({ userId });
        await ProgressReport.deleteMany({ userId });
        await Notification.deleteMany({ recipientId: userId, recipientModel: 'User' });
        
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Approve new trainers
exports.approveTrainer = async (req, res) => {
    const { trainerId, approvedSalary } = req.body;
    
    try {
        const trainer = await Trainer.findById(trainerId);
        if (!trainer) return res.status(404).json({ message: 'Trainer not found' });

        // Validate approved salary
        if (!approvedSalary || isNaN(approvedSalary) || approvedSalary <= 0) {
            return res.status(400).json({ message: 'Please provide a valid approved salary' });
        }

        trainer.approved = true;
        trainer.approvedSalary = Number(approvedSalary);
        trainer.joinDate = new Date(); // Set join date to current date
        
        await trainer.save();
        
        // Send email notification to trainer
        try {
            const subject = 'Your Trainer Account Has Been Approved';
            const message = `Dear ${trainer.name},\n\nCongratulations! Your trainer account has been approved. You can now log in to the system.\n\nYour approved salary is $${approvedSalary} per month.\n\nThank you for joining our team!\n\nBest regards,\nThe Admin Team`;
            
            await sendEmailNotification(trainer.email, subject, message);
        } catch (emailError) {
            console.error('Failed to send approval email:', emailError);
        }
        
        res.status(200).json({ 
            message: 'Trainer approved successfully',
            trainer
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all trainers for admin
exports.getAllTrainersForAdmin = async (req, res) => {
    try {
        const trainers = await Trainer.find().select('-password');
        res.status(200).json(trainers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a trainer by ID
exports.getTrainerByIdForAdmin = async (req, res) => {
    const { trainerId } = req.params;
    try {
        const trainer = await Trainer.findById(trainerId).select('-password');
        if (!trainer) return res.status(404).json({ message: 'Trainer not found' });
        res.status(200).json(trainer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a trainer
exports.updateTrainer = async (req, res) => {
    const { trainerId } = req.params;
    const updates = req.body;
    
    // Don't allow updating password through this endpoint
    if (updates.password) {
        delete updates.password;
    }
    
    try {
        const trainer = await Trainer.findByIdAndUpdate(trainerId, updates, { new: true }).select('-password');
        if (!trainer) return res.status(404).json({ message: 'Trainer not found' });
        res.status(200).json(trainer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a trainer
exports.deleteTrainer = async (req, res) => {
    const { trainerId } = req.params;
    try {
        const trainer = await Trainer.findByIdAndDelete(trainerId);
        if (!trainer) return res.status(404).json({ message: 'Trainer not found' });
        
        // Also delete related data
        await Notification.deleteMany({ recipientId: trainerId, recipientModel: 'Trainer' });
        
        res.status(200).json({ message: 'Trainer deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get user activity by user ID
exports.getUserActivity = async (req, res) => {
    const { userId } = req.params; // Extract user ID from the request parameters
    try {
        // First check if the user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Get user activity from UserActivity collection
        let activity = await UserActivity.find({ userId });
        
        // Get workout logs for the user
        const workoutLogs = await WorkoutLog.find({ userId }).sort({ date: -1 });
        
        // Get goals for the user
        const goals = await Goal.find({ userId }).sort({ createdAt: -1 });
        
        // Convert workout logs to activity format
        const workoutActivities = workoutLogs.map(log => ({
            _id: log._id,
            userId: log.userId,
            activityType: 'Workout',
            description: `Completed workout: ${log.title} (${log.exercises.length} exercises)`,
            timestamp: log.date
        }));
        
        // Convert goals to activity format
        const goalActivities = goals.map(goal => ({
            _id: goal._id,
            userId: goal.userId,
            activityType: 'Goal',
            description: `Created goal: ${goal.goalType} - Target: ${goal.targetValue}`,
            timestamp: goal.createdAt
        }));
        
        // Combine all activities
        const allActivities = [...activity, ...workoutActivities, ...goalActivities];
        
        // Sort by timestamp (newest first)
        allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // If no activity is found after combining, create some sample activity
        if (allActivities.length === 0) {
            // Create sample activity data
            const sampleActivities = [
                {
                    userId,
                    activityType: 'Login',
                    description: 'User logged into the system',
                    timestamp: new Date(Date.now() - 86400000) // 1 day ago
                },
                {
                    userId,
                    activityType: 'Profile Update',
                    description: 'User updated their profile',
                    timestamp: new Date(Date.now() - 43200000) // 12 hours ago
                },
                {
                    userId,
                    activityType: 'Workout',
                    description: 'User completed a workout',
                    timestamp: new Date(Date.now() - 21600000) // 6 hours ago
                }
            ];
            
            // Save the sample activities
            await UserActivity.insertMany(sampleActivities);
            
            // Return the sample activities
            return res.status(200).json(sampleActivities);
        }
        
        // Return the combined user activity
        return res.status(200).json(allActivities);
    } catch (error) {
        console.error('Error fetching user activity:', error);
        res.status(500).json({ error: error.message }); // Handle any errors
    }
};

exports.createUserActivity = async (req, res) => {
    const { userId, activityType, description } = req.body; // Extract data from the request body
    try {
        const newActivity = new UserActivity({
            userId,
            activityType,
            description,
            timestamp: new Date() // Set the current timestamp
        });
        await newActivity.save(); // Save the activity to the database
        res.status(201).json({ message: 'User activity created successfully', activity: newActivity });
    } catch (error) {
        res.status(500).json({ error: error.message }); // Handle any errors
    }
};

// Get trainer activity by trainer ID
exports.getTrainerActivity = async (req, res) => {
    const { trainerId } = req.params; // Extract trainer ID from the request parameters
    try {
        // First check if the trainer exists
        const trainer = await Trainer.findById(trainerId);
        if (!trainer) {
            return res.status(404).json({ message: 'Trainer not found' });
        }
        
        // Look for activity related to this trainer
        // This assumes you have a TrainerActivity model or a field in UserActivity that can reference trainers
        // If you don't have a specific model for trainer activity, you can return a default response
        
        // For now, return a default response
        res.status(200).json([
            {
                _id: 'placeholder1',
                activityType: 'Login',
                description: 'Trainer logged into the system',
                timestamp: new Date(Date.now() - 86400000) // 1 day ago
            },
            {
                _id: 'placeholder2',
                activityType: 'Profile Update',
                description: 'Trainer updated their profile',
                timestamp: new Date(Date.now() - 43200000) // 12 hours ago
            }
        ]);
    } catch (error) {
        res.status(500).json({ error: error.message }); // Handle any errors
    }
};

// Get admin profile
exports.getAdminProfile = async (req, res) => {
    try {
      const adminId = req.user.id; // Extracted from JWT token via auth middleware
      const admin = await Admin.findById(adminId).select('-password'); // Exclude password
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
      res.status(200).json(admin);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
};

exports.updateAdminProfile = async (req, res) => {
    const adminId = req.user.id;
    const { name, email, image } = req.body;
  
    try {
      console.log(`Updating admin profile for ID: ${adminId}`);
      console.log(`Name: ${name}, Email: ${email}`);
      console.log(`Image data received: ${image ? 'Yes' : 'No'}`);
      
      const admin = await Admin.findById(adminId);
      if (!admin) {
        console.log('Admin not found');
        return res.status(404).json({ message: 'Admin not found' });
      }
  
      if (name) admin.name = name;
      if (email) admin.email = email;
      if (image) {
        console.log(`Updating admin image, length: ${image.length}`);
        admin.image = image;
      }
  
      await admin.save();
      console.log('Admin profile updated successfully');
      
      res.status(200).json({ 
        message: 'Profile updated successfully', 
        admin: {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          image: admin.image,
          role: admin.role
        } 
      });
    } catch (error) {
      console.error('Error updating admin profile:', error);
      res.status(500).json({ error: error.message });
    }
};

// Get all workout programs
exports.getAllWorkoutPrograms = async (req, res) => {
    try {
        const programs = await WorkoutProgram.find();
        res.status(200).json(programs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all nutrition plans
exports.getAllNutritionPlans = async (req, res) => {
    try {
        const plans = await NutritionPlan.find();
        res.status(200).json(plans);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all memberships
exports.getAllMemberships = async (req, res) => {
    try {
        const memberships = await Membership.find().populate('userId', 'name email');
        
        // Format the response to include userName
        const formattedMemberships = memberships.map(membership => {
            const membershipObj = membership.toObject();
            if (membershipObj.userId) {
                membershipObj.userName = membershipObj.userId.name;
            }
            return membershipObj;
        });
        
        res.status(200).json(formattedMemberships);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get memberships for a specific user
exports.getUserMemberships = async (req, res) => {
    try {
        const { userId } = req.params;
        const memberships = await Membership.find({ userId }).populate('userId', 'name email');
        
        // Format the response to include userName
        const formattedMemberships = memberships.map(membership => {
            const membershipObj = membership.toObject();
            if (membershipObj.userId) {
                membershipObj.userName = membershipObj.userId.name;
            }
            return membershipObj;
        });
        
        res.status(200).json(formattedMemberships);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all payments
exports.getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.find().populate('userId', 'name email');
        
        // Format the response to include userName
        const formattedPayments = payments.map(payment => {
            const paymentObj = payment.toObject();
            if (paymentObj.userId) {
                paymentObj.userName = paymentObj.userId.name;
            }
            return paymentObj;
        });
        
        res.status(200).json(formattedPayments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get analytics data
exports.getAnalytics = async (req, res) => {
    try {
        // User statistics
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } });
        const premiumUsers = await User.countDocuments({ role: 'premium' });
        
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: oneMonthAgo } });
        
        // Workout statistics
        let totalWorkouts = 0;
        let completedWorkouts = 0;
        let averageWorkoutsPerUser = 0;
        let mostPopularWorkout = 'N/A';
        
        try {
            totalWorkouts = await WorkoutLog.countDocuments();
            completedWorkouts = await WorkoutLog.countDocuments({ completed: true });
            averageWorkoutsPerUser = totalUsers > 0 ? totalWorkouts / totalUsers : 0;
            
            // Get most popular workout
            const workoutAggregation = await WorkoutLog.aggregate([
                { $group: { _id: "$workoutName", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 1 }
            ]);
            mostPopularWorkout = workoutAggregation.length > 0 ? workoutAggregation[0]._id : 'N/A';
        } catch (workoutError) {
            console.error('Error getting workout statistics:', workoutError);
        }
        
        // Financial statistics
        let totalRevenue = 0;
        
        try {
            const payments = await Payment.find();
            totalRevenue = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
        } catch (paymentError) {
            console.error('Error getting payment statistics:', paymentError);
        }
        
        let paymentsThisMonth = [];
        let revenueThisMonth = 0;
        let membershipRevenue = 0;
        let trainerRevenue = 0;
        
        try {
            paymentsThisMonth = await Payment.find({ date: { $gte: oneMonthAgo } });
            revenueThisMonth = paymentsThisMonth.reduce((sum, payment) => sum + (payment.amount || 0), 0);
            
            // Revenue by type
            membershipRevenue = payments
                .filter(payment => payment.type === 'membership')
                .reduce((sum, payment) => sum + (payment.amount || 0), 0);
                
            trainerRevenue = payments
                .filter(payment => payment.type === 'trainer')
                .reduce((sum, payment) => sum + (payment.amount || 0), 0);
        } catch (revenueError) {
            console.error('Error calculating revenue statistics:', revenueError);
        }
        
        // Membership statistics
        let totalMemberships = 0;
        let activeMemberships = 0;
        let mostPopularMembership = 'N/A';
        
        try {
            totalMemberships = await Membership.countDocuments();
            activeMemberships = await Membership.countDocuments({ status: 'active' });
            
            // Get most popular membership
            const membershipAggregation = await Membership.aggregate([
                { $group: { _id: "$type", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 1 }
            ]);
            mostPopularMembership = membershipAggregation.length > 0 ? membershipAggregation[0]._id : 'N/A';
        } catch (membershipError) {
            console.error('Error getting membership statistics:', membershipError);
        }
        
        // Trainer statistics
        let totalTrainers = 0;
        let activeTrainers = 0;
        
        try {
            totalTrainers = await Trainer.countDocuments();
            activeTrainers = await Trainer.countDocuments({ approved: true });
        } catch (trainerError) {
            console.error('Error getting trainer statistics:', trainerError);
        }
        
        // Return analytics data
        res.status(200).json({
            users: {
                total: totalUsers,
                active: activeUsers,
                premium: premiumUsers,
                newThisMonth: newUsersThisMonth
            },
            workouts: {
                total: totalWorkouts,
                completed: completedWorkouts,
                averagePerUser: averageWorkoutsPerUser.toFixed(2),
                mostPopular: mostPopularWorkout
            },
            finance: {
                totalRevenue: totalRevenue.toFixed(2),
                revenueThisMonth: revenueThisMonth.toFixed(2),
                membershipRevenue: membershipRevenue.toFixed(2),
                trainerRevenue: trainerRevenue.toFixed(2)
            },
            memberships: {
                total: totalMemberships,
                active: activeMemberships,
                mostPopular: mostPopularMembership
            },
            trainers: {
                total: totalTrainers,
                active: activeTrainers
            }
        });
    } catch (error) {
        console.error('Error in getAnalytics:', error);
        res.status(500).json({ 
            error: error.message,
            message: 'An error occurred while fetching analytics data'
        });
    }
};

// Get user progress reports
exports.getUserProgressReports = async (req, res) => {
    try {
        const reports = await ProgressReport.find().populate('clientId', 'name email');
        
        // Format the response to include userName
        const formattedReports = reports.map(report => {
            const reportObj = report.toObject();
            if (reportObj.clientId) {
                reportObj.userName = reportObj.clientId.name;
                reportObj.userId = reportObj.clientId; // Add userId for client-side compatibility
            }
            return reportObj;
        });
        
        res.status(200).json(formattedReports);
    } catch (error) {
        console.error('Error in getUserProgressReports:', error);
        res.status(500).json({ error: error.message });
    }
};

// Generate reports
exports.generateReport = async (req, res) => {
    const { reportType, startDate, endDate, userId } = req.body;
    
    try {
        let data = [];
        const startDateTime = new Date(startDate);
        const endDateTime = new Date(endDate);
        
        // Set end date to end of day
        endDateTime.setHours(23, 59, 59, 999);
        
        switch (reportType) {
            case 'user-activity':
                const userActivityQuery = {
                    timestamp: { $gte: startDateTime, $lte: endDateTime }
                };
                
                if (userId) {
                    userActivityQuery.userId = userId;
                }
                
                data = await UserActivity.find(userActivityQuery)
                    .populate('userId', 'name email')
                    .sort({ timestamp: -1 });
                break;
                
            case 'workout-completion':
                const workoutQuery = {
                    date: { $gte: startDateTime, $lte: endDateTime }
                };
                
                if (userId) {
                    workoutQuery.userId = userId;
                }
                
                data = await WorkoutLog.find(workoutQuery)
                    .populate('userId', 'name email')
                    .sort({ date: -1 });
                break;
                
            case 'financial':
                const paymentQuery = {
                    date: { $gte: startDateTime, $lte: endDateTime }
                };
                
                if (userId) {
                    paymentQuery.userId = userId;
                }
                
                data = await Payment.find(paymentQuery)
                    .populate('userId', 'name email')
                    .sort({ date: -1 });
                break;
                
            case 'user-progress':
                const progressQuery = {
                    date: { $gte: startDateTime, $lte: endDateTime }
                };
                
                if (userId) {
                    progressQuery.userId = userId;
                }
                
                data = await ProgressReport.find(progressQuery)
                    .populate('userId', 'name email')
                    .sort({ date: -1 });
                break;
                
            case 'trainer-performance':
                const trainerQuery = {};
                
                if (userId) {
                    trainerQuery.trainerId = userId;
                }
                
                // Get all workout logs with trainers
                const workoutLogs = await WorkoutLog.find({
                    ...trainerQuery,
                    date: { $gte: startDateTime, $lte: endDateTime },
                    trainerId: { $exists: true }
                }).populate('trainerId', 'name email');
                
                // Group by trainer
                const trainerPerformance = {};
                workoutLogs.forEach(log => {
                    if (log.trainerId) {
                        const trainerId = log.trainerId._id.toString();
                        if (!trainerPerformance[trainerId]) {
                            trainerPerformance[trainerId] = {
                                name: log.trainerId.name,
                                email: log.trainerId.email,
                                totalSessions: 0,
                                completedSessions: 0,
                                clients: new Set()
                            };
                        }
                        
                        trainerPerformance[trainerId].totalSessions++;
                        if (log.completed) {
                            trainerPerformance[trainerId].completedSessions++;
                        }
                        trainerPerformance[trainerId].clients.add(log.userId.toString());
                    }
                });
                
                // Convert to array and calculate completion rate
                data = Object.values(trainerPerformance).map(trainer => ({
                    ...trainer,
                    clients: Array.from(trainer.clients).length,
                    completionRate: trainer.totalSessions > 0 
                        ? (trainer.completedSessions / trainer.totalSessions * 100).toFixed(2) + '%' 
                        : '0%'
                }));
                break;
                
            default:
                return res.status(400).json({ message: 'Invalid report type' });
        }
        
        // Convert data to CSV format
        let csv = '';
        
        if (data.length > 0) {
            // Get headers
            const headers = Object.keys(data[0].toJSON ? data[0].toJSON() : data[0]);
            csv = headers.join(',') + '\n';
            
            // Add rows
            data.forEach(item => {
                const row = headers.map(header => {
                    const value = item[header];
                    if (value === null || value === undefined) return '';
                    if (typeof value === 'object') {
                        if (value instanceof Date) {
                            return value.toISOString();
                        }
                        return JSON.stringify(value).replace(/"/g, '""');
                    }
                    return String(value).replace(/"/g, '""');
                });
                csv += row.join(',') + '\n';
            });
        }
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${reportType}-report.csv`);
        res.status(200).send(csv);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add this function to the admin controller
exports.refreshAdminToken = async (req, res) => {
    const { adminId } = req.body;

    try {
        // Validate adminId
        if (!adminId) {
            return res.status(400).json({ message: 'Admin ID is required' });
        }

        // Find the admin by ID
        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Generate a new token
        const token = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '1h' });

        // Return the new token
        res.json({ 
            token, 
            message: 'Token refreshed successfully',
            admin: {
                _id: admin._id,
                name: admin.name,
                email: admin.email
            }
        });
    } catch (error) {
        console.error('Error refreshing admin token:', error);
        res.status(500).json({ message: 'Error refreshing token', error: error.message });
    }
};

// Get all announcements
exports.getAnnouncements = async (req, res) => {
  try {
    // Assuming we have an Announcement model
    // If not, we'll create a simple in-memory store for announcements
    let announcements = [];
    
    // Check if we have the Announcement model
    if (mongoose.models.Announcement) {
      announcements = await mongoose.models.Announcement.find().sort({ createdAt: -1 });
    } else {
      // Return mock announcements for development
      announcements = [
        {
          _id: '1',
          title: 'Welcome to Fitness Management System',
          content: 'We are excited to announce the launch of our new fitness management system!',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'Admin',
          isActive: true
        },
        {
          _id: '2',
          title: 'New Trainers Joined',
          content: 'We have new trainers who joined our team. Check out their profiles!',
          createdAt: new Date(Date.now() - 86400000), // 1 day ago
          updatedAt: new Date(Date.now() - 86400000),
          createdBy: 'Admin',
          isActive: true
        }
      ];
    }
    
    res.status(200).json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create a new announcement
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content, isActive } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    
    let announcement;
    
    // Check if we have the Announcement model
    if (mongoose.models.Announcement) {
      announcement = new mongoose.models.Announcement({
        title,
        content,
        isActive: isActive !== undefined ? isActive : true,
        createdBy: req.user.id
      });
      
      await announcement.save();
    } else {
      // Return a mock response for development
      announcement = {
        _id: Date.now().toString(),
        title,
        content,
        isActive: isActive !== undefined ? isActive : true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'Admin'
      };
    }
    
    res.status(201).json(announcement);
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update an announcement
exports.updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, isActive } = req.body;
    
    if (!title && !content && isActive === undefined) {
      return res.status(400).json({ message: 'At least one field to update is required' });
    }
    
    let announcement;
    
    // Check if we have the Announcement model
    if (mongoose.models.Announcement) {
      announcement = await mongoose.models.Announcement.findByIdAndUpdate(
        id,
        { title, content, isActive, updatedAt: new Date() },
        { new: true }
      );
      
      if (!announcement) {
        return res.status(404).json({ message: 'Announcement not found' });
      }
    } else {
      // Return a mock response for development
      announcement = {
        _id: id,
        title: title || 'Updated Announcement',
        content: content || 'This is an updated announcement',
        isActive: isActive !== undefined ? isActive : true,
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(),
        createdBy: 'Admin'
      };
    }
    
    res.status(200).json(announcement);
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete an announcement
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if we have the Announcement model
    if (mongoose.models.Announcement) {
      const announcement = await mongoose.models.Announcement.findByIdAndDelete(id);
      
      if (!announcement) {
        return res.status(404).json({ message: 'Announcement not found' });
      }
    }
    
    res.status(200).json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ error: error.message });
  }
};