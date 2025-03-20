import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaUsers, FaDumbbell, FaChartBar, FaMoneyBillWave, FaUserTie, FaCog, FaBullhorn, FaSpa } from 'react-icons/fa';
import { getAdminProfile } from '../../api';
import './AdminSidebar.css';
import '../../styles/TracFitLogo.css';

const AdminSidebar = () => {
  const [adminProfile, setAdminProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        // First try to get the admin profile from localStorage
        const storedAdminUser = localStorage.getItem('adminUser');
        if (storedAdminUser) {
          setAdminProfile(JSON.parse(storedAdminUser));
        }
        
        // Then try to get it from the API
        const response = await getAdminProfile();
        setAdminProfile(response.data);
      } catch (error) {
        console.error('Error fetching admin profile:', error);
        // If API call fails, we'll still have the localStorage data
      } finally {
        setLoading(false);
      }
    };

    fetchAdminProfile();
  }, []);

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="admin-sidebar">
      {/* TracFit Logo/Title */}
      <div className="tracfit-logo">
        <Link to="/admin/dashboard">
          <span className="track-part">Track</span><span className="fit-part">Fit</span>
        </Link>
      </div>
      
      <div className="admin-profile-brief">
        {adminProfile && (
          <>
            <div className="admin-avatar">
              <img 
                src={adminProfile.image || "https://via.placeholder.com/50"} 
                alt="Admin" 
                key={`avatar-${adminProfile._id}-${new Date().getTime()}`}
              />
            </div>
            <div className="admin-name">{adminProfile.name}</div>
          </>
        )}
      </div>
      
      <nav className="admin-nav">
        <Link 
          to="/admin/dashboard" 
          className={`nav-item ${isActive('/admin/dashboard') ? 'active' : ''}`}
        >
          <FaChartBar /> <span>Dashboard</span>
        </Link>
        <Link 
          to="/admin/users" 
          className={`nav-item ${isActive('/admin/users') ? 'active' : ''}`}
        >
          <FaUsers /> <span>User Management</span>
        </Link>
        <Link 
          to="/admin/trainers" 
          className={`nav-item ${isActive('/admin/trainers') ? 'active' : ''}`}
        >
          <FaUserTie /> <span>Trainer Management</span>
        </Link>
        <Link 
          to="/admin/content" 
          className={`nav-item ${isActive('/admin/content') ? 'active' : ''}`}
        >
          <FaDumbbell /> <span>Content Management</span>
        </Link>
        <Link 
          to="/admin/spa" 
          className={`nav-item ${isActive('/admin/spa') ? 'active' : ''}`}
        >
          <FaSpa /> <span>SPA Management</span>
        </Link>
        <Link 
          to="/admin/subscriptions" 
          className={`nav-item ${isActive('/admin/subscriptions') ? 'active' : ''}`}
        >
          <FaMoneyBillWave /> <span>Subscriptions</span>
        </Link>
        <Link 
          to="/admin/announcements" 
          className={`nav-item ${isActive('/admin/announcements') ? 'active' : ''}`}
        >
          <FaBullhorn /> <span>Announcements</span>
        </Link>
        <Link 
          to="/admin/analytics" 
          className={`nav-item ${isActive('/admin/analytics') ? 'active' : ''}`}
        >
          <FaChartBar /> <span>Analytics</span>
        </Link>
        <Link 
          to="/admin/settings" 
          className={`nav-item ${isActive('/admin/settings') ? 'active' : ''}`}
        >
          <FaCog /> <span>Settings</span>
        </Link>
      </nav>
    </div>
  );
};

export default AdminSidebar; 