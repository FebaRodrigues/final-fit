import { useAuth } from '../context/AuthContext';

/**
 * Custom hook to check if a user has access to specific features based on their membership plan
 * @returns {Object} Object containing access check functions and user's plan
 */
const useMembershipAccess = () => {
  const { membership, user } = useAuth();
  
  // Try to get membership from localStorage if not in context
  const getMembership = () => {
    if (membership) return membership;
    
    try {
      const storedMembership = localStorage.getItem('membership');
      if (storedMembership) {
        const parsedMembership = JSON.parse(storedMembership);
        console.log("useMembershipAccess - Found membership in localStorage:", parsedMembership);
        return parsedMembership;
      }
    } catch (error) {
      console.error("useMembershipAccess - Error parsing membership from localStorage:", error);
    }
    
    return null;
  };
  
  const effectiveMembership = getMembership();
  
  // Log membership information for debugging
  console.log("useMembershipAccess - Membership from context:", membership);
  console.log("useMembershipAccess - Effective membership:", effectiveMembership);
  console.log("useMembershipAccess - User:", user);
  
  // Determine user's plan - if no membership or not active, use "None"
  const userPlan = effectiveMembership && effectiveMembership.status === 'Active' ? effectiveMembership.planType : "None";
  console.log("useMembershipAccess - User Plan:", userPlan);
  
  // Define access rules for different membership types
  const accessRules = {
    None: ["home", "about", "dashboard", "payments", "notifications"], // New users
    Basic: ["home", "about", "dashboard", "workout-log", "payments", "notifications", "spa"],
    Premium: ["home", "about", "dashboard", "workout-log", "payments", "goals", "notifications", "spa"],
    Elite: ["home", "about", "dashboard", "workout-log", "payments", "goals", "spa", "notifications"],
  };
  
  const allowedFeatures = accessRules[userPlan] || accessRules.None;
  console.log("useMembershipAccess - Allowed Features:", allowedFeatures);
  
  /**
   * Check if user has access to a specific feature
   * @param {string} feature - The feature to check access for
   * @returns {boolean} Whether the user has access
   */
  const hasAccess = (feature) => {
    const hasAccess = allowedFeatures.includes(feature);
    console.log(`useMembershipAccess - Checking access to ${feature}: ${hasAccess}`);
    return hasAccess;
  };
  
  /**
   * Check if user has access to workout tracking
   * @returns {boolean} Whether the user has access to workout tracking
   */
  const hasWorkoutAccess = () => {
    const hasAccess = ['Basic', 'Premium', 'Elite'].includes(userPlan);
    console.log(`useMembershipAccess - Checking workout access: ${hasAccess}`);
    return hasAccess;
  };
  
  /**
   * Check if user has access to goal setting
   * @returns {boolean} Whether the user has access to goal setting
   */
  const hasGoalsAccess = () => {
    const hasAccess = ['Premium', 'Elite'].includes(userPlan);
    console.log(`useMembershipAccess - Checking goals access: ${hasAccess}`);
    return hasAccess;
  };
  
  /**
   * Check if user has access to SPA services
   * @returns {boolean} Whether the user has access to SPA services
   */
  const hasSpaAccess = () => {
    // Allow all membership types to access SPA services
    const hasAccess = ['Basic', 'Premium', 'Elite'].includes(userPlan);
    console.log(`useMembershipAccess - Checking SPA access: ${hasAccess}`);
    return hasAccess;
  };
  
  return {
    userPlan,
    hasAccess,
    hasWorkoutAccess,
    hasGoalsAccess,
    hasSpaAccess,
    isNewUser: userPlan === 'None',
    effectiveMembership
  };
};

export default useMembershipAccess; 