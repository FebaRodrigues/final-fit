const Membership = require('../models/Membership');

/**
 * Middleware to check if a user has access to specific features based on their membership plan
 * @param {Array} requiredPlans - Array of membership plans that have access to the feature
 * @returns {Function} Express middleware function
 */
const checkMembershipAccess = (requiredPlans) => {
  return async (req, res, next) => {
    try {
      // Get user ID from authenticated request
      const userId = req.user.id;
      
      // Skip check for admin and trainer roles
      if (req.user.role === 'admin' || req.user.role === 'trainer') {
        return next();
      }
      
      // Find active membership for the user
      const membership = await Membership.findOne({ 
        userId, 
        status: 'Active'
      });
      
      // If no active membership and some plan is required
      if (!membership && requiredPlans.length > 0) {
        return res.status(403).json({ 
          error: 'Access denied. Active membership required.',
          requiredPlans
        });
      }
      
      // If membership exists, check if the plan type is allowed
      if (membership && requiredPlans.length > 0 && !requiredPlans.includes(membership.planType)) {
        return res.status(403).json({ 
          error: `Access denied. Your current plan (${membership.planType}) does not include this feature.`,
          currentPlan: membership.planType,
          requiredPlans
        });
      }
      
      // Add membership to request for potential use in route handlers
      req.membership = membership;
      
      // Access granted
      next();
    } catch (error) {
      console.error('Error checking membership access:', error);
      res.status(500).json({ error: 'Internal server error checking membership access' });
    }
  };
};

// Predefined middleware for common feature access
const membershipAccess = {
  // Any active membership (Basic, Premium, Elite)
  basic: checkMembershipAccess(['Basic', 'Premium', 'Elite']),
  
  // Premium or Elite membership
  premium: checkMembershipAccess(['Premium', 'Elite']),
  
  // Only Elite membership
  elite: checkMembershipAccess(['Elite']),
  
  // No membership required
  none: checkMembershipAccess([]),
  
  // Custom function to check specific plans
  check: checkMembershipAccess
};

module.exports = membershipAccess; 