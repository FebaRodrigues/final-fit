//src/components/Navbar.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationIcon from "./NotificationIcon";
import "../styles/Navbar.css"; 
import "../styles/TracFitLogo.css";

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

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
        navigate('/');
        setIsOpen(false);
    };

    const closeMenu = () => {
        setIsOpen(false);
        setDropdownOpen(false);
        setLoginDropdownOpen(false);
    };

    const isActive = (path) => {
        return location.pathname === path ? "active" : "";
    };

    return (
        <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
            {/* Logo */}
            <div className="logo">
                <Link to="/" className="tracfit-logo">
                    <span className="track-part">Track</span><span className="fit-part">Fit</span>
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
                <li><Link to="/" onClick={closeMenu} className={isActive("/")}>Home</Link></li>
                <li><Link to="/about" onClick={closeMenu} className={isActive("/about")}>About</Link></li>
                
                {isOpen && user && (
                    <div className="user-actions">
                        <Link to="/user/dashboard" onClick={closeMenu}>Dashboard</Link>
                        <Link to="/user/workout-log" onClick={closeMenu}>Workout Log</Link>
                        <Link to="/user/goals" onClick={closeMenu}>Goals</Link>
                        <Link to="/user/membership" onClick={closeMenu}>Membership</Link>
                        <Link to="/user/spa" onClick={closeMenu}>SPA Services</Link>
                        <Link to="/user/notifications" onClick={closeMenu}>Notifications</Link>
                        <button onClick={handleLogout} className="logout-btn">Logout</button>
                    </div>
                )}
                
                {isOpen && !user && (
                    <div className="auth-buttons mobile">
                        <div className="login-options">
                            <h4>User</h4>
                            <Link to="/users/login" onClick={closeMenu} className="login-btn">User Sign In</Link>
                            <Link to="/users/register" onClick={closeMenu} className="signup-btn">User Sign Up</Link>
                            
                            <h4>Trainer</h4>
                            <Link to="/trainers/login" onClick={closeMenu} className="login-btn">Trainer Sign In</Link>
                            <Link to="/trainers/register" onClick={closeMenu} className="signup-btn">Trainer Sign Up</Link>
                        </div>
                    </div>
                )}
            </ul>
            
            {/* Sign Up / User Actions */}
            {!isOpen && (
                user ? (
                    <div className="user-actions">
                        {/* Notification Icon */}
                        <NotificationIcon />
                        
                        <div className="dropdown">
                            <button 
                                className="dropdown-toggle" 
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                            >
                                My Account
                            </button>
                            <ul className={`dropdown-menu ${dropdownOpen ? 'show' : ''}`}>
                                <li><Link to="/user/dashboard" onClick={closeMenu}>Dashboard</Link></li>
                                <li><Link to="/user/workout-log" onClick={closeMenu}>Workout Log</Link></li>
                                <li><Link to="/user/goals" onClick={closeMenu}>Goals</Link></li>
                                <li><Link to="/user/membership" onClick={closeMenu}>Membership</Link></li>
                                <li><Link to="/user/spa" onClick={closeMenu}>SPA Services</Link></li>
                                <li><Link to="/user/notifications" onClick={closeMenu}>Notifications</Link></li>
                                <li><button onClick={handleLogout} className="logout-btn">Logout</button></li>
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="auth-buttons desktop">
                        <div className="dropdown">
                            <button 
                                className="dropdown-toggle login-btn" 
                                onClick={() => setLoginDropdownOpen(!loginDropdownOpen)}
                            >
                                Sign In / Sign Up
                            </button>
                            <ul className={`dropdown-menu ${loginDropdownOpen ? 'show' : ''}`}>
                                <li className="dropdown-header">User</li>
                                <li><Link to="/users/login" onClick={closeMenu}>User Sign In</Link></li>
                                <li><Link to="/users/register" onClick={closeMenu}>User Sign Up</Link></li>
                                <li className="dropdown-divider"></li>
                                <li className="dropdown-header">Trainer</li>
                                <li><Link to="/trainers/login" onClick={closeMenu}>Trainer Sign In</Link></li>
                                <li><Link to="/trainers/register" onClick={closeMenu}>Trainer Sign Up</Link></li>
                            </ul>
                        </div>
                    </div>
                )
            )}
        </nav>
    );
};

export default Navbar;
