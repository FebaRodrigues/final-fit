// routes/memberships.js
const express = require('express');
const { 
  createMembership, 
  getUserMemberships, 
  updateMembershipStatus,
  getAllMemberships,
  fixUserMembership,
  fixAllUserMemberships,
  fixMembership
} = require('../controllers/membershipController');
const { auth } = require('../middleware/auth');
const router = express.Router();

router.post('/', auth(['user']), createMembership);
router.get('/user/:userId', auth(['user']), getUserMemberships);
router.put('/:membershipId', auth(['admin']), updateMembershipStatus);
router.get('/', auth(['admin']), getAllMemberships);

// Special route to fix membership status
router.post('/fix/:userId/:membershipId', auth(['user', 'admin']), fixUserMembership);

// New route to fix all pending memberships for a user
router.post('/fix-all/:userId', auth(['user', 'admin']), fixAllUserMemberships);

// Route to fix a specific membership
router.post('/fix/:userId/:membershipId', auth(['user', 'admin']), fixMembership);

// New route to force activate an Elite membership for a user
router.post('/force-activate-elite/:userId', auth(['user', 'admin']), async (req, res) => {
  const { userId } = req.params;
  const Membership = require('../models/Membership');
  
  try {
    console.log(`Force activating Elite membership for user ${userId}`);
    
    // First, expire any existing active memberships
    await Membership.updateMany(
      { userId, status: 'Active' },
      { status: 'Expired' }
    );
    
    // Check for any pending Elite memberships
    const pendingElite = await Membership.findOne({ 
      userId, 
      status: 'Pending',
      planType: 'Elite'
    }).sort({ createdAt: -1 });
    
    let activatedMembership;
    
    if (pendingElite) {
      console.log('Found pending Elite membership:', pendingElite._id);
      
      // Activate the pending Elite membership
      activatedMembership = await Membership.findByIdAndUpdate(
        pendingElite._id,
        { 
          status: 'Active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        },
        { new: true }
      );
    } else {
      console.log('No pending Elite membership found, creating a new one');
      
      // Create a new Elite membership
      const newMembership = new Membership({
        userId,
        planType: 'Elite',
        duration: 'Monthly',
        price: 99.99,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'Active'
      });
      
      activatedMembership = await newMembership.save();
    }
    
    console.log('Activated membership:', activatedMembership);
    
    res.status(200).json({ 
      message: 'Elite membership activated successfully',
      membership: activatedMembership
    });
  } catch (error) {
    console.error('Error activating Elite membership:', error);
    res.status(500).json({ error: error.message });
  }
});

// Placeholder for membership routes
router.get('/', auth(['user', 'admin']), (req, res) => {
  res.status(200).json({ message: 'Memberships route is working' });
});

module.exports = router;