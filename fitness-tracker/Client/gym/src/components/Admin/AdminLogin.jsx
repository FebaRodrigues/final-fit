// src/components/Admin/AdminLogin.jsx
import React, { useState, useEffect } from 'react';
import API, { loginAdmin } from '../../api';
import { useNavigate } from 'react-router-dom';
import styles from './AdminLogin.module.css';
import { useAuth } from '../../context/AuthContext';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login, tokenValid, checkTokenValidity } = useAuth();

    // Check if admin is already logged in
    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        
        if (token && role === 'admin' && tokenValid) {
            console.log('Admin already logged in, redirecting to dashboard');
            navigate('/admin/dashboard');
        }
    }, [navigate, tokenValid]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            console.log('Attempting admin login with:', { email });
            const response = await loginAdmin({ email, password });
            console.log('Admin login response:', response);
            
            if (response && response.token) {
                // Store token and role in localStorage
                localStorage.setItem('token', response.token);
                localStorage.setItem('role', 'admin');
                
                // Create admin user object with necessary data
                const adminUser = {
                    _id: response.admin?._id || 'admin-id',
                    name: response.admin?.name || 'Admin User',
                    email: email,
                    role: 'admin',
                    isAdmin: true,
                    image: response.admin?.image || ''
                };
                
                console.log('Setting admin user in context and localStorage:', adminUser);
                
                // Store admin user in localStorage
                localStorage.setItem('adminUser', JSON.stringify(adminUser));
                
                // Use the login function from context to update auth state
                login(adminUser);
                
                // Add a small delay to ensure context is updated
                setTimeout(() => {
                    console.log('Checking token validity before redirect');
                    const isValid = checkTokenValidity();
                    console.log('Token validity before redirect:', isValid);
                    
                    // Double-check that everything is set correctly
                    const storedToken = localStorage.getItem('token');
                    const storedRole = localStorage.getItem('role');
                    const storedAdminUser = localStorage.getItem('adminUser');
                    
                    console.log('Final localStorage check:', {
                        hasToken: !!storedToken,
                        role: storedRole,
                        hasAdminUser: !!storedAdminUser
                    });
                    
                    if (isValid) {
                        console.log('Redirecting to admin dashboard');
                        navigate('/admin/dashboard');
                    } else {
                        setError('Authentication failed. Please try again.');
                    }
                }, 500);
            } else {
                setError('Invalid response from server');
            }
        } catch (err) {
            console.error('Admin login error:', err);
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.loginContainer}>
            <h2>Admin Login</h2>
            {error && <div className={styles.error}>{error}</div>}
            <form onSubmit={handleLogin}>
                <div className={styles.formGroup}>
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </div>
    );
};

export default AdminLogin;
