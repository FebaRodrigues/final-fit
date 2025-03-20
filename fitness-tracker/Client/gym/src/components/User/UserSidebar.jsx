import React, { useState, useContext, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaUser, FaDumbbell, FaChartBar, FaMoneyBillWave, FaCalendarAlt, FaSpa, FaBell, FaSignOutAlt, FaTrophy, FaBars } from 'react-icons/fa';
import { AuthContext } from '../../context/AuthContext';
import './UserSidebar.css';
import '../../styles/TracFitLogo.css';

const UserSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, membership } = useContext(AuthContext);
  const userPlan = membership?.status === 'Active' ? membership.planType : "None";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path) => {
    if (path === '/user/workout') {
      return location.pathname.includes(path);
    }
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  return (
    <>
      {/* Mobile toggle button - now on right side */}
      <button 
        className="mobile-toggle" 
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <FaBars />
      </button>
      
      <div className={`user-sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* TracFit Logo/Title */}
        <div className="tracfit-logo">
          <Link to="/user/dashboard">
            <span className="track-part">Track</span><span className="fit-part">Fit</span>
          </Link>
        </div>
        
        <div className="user-profile-brief">
          {user && (
            <>
              <div className="user-avatar">
                {user.image ? (
                  <img 
                    src={user.image} 
                    alt={user.name} 
                    key={`avatar-${user._id}-${new Date().getTime()}`}
                  />
                ) : (
                  <div className="avatar-placeholder">{user.name ? user.name.charAt(0) : 'U'}</div>
                )}
              </div>
              <div className="user-name">{user.name}</div>
              <div className="membership-badge">
                {userPlan === "None" ? "No Active Plan" : `${userPlan} Plan`}
              </div>
            </>
          )}
        </div>
        
        <nav className="user-nav">
          <Link 
            to="/user/dashboard" 
            className={`nav-item ${isActive('/user/dashboard') ? 'active' : ''}`}
          >
            <FaChartBar /> <span>Dashboard</span>
          </Link>
          <Link 
            to="/user/profile" 
            className={`nav-item ${isActive('/user/profile') ? 'active' : ''}`}
          >
            <FaUser /> <span>Profile</span>
          </Link>
          
          {userPlan !== "None" && (
            <Link 
              to="/user/workout-log" 
              className={`nav-item ${isActive('/user/workout') ? 'active' : ''}`}
            >
              <FaDumbbell /> <span>Workouts</span>
            </Link>
          )}
          
          {(userPlan === "Premium" || userPlan === "Elite") && (
            <Link 
              to="/user/goals" 
              className={`nav-item ${isActive('/user/goals') ? 'active' : ''}`}
            >
              <FaTrophy /> <span>Goals</span>
            </Link>
          )}
          
          {userPlan === "Elite" && (
            <Link 
              to="/user/appointments" 
              className={`nav-item ${isActive('/user/appointments') ? 'active' : ''}`}
            >
              <FaCalendarAlt /> <span>Appointments</span>
            </Link>
          )}
          
          {userPlan !== "None" && (
            <Link 
              to="/user/spa" 
              className={`nav-item ${isActive('/user/spa') ? 'active' : ''}`}
            >
              <FaSpa /> <span>SPA Services</span>
            </Link>
          )}
          
          <Link 
            to="/user/payments" 
            className={`nav-item ${isActive('/user/payments') ? 'active' : ''}`}
          >
            <FaMoneyBillWave /> <span>Membership</span>
          </Link>
          
          <Link 
            to="/user/notifications" 
            className={`nav-item ${isActive('/user/notifications') ? 'active' : ''}`}
          >
            <FaBell /> <span>Notifications</span>
          </Link>
          
          <button onClick={handleLogout} className="nav-item logout-btn">
            <FaSignOutAlt /> <span>Logout</span>
          </button>
        </nav>
      </div>
      
      {/* Overlay for mobile */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} 
        onClick={() => setSidebarOpen(false)}
      ></div>
    </>
  );
};

export default UserSidebar; 