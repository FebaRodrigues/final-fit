import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaUsers, FaDumbbell, FaChartBar, FaMoneyBillWave, FaCalendarAlt, FaBullhorn, FaSignOutAlt, FaUserCog, FaBullseye } from 'react-icons/fa';
import './TrainerSidebar.css';
import '../../styles/TracFitLogo.css';
import { AuthContext } from '../../context/AuthContext';

const TrainerSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { trainer } = useContext(AuthContext);
  const [trainerProfile, setTrainerProfile] = useState(null);
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [imageTimestamp, setImageTimestamp] = useState(Date.now());

  useEffect(() => {
    // Get trainer profile from localStorage or context
    if (trainer) {
      console.log("TrainerSidebar: Updating from context", trainer);
      setTrainerProfile(trainer);
      // Force image cache refresh
      setImageTimestamp(Date.now());
    } else {
      const storedTrainer = localStorage.getItem('trainer');
      if (storedTrainer) {
        try {
          const parsedTrainer = JSON.parse(storedTrainer);
          console.log("TrainerSidebar: Updating from localStorage", parsedTrainer);
          setTrainerProfile(parsedTrainer);
          // Force image cache refresh
          setImageTimestamp(Date.now());
        } catch (error) {
          console.error('Error parsing trainer data from localStorage:', error);
        }
      }
    }
  }, [trainer, refreshKey]); // Re-run when trainer changes in context or refreshKey changes

  // Add a listener for the custom trainerProfileUpdated event
  useEffect(() => {
    const handleProfileUpdate = (event) => {
      console.log('TrainerSidebar: Detected profile update event', event.detail);
      setRefreshKey(Date.now());
      setImageTimestamp(Date.now());
      
      // Also refresh from localStorage
      const storedTrainer = localStorage.getItem('trainer');
      if (storedTrainer) {
        try {
          const parsedTrainer = JSON.parse(storedTrainer);
          console.log('TrainerSidebar: Refreshing from localStorage after event', parsedTrainer);
          setTrainerProfile(parsedTrainer);
        } catch (error) {
          console.error('Error parsing trainer data from localStorage:', error);
        }
      }
    };

    window.addEventListener('trainerProfileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('trainerProfileUpdated', handleProfileUpdate);
    };
  }, []);

  // Add a listener for localStorage changes
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'trainer') {
        console.log('TrainerSidebar: Detected localStorage change for trainer');
        try {
          const parsedTrainer = JSON.parse(event.newValue);
          setTrainerProfile(parsedTrainer);
          setImageTimestamp(Date.now());
        } catch (error) {
          console.error('Error parsing trainer data from storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Add a listener for the trainerDataUpdated event from AuthContext
  useEffect(() => {
    const handleTrainerDataUpdate = (event) => {
      console.log('TrainerSidebar: Detected trainerDataUpdated event', event.detail);
      setRefreshKey(Date.now());
      setImageTimestamp(Date.now());
      
      // Reload trainer from localStorage
      const storedTrainer = localStorage.getItem('trainer');
      if (storedTrainer) {
        try {
          const parsedTrainer = JSON.parse(storedTrainer);
          console.log('TrainerSidebar: Refreshing from localStorage after AuthContext update', parsedTrainer);
          setTrainerProfile(parsedTrainer);
        } catch (error) {
          console.error('Error parsing trainer data from localStorage:', error);
        }
      }
    };

    window.addEventListener('trainerDataUpdated', handleTrainerDataUpdate);
    return () => {
      window.removeEventListener('trainerDataUpdated', handleTrainerDataUpdate);
    };
  }, []);

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

  // Function to generate image URL with timestamp
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return "https://via.placeholder.com/50";
    
    // If the URL already has a query parameter, append the timestamp
    if (imageUrl.includes('?')) {
      return `${imageUrl}&t=${imageTimestamp}`;
    }
    // Otherwise, add the timestamp as a new query parameter
    return `${imageUrl}?t=${imageTimestamp}`;
  };

  return (
    <div className="trainer-sidebar">
      {/* TracFit Logo/Title */}
      <div className="tracfit-logo">
        <Link to="/trainer/dashboard">
          <span className="track-part">Track</span><span className="fit-part">Fit</span>
        </Link>
      </div>
      
      <div className="trainer-profile-brief">
        {trainerProfile && (
          <>
            <div className="trainer-avatar">
              <img 
                src={getImageUrl(trainerProfile.image)} 
                alt="Trainer" 
                onError={(e) => {
                  console.error("Image failed to load:", e);
                  e.target.src = "https://via.placeholder.com/50";
                }}
              />
            </div>
            <div className="trainer-name">{trainerProfile.name}</div>
          </>
        )}
      </div>
      
      <nav className="trainer-nav">
        <Link 
          to="/trainer/dashboard" 
          className={`nav-item ${isActive('/trainer/dashboard') ? 'active' : ''}`}
        >
          <FaChartBar /> Dashboard
        </Link>
        <Link 
          to="/trainer/clients" 
          className={`nav-item ${isActive('/trainer/clients') ? 'active' : ''}`}
        >
          <FaUsers /> Clients
        </Link>
        <Link 
          to="/trainer/workout-plans" 
          className={`nav-item ${isActive('/trainer/workout-plans') ? 'active' : ''}`}
        >
          <FaDumbbell /> Workout Plans
        </Link>
        <Link 
          to="/trainer/goals" 
          className={`nav-item ${isActive('/trainer/goals') ? 'active' : ''}`}
        >
          <FaBullseye /> Client Goals
        </Link>
        <Link 
          to="/trainer/appointments" 
          className={`nav-item ${isActive('/trainer/appointments') ? 'active' : ''}`}
        >
          <FaCalendarAlt /> Appointments
        </Link>
        <Link 
          to="/trainer/payments" 
          className={`nav-item ${isActive('/trainer/payments') ? 'active' : ''}`}
        >
          <FaMoneyBillWave /> Payments
        </Link>
        <Link 
          to="/trainer/announcements" 
          className={`nav-item ${isActive('/trainer/announcements') ? 'active' : ''}`}
        >
          <FaBullhorn /> Announcements
        </Link>
        <Link 
          to="/trainer/profile" 
          className={`nav-item ${isActive('/trainer/profile') ? 'active' : ''}`}
        >
          <FaUserCog /> Profile
        </Link>
        
        <button onClick={handleLogout} className="nav-item logout-btn">
          <FaSignOutAlt /> Logout
        </button>
      </nav>
    </div>
  );
};

export default TrainerSidebar; 