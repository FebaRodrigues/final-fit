import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { FaUsers, FaDumbbell, FaChartBar, FaMoneyBillWave, FaCalendarAlt, FaBullhorn, FaSignOutAlt, FaUserCog, FaBars, FaBullseye } from 'react-icons/fa';
import './TrainerLayout.css';
import '../../styles/ModernTrainerStyles.css';
import Footer from '../Footer';

const TrainerLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [trainerProfile, setTrainerProfile] = useState(null);

  useEffect(() => {
    // Check if user is authenticated as trainer
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || role !== 'trainer') {
      navigate('/');
    }
    
    // Get trainer profile from localStorage
    const storedTrainer = localStorage.getItem('trainer');
    if (storedTrainer) {
      setTrainerProfile(JSON.parse(storedTrainer));
    }
  }, [navigate]);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    // Clear all auth-related data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('trainer');
    
    // Redirect to home page
    navigate('/');
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className="trainer-layout">
      {/* Top Navigation Bar */}
      <header className="trainer-header">
        <div className="trainer-logo">
          <Link to="/trainer/dashboard">
            <span className="track-part">Track</span><span className="fit-part">Fit</span>
          </Link>
        </div>
        
        <button className="menu-toggle" onClick={toggleMenu}>
          <FaBars />
        </button>
        
        {/* Mobile Navigation */}
        <nav className={`trainer-mobile-nav ${menuOpen ? 'open' : ''}`}>
          <Link 
            to="/trainer/dashboard" 
            className={`nav-item ${isActive('/trainer/dashboard') ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            <FaChartBar /> <span>Dashboard</span>
          </Link>
          <Link 
            to="/trainer/clients" 
            className={`nav-item ${isActive('/trainer/clients') ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            <FaUsers /> <span>Clients</span>
          </Link>
          <Link 
            to="/trainer/workout-plans" 
            className={`nav-item ${isActive('/trainer/workout-plans') ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            <FaDumbbell /> <span>Workout Plans</span>
          </Link>
          <Link 
            to="/trainer/goals" 
            className={`nav-item ${isActive('/trainer/goals') ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            <FaBullseye /> <span>Client Goals</span>
          </Link>
          <Link 
            to="/trainer/appointments" 
            className={`nav-item ${isActive('/trainer/appointments') ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            <FaCalendarAlt /> <span>Appointments</span>
          </Link>
          <Link 
            to="/trainer/profile" 
            className={`nav-item ${isActive('/trainer/profile') ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            <FaUserCog /> <span>Profile</span>
          </Link>
          
          <button onClick={handleLogout} className="nav-item logout-btn">
            <FaSignOutAlt /> <span>Logout</span>
          </button>
        </nav>
        
        {trainerProfile && (
          <div className="trainer-profile">
            <img 
              src={trainerProfile.image || "https://via.placeholder.com/40"} 
              alt="Trainer" 
              className="trainer-avatar"
            />
            <span className="trainer-name">{trainerProfile.name}</span>
          </div>
        )}
      </header>
      
      <div className="trainer-content-container">
        {/* Sidebar Navigation */}
        <aside className="trainer-sidebar">
          {trainerProfile && (
            <div className="sidebar-profile">
              <img 
                src={trainerProfile.image || "https://via.placeholder.com/80"} 
                alt="Trainer" 
                className="sidebar-avatar"
              />
              <div className="sidebar-name">{trainerProfile.name}</div>
              <div className="sidebar-role">Fitness Trainer</div>
            </div>
          )}
          
          <nav className="sidebar-nav">
            <Link 
              to="/trainer/dashboard" 
              className={`sidebar-item ${isActive('/trainer/dashboard') ? 'active' : ''}`}
            >
              <FaChartBar /> <span>Dashboard</span>
            </Link>
            <Link 
              to="/trainer/clients" 
              className={`sidebar-item ${isActive('/trainer/clients') ? 'active' : ''}`}
            >
              <FaUsers /> <span>Clients</span>
            </Link>
            <Link 
              to="/trainer/workout-plans" 
              className={`sidebar-item ${isActive('/trainer/workout-plans') ? 'active' : ''}`}
            >
              <FaDumbbell /> <span>Workout Plans</span>
            </Link>
            <Link 
              to="/trainer/goals" 
              className={`sidebar-item ${isActive('/trainer/goals') ? 'active' : ''}`}
            >
              <FaBullseye /> <span>Client Goals</span>
            </Link>
            <Link 
              to="/trainer/appointments" 
              className={`sidebar-item ${isActive('/trainer/appointments') ? 'active' : ''}`}
            >
              <FaCalendarAlt /> <span>Appointments</span>
            </Link>
            <Link 
              to="/trainer/profile" 
              className={`sidebar-item ${isActive('/trainer/profile') ? 'active' : ''}`}
            >
              <FaUserCog /> <span>Profile</span>
            </Link>
            
            <button onClick={handleLogout} className="sidebar-item logout-btn">
              <FaSignOutAlt /> <span>Logout</span>
            </button>
          </nav>
        </aside>
        
        {/* Main Content */}
        <main className="trainer-main-content">
          <div className="trainer-content-wrapper">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default TrainerLayout; 