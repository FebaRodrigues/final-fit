// src/components/UserDashboard/UserDashboard.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../../api';
import { useAuth } from '../../context/AuthContext';
import UserProfile from './UserProfile';
import useMembershipAccess from '../../hooks/useMembershipAccess';
import '../../styles/UserDashboard.css';
import { toast } from 'react-toastify';
import axios from 'axios';
import MembershipAccessError from '../common/MembershipAccessError';

// Debounce function to prevent multiple calls
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const UserDashboard = () => {
  const { user, setUser, membership, fetchMembership, checkTokenValidity } = useAuth();
  const { hasWorkoutAccess, hasGoalsAccess } = useMembershipAccess();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [membershipError, setMembershipError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activatingMembership, setActivatingMembership] = useState(false);
  const [localMembership, setLocalMembership] = useState(() => {
    try {
      const stored = localStorage.getItem('membership');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });
  const initialDataFetched = useRef(false);
  const membershipFetchAttempted = useRef(false);
  const renderCount = useRef(0);
  
  // Increment render count for debugging
  renderCount.current += 1;
  console.log(`UserDashboard - Render #${renderCount.current}`, { user, membership, localMembership, refreshKey });

  // Memoized membership fetch to prevent multiple calls
  const debouncedFetchMembership = useCallback(
    debounce((userId) => {
      console.log("UserDashboard - Debounced membership fetch for user:", userId);
      fetchMembership(userId);
    }, 1000),
    [fetchMembership]
  );

  // Check for pending Stripe session - only once
  useEffect(() => {
    console.log("UserDashboard - Checking for pending Stripe session");
    const checkPendingStripeSession = async () => {
      const pendingSessionId = localStorage.getItem('pendingStripeSession');
      if (pendingSessionId && user) {
        console.log('Found pending Stripe session:', pendingSessionId);
        toast.info('Verifying your recent payment...');
        
        try {
          // Get the server port from localStorage
          const serverPort = localStorage.getItem('serverPort') || '5050';
          const baseURL = `http://localhost:${serverPort}/api`;
          
          // Verify the session
          const response = await axios.get(`${baseURL}/payments/verify-session?session_id=${pendingSessionId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          console.log('Payment verification response:', response.data);
          
          if (response.data && response.data.payment) {
            if (response.data.payment.status === 'Completed') {
              toast.success('Your payment has been successfully processed!');
              
              // Refresh membership data
              debouncedFetchMembership(user.id);
              
              // Clear the pending session
              localStorage.removeItem('pendingStripeSession');
            } else {
              toast.info(`Payment status: ${response.data.payment.status}`);
            }
          }
        } catch (error) {
          console.error('Error verifying pending payment:', error);
          toast.error('Could not verify your recent payment. Please contact support.');
        }
      }
    };
    
    checkPendingStripeSession();
    // Run this effect only once on mount
  }, []); // Empty dependency array

  // Verify user and fetch membership on mount - only once
  useEffect(() => {
    // Skip if we've already fetched initial data
    if (initialDataFetched.current) {
      console.log("UserDashboard - Initial data already fetched, skipping");
      return;
    }
    
    console.log("UserDashboard - Verifying user");
    const verifyUser = async () => {
      if (!user) {
        console.log("No user found in context, redirecting to login");
        navigate('/users/login');
        return;
      }
      
      // Check if token is valid
      const isTokenValid = checkTokenValidity();
      console.log("Token validity check:", isTokenValid);
      if (!isTokenValid) {
        console.log("Token invalid, redirecting to login");
        navigate('/users/login');
        return;
      }
      
      try {
        // Try to fetch the latest user data
        const token = localStorage.getItem('token');
        if (token) {
          try {
            console.log("Fetching latest user data");
            const response = await API.get('/users/profile');
            console.log("User profile response:", response.data);
            
            // Update user in context with the latest data
            const updatedUser = {
              ...user,
              name: response.data.name,
              email: response.data.email,
              age: response.data.age,
              height: response.data.height,
              weight: response.data.weight,
              image: response.data.image
            };
            setUser(updatedUser);
            
            // Check for membership in localStorage first
            const storedMembership = localStorage.getItem('membership');
            if (storedMembership) {
              try {
                const parsedMembership = JSON.parse(storedMembership);
                console.log("Found membership in localStorage:", parsedMembership);
                setLocalMembership(parsedMembership);
                setLoading(false);
                initialDataFetched.current = true;
                return;
              } catch (e) {
                console.error("Error parsing membership from localStorage:", e);
              }
            }
            
            // If no valid membership in localStorage, fetch from API
            if (user.id && !membershipFetchAttempted.current) {
              console.log("No valid membership in localStorage, fetching from API");
              membershipFetchAttempted.current = true;
              try {
                const membershipResponse = await API.get(`/memberships/user/${user.id}`);
                console.log("Direct membership API response:", membershipResponse.data);
                
                if (membershipResponse.data && Array.isArray(membershipResponse.data) && membershipResponse.data.length > 0) {
                  // Find active membership
                  const activeMembership = membershipResponse.data.find(m => m.status === 'Active');
                  if (activeMembership) {
                    console.log("Found active membership via direct API call:", activeMembership);
                    // Store in localStorage and state
                    localStorage.setItem('membership', JSON.stringify(activeMembership));
                    setLocalMembership(activeMembership);
                  }
                }
              } catch (membershipError) {
                console.error("Error fetching membership:", membershipError);
              }
            }
            
            setLoading(false);
            // Mark that we've fetched initial data
            initialDataFetched.current = true;
          } catch (error) {
            console.error("Error fetching user profile:", error);
            
            // If we can't fetch the latest data, use what we have in context
            console.log("Using existing user data from context:", user);
            
            setError("Could not load your profile data. Using locally stored data.");
            setLoading(false);
            // Mark that we've fetched initial data even if there was an error
            initialDataFetched.current = true;
          }
        } else {
          console.log("No token found, redirecting to login");
          navigate('/users/login');
        }
      } catch (error) {
        console.error("Error in verifyUser:", error);
        setError("An unexpected error occurred. Please try again later.");
        setLoading(false);
        // Mark that we've fetched initial data even if there was an error
        initialDataFetched.current = true;
      }
    };
    
    verifyUser();
  }, [user?.id]); // Only depend on user.id, not refreshKey

  // Function to handle edit profile click
  const handleEditProfileClick = (e) => {
    // Verify token before navigating
    if (!checkTokenValidity()) {
      e.preventDefault();
      toast.error("Your session has expired. Please log in again.");
      navigate('/users/login');
      return false;
    }
    return true;
  };

  // Function to force activate Elite membership
  const activateEliteMembership = async () => {
    if (!user?.id) {
      toast.error("User information not available");
      return;
    }
    
    try {
      setActivatingMembership(true);
      console.log("Activating Elite membership for user:", user.id);
      
      const response = await API.post(`/memberships/force-activate-elite/${user.id}`);
      console.log("Membership activation response:", response.data);
      
      if (response.data && response.data.membership) {
        toast.success("Elite membership activated successfully!");
        
        // Store the membership directly in localStorage and state
        const newMembership = response.data.membership;
        localStorage.setItem('membership', JSON.stringify(newMembership));
        setLocalMembership(newMembership);
        
        // Reload the page after a short delay to ensure everything is updated
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.error("Error activating Elite membership:", error);
      toast.error("Failed to activate Elite membership. Please try again.");
    } finally {
      setActivatingMembership(false);
    }
  };

  // Handle click on workout tracking card
  const handleWorkoutClick = (e) => {
    if (!hasWorkoutAccess()) {
      e.preventDefault();
      setMembershipError({
        message: 'You need a Basic, Premium, or Elite membership to access workout tracking.',
        requiredPlans: ['Basic', 'Premium', 'Elite'],
        currentPlan: membership?.planType || 'None',
        isMembershipError: true
      });
    }
  };

  // Handle click on goal setting card
  const handleGoalClick = (e) => {
    if (!hasGoalsAccess()) {
      e.preventDefault();
      setMembershipError({
        message: 'You need a Premium or Elite membership to access goal setting.',
        requiredPlans: ['Premium', 'Elite'],
        currentPlan: membership?.planType || 'None',
        isMembershipError: true
      });
    }
  };

  if (loading) {
    console.log("UserDashboard - Loading state");
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }
  
  if (error) {
    console.log("UserDashboard - Error state:", error);
    return <div className="error-message">{error}</div>;
  }
  
  if (!user) {
    console.log("UserDashboard - No user state");
    return <div className="error-message">Please log in to view your dashboard.</div>;
  }

  // Use local membership state instead of context to prevent re-renders
  const effectiveMembership = localMembership || membership;
  console.log("UserDashboard - Effective membership:", effectiveMembership);

  // If there's a membership error, show the error component
  if (membershipError) {
    return (
      <MembershipAccessError 
        error={membershipError}
        onBack={() => setMembershipError(null)}
      />
    );
  }

  return (
    <div className="user-dashboard">
      <div className="dashboard-content">
        {/* Welcome Message */}
        <div className="welcome-section">
          <h2>Welcome, {user.name || 'User'}</h2>
          <Link 
            to="/user/profile" 
            className="edit-profile-btn"
            onClick={handleEditProfileClick}
          >
            Edit Profile
          </Link>
        </div>
        
        {/* Membership Status Section */}
        <div className="membership-section">
          <div className="membership-info">
            <p><strong>Plan:</strong> {effectiveMembership?.planType || 'None'}</p>
            <p><strong>Status:</strong> {effectiveMembership?.status || 'Inactive'}</p>
            <p><strong>Expires:</strong> {effectiveMembership?.endDate ? new Date(effectiveMembership.endDate).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="profile-section">
          <UserProfile />
        </div>

        {/* Dashboard Summary Section */}
        <div className="dashboard-summary">
          <h3>Dashboard Summary</h3>
          
          <div className="summary-cards">
            {/* Workout Tracking Card */}
            <Link 
              to="/user/workout-log" 
              className={`summary-card ${hasWorkoutAccess() ? 'active' : 'inactive'}`}
              onClick={handleWorkoutClick}
            >
              <h4>Workout Tracking</h4>
              <p>Track your workouts, view statistics, and monitor your progress.</p>
            </Link>
            
            {/* Goal Setting Card */}
            <Link 
              to="/user/goals" 
              className={`summary-card ${hasGoalsAccess() ? 'active' : 'inactive'}`}
              onClick={handleGoalClick}
            >
              <h4>Goal Setting</h4>
              <p>Set fitness goals, track your progress, and achieve your targets.</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
