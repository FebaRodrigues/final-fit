// //src/components/ProtectedRoute.jsx
// import React, { useContext } from "react";
// import { Navigate } from "react-router-dom";
// import { AuthContext } from "../context/AuthContext";

// const ProtectedRoute = ({ children, isTrainerRoute = false }) => {
//   const { user, trainer } = useContext(AuthContext);

//   // Check if the user is authenticated for the route
//   if (isTrainerRoute) {
//     // Trainer-specific route
//     if (!trainer) {
//       return <Navigate to="/trainers/login" replace />;
//     }
//   } else {
//     // User-specific route
//     if (!user) {
//       return <Navigate to="/users/login" replace />;
//     }
//   }

//   // If authenticated, render the protected component
//   return children;
// };

// export default ProtectedRoute;

// src/components/ProtectedRoute.jsx
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ isTrainerRoute, isAdminRoute }) => {
  const { user, trainer, tokenValid, checkTokenValidity } = useAuth();
  const location = useLocation();
  
  // Force a token validity check on component mount
  useEffect(() => {
    checkTokenValidity();
  }, [checkTokenValidity]);
  
  const role = localStorage.getItem('role');
  const token = localStorage.getItem('token');
  const adminUser = localStorage.getItem('adminUser');
  
  console.log("ProtectedRoute - Checking auth for path:", location.pathname, { 
    user: !!user, 
    trainer: !!trainer, 
    tokenValid, 
    isTrainerRoute, 
    isAdminRoute,
    role,
    hasToken: !!token,
    hasAdminUser: !!adminUser,
    tokenPrefix: token ? token.substring(0, 10) + '...' : 'No token'
  });

  // For trainer routes
  if (isTrainerRoute) {
    // Check if token is valid for trainer routes
    if (!tokenValid) {
      console.log("ProtectedRoute - Token invalid for trainer route, redirecting to trainer login");
      return <Navigate to="/trainers/login" />;
    }
    
    // Check if trainer is authenticated
    if (!trainer) {
      console.log("ProtectedRoute - No trainer found, redirecting to trainer login");
      return <Navigate to="/trainers/login" />;
    }
    
    console.log("ProtectedRoute - Trainer authenticated, rendering outlet");
    return <Outlet />;
  }

  // For admin routes
  if (isAdminRoute) {
    console.log("ProtectedRoute - Checking admin authentication");
    
    // Check if token exists
    if (!token) {
      console.log("ProtectedRoute - No token for admin route, redirecting to admin login");
      return <Navigate to="/admin/login" />;
    }
    
    // Check localStorage for admin role
    if (role !== 'admin') {
      console.log("ProtectedRoute - Not admin role, redirecting to admin login");
      return <Navigate to="/admin/login" />;
    }
    
    // Check if adminUser exists in localStorage
    if (!adminUser) {
      console.log("ProtectedRoute - No admin user data found, redirecting to admin login");
      return <Navigate to="/admin/login" />;
    }
    
    // For admin routes, we don't need to check tokenValid since we've already checked for token and role
    console.log("ProtectedRoute - Admin authenticated, rendering outlet");
    return <Outlet />;
  }

  // For user routes - check token validity and user authentication
  if (!tokenValid || !user) {
    console.log("ProtectedRoute - User not authenticated, redirecting to user login");
    return <Navigate to="/users/login" />;
  }

  console.log("ProtectedRoute - User authenticated, rendering outlet");
  return <Outlet />;
};

export default ProtectedRoute;