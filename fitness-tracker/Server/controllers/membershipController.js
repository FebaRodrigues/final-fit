// controllers/membershipController.js
const Membership = require('../models/Membership');
const Payment = require('../models/Payment');

exports.createMembership = async (req, res) => {
  const { planType, duration, price } = req.body;
  const userId = req.user.id;

  try {
    // First, check for any existing active membership
    const existingActiveMembership = await Membership.findOne({ 
      userId, 
      status: 'Active'
    });

    if (existingActiveMembership) {
      // Set the existing active membership to 'Expired'
      await Membership.findByIdAndUpdate(
        existingActiveMembership._id,
        { status: 'Expired' }
      );
    }

    const endDate = new Date();
    if (duration === 'Monthly') endDate.setMonth(endDate.getMonth() + 1);
    else if (duration === 'Quarterly') endDate.setMonth(endDate.getMonth() + 3);
    else if (duration === 'Yearly') endDate.setFullYear(endDate.getFullYear() + 1);

    // Create the new membership with 'Pending' status
    const membership = new Membership({ 
      userId, 
      planType, 
      duration, 
      price, 
      endDate,
      status: 'Pending'
    });
    
    await membership.save();
    res.status(201).json({ message: 'Membership created', membership });
  } catch (error) {
    console.error('Error creating membership:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getUserMemberships = async (req, res) => {
  const { userId } = req.params;
  try {
    const memberships = await Membership.find({ userId });
    res.status(200).json(memberships);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateMembershipStatus = async (req, res) => {
  const { membershipId } = req.params;
  const { status } = req.body;
  try {
    // If setting to Active, first expire all other active memberships for this user
    if (status === 'Active') {
      // First get the membership to find the userId
      const membership = await Membership.findById(membershipId);
      if (!membership) {
        return res.status(404).json({ message: 'Membership not found' });
      }
      
      // Expire all other active memberships for this user
      await Membership.updateMany(
        { userId: membership.userId, status: 'Active', _id: { $ne: membershipId } },
        { status: 'Expired' }
      );
    }
    
    // Now update the requested membership
    const updatedMembership = await Membership.findByIdAndUpdate(
      membershipId,
      { 
        status,
        ...(status === 'Active' ? { 
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        } : {})
      },
      { new: true }
    );
    
    if (!updatedMembership) {
      return res.status(404).json({ message: 'Membership not found' });
    }
    
    res.status(200).json({ message: 'Membership status updated', membership: updatedMembership });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllMemberships = async (req, res) => {
  try {
    const memberships = await Membership.find();
    res.status(200).json(memberships);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.fixUserMembership = async (req, res) => {
  const { userId, membershipId } = req.params;
  
  try {
    console.log(`Attempting to fix membership for user ${userId}, membership ${membershipId}`);
    
    // Find the membership
    const membership = await Membership.findById(membershipId);
    
    if (!membership) {
      return res.status(404).json({ message: 'Membership not found' });
    }
    
    console.log('Found membership:', membership);
    
    // Update the membership status to Active
    const updatedMembership = await Membership.findByIdAndUpdate(
      membershipId,
      { 
        status: 'Active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      },
      { new: true }
    );
    
    if (!updatedMembership) {
      return res.status(500).json({ message: 'Failed to update membership' });
    }
    
    console.log('Updated membership:', updatedMembership);
    
    res.status(200).json({ 
      message: 'Membership status fixed',
      membership: updatedMembership
    });
  } catch (error) {
    console.error('Error fixing membership:', error);
    res.status(500).json({ error: error.message });
  }
};

// New function to fix all pending memberships for a user
exports.fixAllUserMemberships = async (req, res) => {
  const { userId } = req.params;
  
  try {
    console.log(`Attempting to fix all memberships for user ${userId}`);
    
    // Find all pending memberships for the user
    const pendingMemberships = await Membership.find({ 
      userId, 
      status: 'Pending' 
    });
    
    if (!pendingMemberships || pendingMemberships.length === 0) {
      return res.status(404).json({ message: 'No pending memberships found' });
    }
    
    console.log(`Found ${pendingMemberships.length} pending memberships`);
    
    // Find all completed payments for the user
    const completedPayments = await Payment.find({
      userId,
      status: 'Completed'
    });
    
    console.log(`Found ${completedPayments.length} completed payments`);
    
    // Match payments with memberships
    const membershipIdsWithPayments = completedPayments.map(payment => 
      payment.membershipId ? payment.membershipId.toString() : null
    ).filter(id => id !== null);
    
    console.log('Membership IDs with payments:', membershipIdsWithPayments);
    
    // First, set all existing active memberships to expired
    await Membership.updateMany(
      { userId, status: 'Active' },
      { status: 'Expired' }
    );
    
    // Activate the most recent membership with a completed payment
    let activatedCount = 0;
    let latestMembership = null;
    let latestDate = new Date(0);
    
    for (const membership of pendingMemberships) {
      const membershipId = membership._id.toString();
      const hasPayment = membershipIdsWithPayments.includes(membershipId);
      
      if (hasPayment) {
        const createdAt = new Date(membership.createdAt);
        if (createdAt > latestDate) {
          latestDate = createdAt;
          latestMembership = membership;
        }
      }
    }
    
    if (latestMembership) {
      const updatedMembership = await Membership.findByIdAndUpdate(
        latestMembership._id,
        { 
          status: 'Active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        },
        { new: true }
      );
      
      if (updatedMembership) {
        activatedCount = 1;
        console.log('Activated membership:', updatedMembership);
      }
    }
    
    res.status(200).json({ 
      message: `Fixed ${activatedCount} memberships for user`,
      activatedCount
    });
  } catch (error) {
    console.error('Error fixing all memberships:', error);
    res.status(500).json({ error: error.message });
  }
};

// Function to fix a specific membership
exports.fixMembership = async (req, res) => {
  const { userId, membershipId } = req.params;
  
  try {
    console.log(`Attempting to fix membership ${membershipId} for user ${userId}`);
    
    // Find the specific pending membership
    const membership = await Membership.findOne({ 
      _id: membershipId,
      userId,
      status: 'Pending'
    });
    
    if (!membership) {
      return res.status(404).json({ message: 'No pending membership found' });
    }
    
    console.log('Found pending membership:', membership);
    
    // Find completed payment for this membership
    const payment = await Payment.findOne({
      membershipId,
      userId,
      status: 'Completed'
    });
    
    if (!payment) {
      return res.status(404).json({ message: 'No completed payment found for this membership' });
    }
    
    console.log('Found completed payment:', payment);
    
    // Set all existing active memberships to expired
    await Membership.updateMany(
      { userId, status: 'Active' },
      { status: 'Expired' }
    );
    
    // Activate this membership
    membership.status = 'Active';
    membership.startDate = new Date();
    membership.endDate = new Date();
    membership.endDate.setMonth(membership.endDate.getMonth() + 1); // Add one month
    
    await membership.save();
    
    console.log('Successfully activated membership:', membership);
    
    return res.status(200).json({
      message: 'Membership activated successfully',
      membership
    });
    
  } catch (error) {
    console.error('Error fixing membership:', error);
    return res.status(500).json({ message: 'Error fixing membership', error: error.message });
  }
};

module.exports = exports;