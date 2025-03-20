// components/Navbar/TrainerNav.jsx
import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import '../../styles/TrainerNav.css';
import '../../styles/TracFitLogo.css';
import { 
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  FitnessCenter as FitnessCenterIcon,
  Flag as FlagIcon,
  Assessment as AssessmentIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
  Menu as MenuIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const TrainerNavbar = () => {
  const { logout, trainer } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setSidebarOpen(false);
  };

  // Check if the current path matches the link
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="trainer-mobile-toggle">
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
        <div className="mobile-logo tracfit-logo">
          <span className="track-part">Track</span>
          <span className="fit-part">Fit</span>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`trainer-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/trainer/dashboard" className="sidebar-logo tracfit-logo">
            <span className="track-part">Track</span>
            <span className="fit-part">Fit</span>
          </Link>
        </div>

        <div className="trainer-profile-section">
          {trainer && (
            <>
              <div className="trainer-avatar">
                {trainer.image ? (
                  <img src={trainer.image} alt={trainer.name} />
                ) : (
                  <div className="avatar-placeholder">{trainer.name.charAt(0)}</div>
                )}
              </div>
              <div className="trainer-info">
                <h3>{trainer.name}</h3>
                <p>{trainer.specialties?.join(', ') || 'Fitness Trainer'}</p>
              </div>
            </>
          )}
        </div>

        <ul className="sidebar-nav">
          <li className={isActive('/trainer/dashboard') ? 'active' : ''}>
            <Link to="/trainer/dashboard">
              <DashboardIcon />
              <span>Dashboard</span>
            </Link>
          </li>
          <li className={isActive('/trainer/clients') ? 'active' : ''}>
            <Link to="/trainer/clients">
              <PeopleIcon />
              <span>Client Management</span>
            </Link>
          </li>
          <li className={isActive('/trainer/workout-plans') ? 'active' : ''}>
            <Link to="/trainer/workout-plans">
              <FitnessCenterIcon />
              <span>Workout Plans</span>
            </Link>
          </li>
          <li className={isActive('/trainer/goals') ? 'active' : ''}>
            <Link to="/trainer/goals">
              <FlagIcon />
              <span>Goal Management</span>
            </Link>
          </li>
          <li className={isActive('/trainer/progress-reports') ? 'active' : ''}>
            <Link to="/trainer/progress-reports">
              <AssessmentIcon />
              <span>Progress Reports</span>
            </Link>
          </li>
          <li className={isActive('/trainer/notifications') ? 'active' : ''}>
            <Link to="/trainer/notifications">
              <NotificationsIcon />
              <span>Notifications</span>
            </Link>
          </li>
          {trainer && (
            <li className={isActive(`/trainers/profile/${trainer._id || trainer.id}`) ? 'active' : ''}>
              <Link to={`/trainers/profile/${trainer._id || trainer.id}`}>
                <PersonIcon />
                <span>My Profile</span>
              </Link>
            </li>
          )}
        </ul>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogoutIcon />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} 
        onClick={() => setSidebarOpen(false)}
      ></div>
    </>
  );
};

export default TrainerNavbar;