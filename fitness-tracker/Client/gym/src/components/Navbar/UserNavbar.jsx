// src/components/Navbar/UserNavbar.jsx
import React, { useState, useContext, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "../../styles/UserNavbar.css";
import "../../styles/TracFitLogo.css";

export const UserNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, membership } = useContext(AuthContext);
  const userPlan = membership?.status === 'Active' ? membership.planType : "None";
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Add scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    // Clean up
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsOpen(false);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <nav className={`user-navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="logo">
          <Link to="/user/dashboard" className="tracfit-logo">
            <span className="track-part">Track</span>
            <span className="fit-part">Fit</span>
          </Link>
        </div>
        
        {/* Hamburger Menu */}
        <div className={`hamburger ${isOpen ? "open" : ""}`} onClick={() => setIsOpen(!isOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </div>
        
        {/* Navigation Links */}
        <ul className={`nav-links ${isOpen ? "active" : ""}`}>
          <li><Link to="/user/dashboard" onClick={closeMenu} className={location.pathname === '/user/dashboard' ? 'active' : ''}>Dashboard</Link></li>
          <li><Link to="/user/profile" onClick={closeMenu} className={location.pathname === '/user/profile' ? 'active' : ''}>Profile</Link></li>
          
          {userPlan !== "None" && (
            <li><Link to="/user/workout-log" onClick={closeMenu} className={location.pathname.includes('/user/workout') ? 'active' : ''}>Workouts</Link></li>
          )}
          
          {(userPlan === "Premium" || userPlan === "Elite") && 
            <li><Link to="/user/goals" onClick={closeMenu} className={location.pathname === '/user/goals' ? 'active' : ''}>Goals</Link></li>
          }
          
          {userPlan === "Elite" && 
            <li><Link to="/user/appointments" onClick={closeMenu} className={location.pathname === '/user/appointments' ? 'active' : ''}>Appointments</Link></li>
          }
          
          {userPlan !== "None" && 
            <li><Link to="/user/spa" onClick={closeMenu} className={location.pathname === '/user/spa' ? 'active' : ''}>SPA Services</Link></li>
          }
          
          <li><Link to="/user/payments" onClick={closeMenu} className={location.pathname === '/user/payments' ? 'active' : ''}>Membership</Link></li>
          
          <li className="membership-plan">
            {userPlan === "None" ? "No Active Plan" : `${userPlan} Plan`}
          </li>
          
          <li>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default UserNavbar;