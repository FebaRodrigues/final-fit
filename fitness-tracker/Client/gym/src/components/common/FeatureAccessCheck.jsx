import React from 'react';
import { useNavigate } from 'react-router-dom';
import useMembershipAccess from '../../hooks/useMembershipAccess';
import '../../styles/FeatureAccessCheck.css';

/**
 * Component to check if a user has access to a feature based on their membership plan
 * If not, it shows an upgrade prompt
 */
const FeatureAccessCheck = ({ feature, children }) => {
  const { hasAccess, userPlan } = useMembershipAccess();
  const navigate = useNavigate();

  const handleUpgrade = () => {
    // Add console logs for debugging
    console.log("FeatureAccessCheck - Navigating to membership page");
    console.log("Current location:", window.location.pathname);
    
    // Use the full URL with base path to ensure correct navigation
    const baseUrl = window.location.origin; // Gets http://localhost:5173
    window.location.href = `${baseUrl}/user/membership`;
  };

  // If user has access to the feature, render the children
  if (hasAccess(feature)) {
    return children;
  }

  // Otherwise, show an upgrade prompt
  return (
    <div className="feature-access-container">
      <div className="feature-access-card">
        <div className="feature-access-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="feature-access-title">Premium Feature</h2>
        <p className="feature-access-message">
          This feature requires a {feature === 'goals' ? 'Premium or Elite' : 'higher'} membership plan.
          You currently have a <span className="feature-access-plan">{userPlan}</span> plan.
        </p>
        <button 
          className="feature-access-button"
          onClick={handleUpgrade}
        >
          Upgrade Membership
        </button>
      </div>
    </div>
  );
};

export default FeatureAccessCheck; 