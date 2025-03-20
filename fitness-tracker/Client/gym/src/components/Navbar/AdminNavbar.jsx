// src/components/Navbar/AdminNavbar.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/AdminNav.css"; // Create this CSS file
import "../../styles/TracFitLogo.css";

const AdminNavbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

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
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/admin/login");
    setMenuOpen(false);
  };

  return (
    <nav className={`admin-navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="logo">
          <Link to="/admin/dashboard" className="tracfit-logo">
            <span className="track-part">Track</span>
            <span className="fit-part">Fit</span>
            <span className="admin-text"> Admin</span>
          </Link>
        </div>
        <div className={`hamburger ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(!menuOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <ul className={`nav-links ${menuOpen ? "active" : ""}`}>
          <li><Link to="/admin/dashboard">Dashboard</Link></li>
          <li><Link to="/admin/trainers">Trainer Approval</Link></li>
          <li><Link to="/admin/membership">Membership</Link></li>
          <li><Link to="/admin/payments">Payments</Link></li>
          <li><Link to="/admin/announcements">Announcements</Link></li>
          <li>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default AdminNavbar;