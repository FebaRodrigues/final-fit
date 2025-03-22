// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import API from "../api";

// Utility function to format image URLs with cache-busting
const formatImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  
  const timestamp = Date.now();
  
  // If it's already a full URL (starts with http or https), return with timestamp
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    // Check if it already has a query parameter
    if (imageUrl.includes('?')) {
      return `${imageUrl}&t=${timestamp}`;
    }
    return `${imageUrl}?t=${timestamp}`;
  }
  
  // If it's a relative path starting with /uploads, convert to server URL
  if (imageUrl.startsWith('/uploads/')) {
    const API_BASE = import.meta.env.VITE_SERVER_URL || 'https://final-fit-backend.vercel.app';
    return `${API_BASE}${imageUrl}?t=${timestamp}`;
  }
  
  // Otherwise return as is with timestamp
  if (imageUrl.includes('?')) {
    return `${imageUrl}&t=${timestamp}`;
  }
  return `${imageUrl}?t=${timestamp}`;
};

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return null;
    
    try {
      const parsedUser = JSON.parse(storedUser);
      // Format the image URL if it exists
      return {
        ...parsedUser,
        image: formatImageUrl(parsedUser.image)
      };
    } catch (error) {
      console.error("Failed to parse user from localStorage:", error);
      return null;
    }
  });
  const [trainer, setTrainer] = useState(() => {
    const storedTrainer = localStorage.getItem("trainer");
    if (!storedTrainer) return null;
    
    try {
      const parsedTrainer = JSON.parse(storedTrainer);
      // Format the image URL if it exists
      return {
        ...parsedTrainer,
        image: formatImageUrl(parsedTrainer.image)
      };
    } catch (error) {
      console.error("Failed to parse trainer from localStorage:", error);
      return null;
    }
  });
  const [membership, setMembership] = useState(() => {
    const storedMembership = localStorage.getItem("membership");
    try {
      return storedMembership ? JSON.parse(storedMembership) : null;
    } catch (error) {
      console.error("Failed to parse membership from localStorage:", error);
      return null; // Fallback to null if parsing fails
    }
  });
  const [isRefreshingMembership, setIsRefreshingMembership] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const [lastMembershipCheck, setLastMembershipCheck] = useState(0);
  
  // Use a ref to track if initial membership fetch has been done
  const initialMembershipFetchDone = useRef(false);

  // Add a new state variable to track if we're in the login process
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Define logout function early to avoid circular dependency
  const logout = useCallback(() => {
    setUser(null);
    setTrainer(null);
    setMembership(null);
    setTokenValid(false);
    localStorage.clear();
  }, []);

  // Function to check if token is valid - memoized with useCallback
  const checkTokenValidity = useCallback(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    console.log("Checking token validity, token exists:", !!token, "role:", role);
    
    if (!token) {
      console.log("No token found, setting tokenValid to false");
      setTokenValid(false);
      return false;
    }
    
    // For admin users, we only need to check if the token and role exist
    if (role === 'admin') {
      console.log("Admin role detected, setting tokenValid to true");
      setTokenValid(true);
      return true;
    }
    
    // For regular users and trainers, check if user data exists in localStorage
    if (role === 'user') {
      const userDataInStorage = localStorage.getItem("user");
      if (!userDataInStorage) {
        console.log("User role detected but no user data in localStorage, setting tokenValid to false");
        setTokenValid(false);
        return false;
      }
      console.log("User role detected with data in localStorage, setting tokenValid to true");
      setTokenValid(true);
      return true;
    }
    
    if (role === 'trainer') {
      const trainerDataInStorage = localStorage.getItem("trainer");
      if (!trainerDataInStorage) {
        console.log("Trainer role detected but no trainer data in localStorage, setting tokenValid to false");
        setTokenValid(false);
        return false;
      }
      console.log("Trainer role detected with data in localStorage, setting tokenValid to true");
      setTokenValid(true);
      return true;
    }
    
    // If we get here, the token is valid
    console.log("Token is valid, setting tokenValid to true");
    setTokenValid(true);
    return true;
  }, []);

  // Check token validity on mount and when token changes
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token && (user || trainer)) {
      // If no token but user/trainer data exists, clear everything
      logout();
    } else if (token) {
      // If token exists, check its validity
      checkTokenValidity();
    }
  }, [checkTokenValidity, user, trainer, logout]);

  // Enhanced setUser function that also updates localStorage
  const updateUser = useCallback((userData) => {
    console.log("AuthContext - updateUser called with:", userData);
    if (userData) {
      // Format the image URL if it exists
      const processedUserData = {
        ...userData,
        image: formatImageUrl(userData.image)
      };
      
      setUser(processedUserData);
      localStorage.setItem("user", JSON.stringify(processedUserData));
      console.log("AuthContext - User updated in context and localStorage");
    } else {
      setUser(null);
      localStorage.removeItem("user");
      console.log("AuthContext - User removed from context and localStorage");
    }
  }, []);

  // Sync user state with localStorage whenever it changes
  useEffect(() => {
    if (user) {
      console.log("AuthContext - Syncing user to localStorage:", user);
      localStorage.setItem("user", JSON.stringify(user));
    }
  }, [user]);

  const fetchMembership = useCallback(async (userId) => {
    if (!userId) {
      console.log("No user ID provided for membership fetch");
      return;
    }
    
    // Skip if already refreshing
    if (isRefreshingMembership) {
      console.log("Skipping membership fetch - already refreshing");
      return;
    }
    
    // Skip if we checked recently (within last 30 seconds) and membership exists
    const now = Date.now();
    if (now - lastMembershipCheck < 30 * 1000) {
      console.log("Skipping membership fetch - checked recently");
      return;
    }
    
    // Skip token validation check if we're in the login process
    if (!isLoggingIn && !checkTokenValidity()) {
      console.log("Token invalid, logging out");
      logout();
      return;
    }
    
    try {
      console.log("Fetching membership for user:", userId);
      setIsRefreshingMembership(true);
      setLastMembershipCheck(now);
      
      // Use direct API call instead of the function
      const response = await API.get(`/memberships/user/${userId}`);
      console.log("Membership API response:", response.data);
      
      // Handle empty response
      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        console.log("No memberships found for user");
        setMembership(null);
        localStorage.removeItem("membership");
        return;
      }
      
      // Find active membership
      const activeMembership = response.data.find((m) => m.status === "Active");
      
      if (activeMembership) {
        console.log("Found active membership:", activeMembership);
        setMembership(activeMembership);
        localStorage.setItem("membership", JSON.stringify(activeMembership));
        return activeMembership; // Return the active membership
      } else {
        // If no active membership, check for pending ones
        const pendingMembership = response.data.find((m) => m.status === "Pending");
        if (pendingMembership) {
          console.log("Found pending membership:", pendingMembership);
          // Don't set as current membership, but keep track of it
          localStorage.setItem("pendingMembership", JSON.stringify(pendingMembership));
          
          // Try to activate the pending membership if it's Elite
          if (pendingMembership.planType === 'Elite') {
            console.log("Found pending Elite membership, attempting to activate it");
            try {
              const activateResponse = await API.post(`/memberships/force-activate-elite/${userId}`);
              console.log("Activation response:", activateResponse.data);
              
              if (activateResponse.data && activateResponse.data.membership) {
                console.log("Successfully activated Elite membership:", activateResponse.data.membership);
                setMembership(activateResponse.data.membership);
                localStorage.setItem("membership", JSON.stringify(activateResponse.data.membership));
                return activateResponse.data.membership;
              }
            } catch (activateError) {
              console.error("Error activating pending Elite membership:", activateError);
            }
          }
        } else {
          // No active or pending memberships
          console.log("No active or pending memberships found");
          localStorage.removeItem("pendingMembership");
        }
        
        // Clear current membership
        setMembership(null);
        localStorage.removeItem("membership");
        return null; // Return null to indicate no active membership
      }
    } catch (error) {
      console.error("Error fetching membership:", error);
      
      // Handle network errors gracefully
      if (error.code === 'ERR_NETWORK') {
        console.log("Network error fetching membership");
        // Don't logout on network errors, just continue without membership data
        return null;
      }
      
      // Handle authentication errors
      if (error.response && error.response.status === 401) {
        console.log("Authentication error fetching membership, logging out");
        logout();
        return null;
      }
      
      // For other errors, just handle gracefully
      return null;
    } finally {
      setIsRefreshingMembership(false);
    }
  }, [isRefreshingMembership, lastMembershipCheck, checkTokenValidity, logout, isLoggingIn]);

  // Fetch membership on initial load - only if user exists and we haven't fetched yet
  useEffect(() => {
    if (user && !initialMembershipFetchDone.current) {
      console.log("User exists, fetching membership (initial fetch)");
      initialMembershipFetchDone.current = true;
      fetchMembership(user.id || user._id);
    }
  }, [user, fetchMembership]);

  // Set up a periodic refresh of membership status - less frequent
  useEffect(() => {
    if (!user) return;
    
    const userId = user.id || user._id;
    
    // Refresh membership every 5 minutes
    const intervalId = setInterval(() => {
      console.log("Periodic membership refresh");
      fetchMembership(userId);
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(intervalId);
  }, [user, fetchMembership]);

  const login = useCallback((userData) => {
    console.log("Login called with userData:", userData);
    
    // Set the logging in flag to true
    setIsLoggingIn(true);
    
    // Make sure token and role are set in localStorage
    if (userData && userData.token) {
      localStorage.setItem("token", userData.token);
      localStorage.setItem("role", userData.role || "user");
      console.log("Token and role set in localStorage");
    }
    
    // Check if this is an admin login
    if (userData && userData.role === 'admin') {
      console.log("Admin login detected");
      // For admin users, we don't need to set user or trainer, just update token validity
      setTokenValid(true);
      
      // Make sure we preserve the image property and format it
      const adminUserData = {
        ...userData,
        image: formatImageUrl(userData.image) // Format the image URL
      };
      
      // Store admin data in localStorage for persistence
      localStorage.setItem("adminUser", JSON.stringify(adminUserData));
      console.log("Admin user data stored in localStorage with image:", adminUserData.image ? 'Yes' : 'No');
    } else {
      // Regular user login - updateUser will handle image URL formatting
      updateUser(userData);
      setTokenValid(true);
      console.log("TokenValid set to true in login function");
      
      // Reset the initial fetch flag when logging in
      initialMembershipFetchDone.current = false;
      
      // Immediately fetch membership after login
      if (userData && (userData.id || userData._id)) {
        console.log("Fetching membership immediately after login");
        fetchMembership(userData.id || userData._id);
      }
    }
    
    // Check token validity to make sure it's set correctly
    setTimeout(() => {
      const isValid = checkTokenValidity();
      console.log("Token validity after login:", isValid);
      // Reset the logging in flag after a delay
      setIsLoggingIn(false);
    }, 1000); // Increased timeout to ensure state updates have time to complete
  }, [updateUser, fetchMembership, checkTokenValidity]);

  const setTrainerData = useCallback((trainerData) => {
    // Format the image URL if it exists and add a timestamp to force cache refresh
    const imageUrl = formatImageUrl(trainerData?.image);
    const processedTrainerData = {
      ...trainerData,
      image: imageUrl
    };
    
    console.log("AuthContext: Setting trainer data with image:", imageUrl);
    
    setTrainer(processedTrainerData);
    localStorage.setItem("trainer", JSON.stringify(processedTrainerData));
    setTokenValid(true);
    
    // Dispatch an event for other components
    window.dispatchEvent(new CustomEvent('trainerDataUpdated', { 
      detail: { 
        timestamp: Date.now(),
        trainerId: trainerData._id 
      } 
    }));
  }, []);

  // Only log in development environment
  if (process.env.NODE_ENV !== 'production') {
    console.log("AuthContext - Current User:", user);
    console.log("AuthContext - Current Trainer:", trainer);
    console.log("AuthContext - Current Membership:", membership);
    console.log("AuthContext - Token Valid:", tokenValid);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser: updateUser,
        trainer,
        setTrainer,
        setTrainerData,
        login,
        logout,
        membership,
        setMembership,
        fetchMembership,
        isRefreshingMembership,
        tokenValid,
        checkTokenValidity
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);