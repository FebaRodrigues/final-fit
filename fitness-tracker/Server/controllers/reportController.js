// controllers/reportController.js
const Payment = require('../models/Payment');
const User = require('../models/User');

exports.getRevenueReport = async (req, res) => {
    const payments = await Payment.find();
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    res.status(200).json({ totalRevenue, paymentCount: payments.length });
};

exports.getUserActivity = async (req, res) => {
    const users = await User.find();
    const activeUsers = users.filter(u => u.lastLogin > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // Last 30 days
    res.status(200).json({ activeUserCount: activeUsers.length, totalUsers: users.length });
};