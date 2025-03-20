// src/components/Admin/AdminRegister.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerAdmin, sendAdminRegistrationOTP, verifyAdminRegistrationOTP } from '../../api';
import '../../styles/AdminStyle.css';
import { FiMail, FiLock, FiUser, FiCheck, FiLoader, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const AdminRegister = () => {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Registration
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [otpExpiry, setOtpExpiry] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    
    const navigate = useNavigate();
    const timerRef = useRef(null);
    const { tokenValid, checkTokenValidity } = useAuth();
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

    useEffect(() => {
        // Check if user is logged in as admin
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        
        if (token && role === 'admin' && checkTokenValidity()) {
            setIsAdminLoggedIn(true);
        } else {
            setIsAdminLoggedIn(false);
            setError('You must be logged in as an admin to register new admins');
        }
        
        // Clean up timer on component unmount
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [checkTokenValidity]);

    useEffect(() => {
        // Update countdown timer
        if (otpExpiry) {
            const updateTimer = () => {
                const now = new Date();
                const expiryTime = new Date(otpExpiry);
                const diff = Math.max(0, Math.floor((expiryTime - now) / 1000));
                
                setTimeLeft(diff);
                
                if (diff <= 0) {
                    clearInterval(timerRef.current);
                    setOtpSent(false);
                }
            };
            
            updateTimer();
            timerRef.current = setInterval(updateTimer, 1000);
            
            return () => clearInterval(timerRef.current);
        }
    }, [otpExpiry]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleSendOTP = async () => {
        if (!email) {
            setError('Email is required');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await sendAdminRegistrationOTP(email);
            
            if (response.success) {
                setOtpSent(true);
                setSuccess('OTP sent successfully to your email. Please check your inbox.');
                setOtpExpiry(response.data.expiresAt);
                setStep(2);
            } else {
                setError(response.message);
            }
        } catch (err) {
            setError('Failed to send OTP. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp) {
            setError('OTP is required');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await verifyAdminRegistrationOTP(email, otp);
            
            if (response.success) {
                setOtpVerified(true);
                setSuccess('OTP verified successfully');
                setStep(3);
                
                // Clear the timer
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                }
            } else {
                setError(response.message);
            }
        } catch (err) {
            setError('Failed to verify OTP. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!name || !password) {
            setError('All fields are required');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await registerAdmin({ name, email, password });
            
            if (response.success) {
                setSuccess('Registration successful! Redirecting to login...');
                setTimeout(() => {
                    navigate('/admin/login');
                }, 2000);
            } else {
                setError(response.message);
            }
        } catch (err) {
            setError('Registration failed. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const renderEmailStep = () => {
        if (!isAdminLoggedIn) {
            return (
                <div className="admin-auth-error">
                    <FiAlertCircle size={48} />
                    <h2>Admin Authentication Required</h2>
                    <p>You must be logged in as an admin to register new admins.</p>
                    <button 
                        onClick={() => navigate('/admin/login')}
                        className="primary-button"
                    >
                        Go to Admin Login
                    </button>
                </div>
            );
        }
        
        return (
            <>
                <h2>Admin Registration</h2>
                <h3>Step 1: Enter New Admin Email</h3>
                
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}
                
                <div className="form-group">
                    <label htmlFor="email">Email Address for New Admin</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter email for new admin"
                        required
                    />
                </div>
                
                <div className="info-message">
                    <p>An OTP will be sent to your email to verify this request.</p>
                </div>
                
                <button 
                    onClick={handleSendOTP} 
                    disabled={loading || !email}
                >
                    {loading ? <FiLoader className="spinner" /> : <FiMail />} 
                    Send OTP to My Email
                </button>
                
                <div className="auth-links">
                    <Link to="/admin/dashboard">Back to Dashboard</Link>
                </div>
            </>
        );
    };

    const renderOTPStep = () => (
        <>
            <h2>Admin Registration</h2>
            <h3>Step 2: Verify OTP</h3>
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            {timeLeft > 0 && (
                <div className="otp-timer">
                    OTP expires in: {formatTime(timeLeft)}
                </div>
            )}
            
            <div className="form-group">
                <label htmlFor="otp">Enter OTP sent to your email</label>
                <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    required
                />
            </div>
            
            <div className="info-message">
                <p>The OTP has been sent to your email, not the new admin's email.</p>
            </div>
            
            <button 
                onClick={handleVerifyOTP} 
                disabled={loading || !otp || timeLeft === 0}
            >
                {loading ? <FiLoader className="spinner" /> : <FiCheck />} 
                Verify OTP
            </button>
            
            {timeLeft === 0 ? (
                <button 
                    onClick={handleSendOTP} 
                    className="secondary-button"
                    disabled={loading}
                >
                    Resend OTP
                </button>
            ) : (
                <button 
                    onClick={() => setStep(1)} 
                    className="link-button"
                >
                    Change Email
                </button>
            )}
        </>
    );

    const renderRegistrationStep = () => (
        <>
            <h2>Admin Registration</h2>
            <h3>Step 3: Complete Registration</h3>
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                />
            </div>
            
            <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    required
                />
            </div>
            
            <button 
                onClick={handleRegister} 
                disabled={loading || !name || !password}
            >
                {loading ? <FiLoader className="spinner" /> : <FiUser />} 
                Complete Registration
            </button>
        </>
    );

    return (
        <div className="admin-auth-container">
            <div className="admin-auth-form">
                {step === 1 && renderEmailStep()}
                {step === 2 && renderOTPStep()}
                {step === 3 && renderRegistrationStep()}
            </div>
        </div>
    );
};

export default AdminRegister;
