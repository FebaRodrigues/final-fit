import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaUserCircle, FaBell, FaSignOutAlt } from 'react-icons/fa';
import '../../styles/AdminNavbar.css';

const AdminNavbar = ({ adminProfile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get the current page title based on the path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/admin/dashboard')) return 'Admin Dashboard';
    if (path.includes('/admin/users')) return 'User Management';
    if (path.includes('/admin/trainers')) return 'Trainer Management';
    if (path.includes('/admin/content')) return 'Content Management';
    if (path.includes('/admin/spa')) return 'SPA Management';
    if (path.includes('/admin/subscriptions')) return 'Subscriptions';
    if (path.includes('/admin/announcements')) return 'Announcements Management';
    if (path.includes('/admin/analytics')) return 'Analytics';
    if (path.includes('/admin/settings')) return 'Settings';
    return 'Admin Panel';
  };

  const handleLogout = () => {
    // Clear all auth-related data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('adminUser');
    
    // Redirect to home page
    navigate('/');
  };

  return (
    <div className="admin-navbar">
      <div className="admin-navbar-title">
        <h1>{getPageTitle()}</h1>
      </div>
      <div className="admin-navbar-actions">
        <div className="admin-navbar-notifications">
          <FaBell />
          <span className="notification-badge">3</span>
        </div>
        <div className="admin-navbar-profile">
          {adminProfile && (
            <>
              <img 
                src={adminProfile.image || "https://via.placeholder.com/40"} 
                alt="Admin" 
                className="admin-navbar-avatar"
              />
              <span className="admin-navbar-name">{adminProfile.name}</span>
            </>
          )}
        </div>
        <button className="admin-navbar-logout" onClick={handleLogout}>
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminNavbar; 