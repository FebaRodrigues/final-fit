//src/components/Footer.jsx
import React, { memo } from "react";
import { Link } from "react-router-dom";
import "../styles/Footer.css";
import "../styles/Home.css"; // Import Home.css for global footer styles
import "../styles/TracFitLogo.css"; // Import TrackFit logo styles

// Optimize the Footer component with memo to prevent unnecessary re-renders
const Footer = memo(() => {
    const currentYear = new Date().getFullYear();
    
    return (
        <footer className="footer">
            {/* Global footer with trademark that will appear on all pages */}
            <div className="global-footer">
                <p>&copy; {currentYear} <span className="trackfit-text"><span className="track-part">Track</span><span className="fit-part">Fit</span></span> <span className="trademark">™</span>. All Rights Reserved.</p>
                <div className="footer-bottom-links">
                    <Link to="/privacy-policy">Privacy Policy</Link>
                    <Link to="/terms-of-service">Terms of Service</Link>
                    <Link to="/cookie-policy">Cookie Policy</Link>
                </div>
            </div>
        </footer>
    );
});

// Add display name for debugging
Footer.displayName = 'Footer';

export default Footer;
