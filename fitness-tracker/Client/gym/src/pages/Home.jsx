import React from "react";
import { Link } from "react-router-dom";
import "../styles/Home.css";
import "../styles/TracFitLogo.css";

const Home = () => {
    return (
        <div className="home-container">
            <div className="hero">
                <div className="hero-text">
                    <h1>Welcome to <span className="trackfit-text"><span className="track-part">Track</span><span className="fit-part">Fit</span></span></h1>
                    <p>Your complete fitness management solution</p>
                </div>
                
                <div className="footer-cta">
                    <h2>Ready to start your fitness journey?</h2>
                    <p>Join thousands of members who have transformed their lives with <span className="trackfit-text"><span className="track-part">Track</span><span className="fit-part">Fit</span></span></p>
                    <div className="cta-buttons">
                        <Link to="/users/register" className="btn btn-primary">Sign Up Now</Link>
                        <Link to="/about" className="btn btn-outline">Learn More</Link>
                    </div>
                </div>
                
                <div className="home-footer">
                    <p>&copy; {new Date().getFullYear()} <span className="trackfit-text"><span className="track-part">Track</span><span className="fit-part">Fit</span></span> <span className="trademark">™</span>. All Rights Reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default Home;
