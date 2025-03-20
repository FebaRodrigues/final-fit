// routes/reports.js
const express = require('express');
const { getRevenueReport, getUserActivity } = require('../controllers/reportController');
const { auth } = require('../middleware/auth');
const router = express.Router();
router.get('/revenue', auth(['admin']), getRevenueReport);
router.get('/user-activity', auth(['admin']), getUserActivity);
module.exports = router;