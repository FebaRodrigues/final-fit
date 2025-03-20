// src/components/Admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminProfile, updateAdminProfile, manageUsers, getAllTrainersAdmin, getWorkoutProgramsAdmin, getAnalyticsAdmin } from '../../api';
import "../../styles/AdminStyle.css";
import UserManagement from './UserManagement';
import TrainerManagement from './TrainerManagement';
import ContentManagement from './ContentManagement';
import SubscriptionManagement from './SubscriptionManagement';
import AnalyticsReporting from './AnalyticsReporting';
import Announcements from './AdminAnnouncements';
import AdminSettings from './AdminSettings';
import SpaManagement from './SpaManagement';
import { FaUsers, FaDumbbell, FaChartBar, FaMoneyBillWave, FaUserTie, FaCog, FaUpload, FaBullhorn, FaSpa, FaRupeeSign, FaUserPlus } from 'react-icons/fa';
import axios from 'axios';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [libraryPrograms, setLibraryPrograms] = useState([]);
  const [newProgram, setNewProgram] = useState({
    title: "",
    description: "",
    category: "Strength",
    exercises: [{ name: "", sets: "", reps: "" }],
    isLibraryPlan: true,
  });
  const [adminProfile, setAdminProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', image: '' });
  const [imagePreview, setImagePreview] = useState('');
  const [stats, setStats] = useState({
    users: 0,
    trainers: 0,
    workoutPrograms: 0,
    revenue: 0,
    spaServices: 0
  });
  const [adminAuthChecked, setAdminAuthChecked] = useState(false);
  const [adminAuthValid, setAdminAuthValid] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if token and role exist before making API calls
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        const adminUser = localStorage.getItem('adminUser');
        
        console.log('AdminDashboard - Authentication check:', { 
          hasToken: !!token, 
          role, 
          hasAdminUser: !!adminUser,
          tokenPrefix: token ? token.substring(0, 10) + '...' : 'No token'
        });
        
        if (!token) {
          console.error('No token found in AdminDashboard');
          setError('Authentication required. Please log in again.');
          setTimeout(() => {
            navigate('/admin/login');
          }, 1000);
          return;
        }
        
        if (role !== 'admin') {
          console.error('Not admin role in AdminDashboard');
          setError('You do not have permission to access this page.');
          setTimeout(() => {
            navigate('/admin/login');
          }, 1000);
          return;
        }
        
        // Check if the server is reachable before making requests
        try {
          // Make a simple HEAD request to check server connectivity
          await axios.get(`${import.meta.env.VITE_API_URL.replace(/\/api$/, '')}/api/health`, { timeout: 5000 });
        } catch (connectionError) {
          console.error('Server connectivity check failed:', connectionError);
          setError('Cannot connect to the server. Please check if the server is running on port 5050 and try again. Make sure the API server is accessible.');
          setLoading(false);
          return;
        }
        
        console.log('AdminDashboard - Fetching admin profile');
        const profileResponse = await getAdminProfile();
        console.log('AdminDashboard - Admin profile fetched successfully');
        
        // Add a timestamp to the image URL to prevent caching
        const adminData = profileResponse.data;
        if (adminData.image) {
          const timestamp = new Date().getTime();
          adminData.image = adminData.image.includes('?') 
            ? `${adminData.image.split('?')[0]}?t=${timestamp}` 
            : `${adminData.image}?t=${timestamp}`;
        }
        
        setAdminProfile(adminData);
        setFormData({ 
          name: adminData.name, 
          email: adminData.email, 
          image: adminData.image 
        });
        setImagePreview(adminData.image);
        
        // Update the adminUser in localStorage with the latest profile data
        const storedAdminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        const updatedAdminUser = {
          ...storedAdminUser,
          name: adminData.name,
          email: adminData.email,
          image: adminData.image
        };
        localStorage.setItem('adminUser', JSON.stringify(updatedAdminUser));
        console.log('Updated adminUser in localStorage with latest profile data');

        // Fetch quick stats for the overview
        console.log('AdminDashboard - Fetching users');
        const usersResponse = await manageUsers();
        console.log('AdminDashboard - Users fetched successfully:', usersResponse.data.length);
        
        console.log('AdminDashboard - Fetching trainers');
        const trainersResponse = await getAllTrainersAdmin();
        console.log('AdminDashboard - Trainers fetched successfully:', trainersResponse.data.length);
        
        console.log('AdminDashboard - Fetching workout programs');
        const programsResponse = await getWorkoutProgramsAdmin();
        console.log('AdminDashboard - Workout programs fetched successfully:', programsResponse.data.length);
        
        // Try to get analytics data, but don't fail if it's not available
        let analyticsData = { finance: { totalRevenue: 0 } };
        try {
          console.log('AdminDashboard - Fetching analytics');
          const analyticsResponse = await getAnalyticsAdmin();
          analyticsData = analyticsResponse.data;
          console.log('AdminDashboard - Analytics fetched successfully');
        } catch (analyticsError) {
          console.warn('Could not fetch analytics data:', analyticsError);
        }
        
        // Try to get spa services data, but don't fail if it's not available
        let spaServicesCount = 0;
        try {
          console.log('AdminDashboard - Fetching spa services');
          const spaResponse = await axios.get(`${import.meta.env.VITE_API_URL}/spa/services`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          spaServicesCount = spaResponse.data.length;
          console.log('AdminDashboard - Spa services fetched successfully:', spaServicesCount);
        } catch (spaError) {
          console.warn('Could not fetch spa services data:', spaError);
        }
        
        setStats({
          users: usersResponse.data.length,
          trainers: trainersResponse.data.length,
          workoutPrograms: programsResponse.data.length,
          revenue: analyticsData.finance ? parseFloat(analyticsData.finance.totalRevenue) : 0,
          spaServices: spaServicesCount
        });

        setLibraryPrograms(programsResponse.data);
      } catch (error) {
        console.error('Error fetching data in AdminDashboard:', error);
        
        let errorMessage = 'Error fetching data: ';
        if (error.response) {
          errorMessage += error.response.data.message || error.response.statusText;
          
          // If there's an authentication error, redirect to login
          if (error.response.status === 401 || error.response.status === 403) {
            console.warn('Authentication error in AdminDashboard, redirecting to login');
            setTimeout(() => {
              navigate('/admin/login');
            }, 1000);
          }
        } else if (error.request) {
          errorMessage += 'No response from server';
        } else {
          errorMessage += error.message;
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const handleProgramChange = (e, index) => {
    const { name, value } = e.target;
    if (name === "title" || name === "description" || name === "category") {
      setNewProgram({ ...newProgram, [name]: value });
    } else {
      const updatedExercises = [...newProgram.exercises];
      updatedExercises[index][name] = value;
      setNewProgram({ ...newProgram, exercises: updatedExercises });
    }
  };

  const addExercise = () => {
    setNewProgram({
      ...newProgram,
      exercises: [...newProgram.exercises, { name: "", sets: "", reps: "" }],
    });
  };

  const handleCreateLibraryProgram = async (e) => {
    e.preventDefault();
    try {
      // This would need to be implemented in the API
      // For now, we'll just update the UI
      const mockResponse = {
        data: {
          program: {
            ...newProgram,
            _id: Date.now().toString(), // Mock ID
            createdAt: new Date().toISOString()
          }
        }
      };
      setLibraryPrograms([...libraryPrograms, mockResponse.data.program]);
      setNewProgram({
        title: "",
        description: "",
        category: "Strength",
        exercises: [{ name: "", sets: "", reps: "" }],
        isLibraryPlan: true,
      });
      alert("Library workout program created successfully!");
    } catch (error) {
      console.error('Error creating library program:', error);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size - limit to 1MB
      if (file.size > 1024 * 1024) {
        alert('Image size should be less than 1MB. Please choose a smaller image.');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result;
        console.log('Image loaded, size:', imageData.length);
        setImagePreview(imageData);
        setFormData(prevData => ({ ...prevData, image: imageData }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      console.log('Updating profile with data:', { 
        name: formData.name, 
        email: formData.email, 
        imageSize: formData.image ? formData.image.length : 0 
      });
      
      // Check if the server is reachable before making the request
      try {
        // Make a simple HEAD request to check server connectivity
        await axios.get(`${import.meta.env.VITE_API_URL.replace(/\/api$/, '')}/api/health`, { timeout: 5000 });
      } catch (connectionError) {
        console.error('Server connectivity check failed:', connectionError);
        alert('Cannot connect to the server. Please check if the server is running on port 5050 and try again. Make sure the API server is accessible.');
        return;
      }
      
      const response = await updateAdminProfile(formData);
      console.log('Profile update response:', response.data);
      
      // Update the admin profile in state
      setAdminProfile(response.data.admin);
      
      // Force refresh the image in the sidebar by adding a timestamp
      const updatedImage = response.data.admin.image;
      if (updatedImage) {
        const timestamp = new Date().getTime();
        const imageWithTimestamp = updatedImage.includes('?') 
          ? `${updatedImage.split('?')[0]}?t=${timestamp}` 
          : `${updatedImage}?t=${timestamp}`;
          
        // Update the admin profile with the timestamped image
        setAdminProfile(prev => ({
          ...prev,
          image: imageWithTimestamp
        }));
      }
      
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      
      let errorMessage = 'Error updating profile: ';
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage += error.response.data.message || error.response.data.error || error.message || 'Server error';
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage += 'No response from server. Please check your network connection and make sure the API server is running on port 5050.';
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage += error.message || 'Unknown error';
      }
      
      setError(errorMessage);
      alert(errorMessage);
    }
  };

  const AddAdmin = () => {
    navigate("/admin/register");
  };

  const checkAdminAuth = async () => {
    try {
      // Make a simple API call to check if the admin token is valid
      await getAdminProfile();
      return true;
    } catch (error) {
      console.error('Admin authentication check failed:', error);
      return false;
    }
  };

  useEffect(() => {
    if (activeSection === 'users' && !adminAuthChecked) {
      const checkAuth = async () => {
        const isValid = await checkAdminAuth();
        setAdminAuthChecked(true);
        setAdminAuthValid(isValid);
      };
      checkAuth();
    }
  }, [activeSection, adminAuthChecked]);

  if (loading) return <div className="loading-container">Loading...</div>;
  if (error) return <div className="error-container">{error}</div>;

  return (
    <div className="admin-dashboard-content">
      <h1 className="admin-dashboard-title">Admin Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="stats-cards">
        {/* Users Card */}
        <div className="stat-card">
          <div className="stat-icon user-icon">
            <FaUsers />
          </div>
          <div className="stat-info">
            <h3>Users</h3>
            <p className="stat-number">{stats.users}</p>
          </div>
        </div>
        
        {/* Trainers Card */}
        <div className="stat-card">
          <div className="stat-icon trainer-icon">
            <FaUserTie />
          </div>
          <div className="stat-info">
            <h3>Trainers</h3>
            <p className="stat-number">{stats.trainers}</p>
          </div>
        </div>
        
        {/* Programs Card */}
        <div className="stat-card">
          <div className="stat-icon program-icon">
            <FaDumbbell />
          </div>
          <div className="stat-info">
            <h3>Programs</h3>
            <p className="stat-number">{stats.workoutPrograms}</p>
          </div>
        </div>
        
        {/* Spa Services Card */}
        <div className="stat-card">
          <div className="stat-icon spa-icon">
            <FaSpa />
          </div>
          <div className="stat-info">
            <h3>Spa Services</h3>
            <p className="stat-number">{stats.spaServices}</p>
          </div>
        </div>
        
        {/* Revenue Card */}
        <div className="stat-card">
          <div className="stat-icon revenue-icon">
            <FaMoneyBillWave />
          </div>
          <div className="stat-info">
            <h3>Revenue</h3>
            <p className="stat-number">{formatCurrency(stats.revenue)}</p>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions">
          <Link to="/admin/users" className="action-button">
            <FaUsers /> MANAGE USERS
          </Link>
          <Link to="/admin/trainers" className="action-button">
            <FaUserTie /> MANAGE TRAINERS
          </Link>
          <Link to="/admin/content" className="action-button">
            <FaDumbbell /> MANAGE CONTENT
          </Link>
          <Link to="/admin/analytics" className="action-button">
            <FaChartBar /> VIEW ANALYTICS
          </Link>
          <Link to="/admin/spa" className="action-button">
            <FaSpa /> MANAGE SPA
          </Link>
          <Link to="/admin/add-admin" className="action-button">
            <FaUserPlus /> ADD ADMIN
          </Link>
        </div>
      </div>
      
      {/* Other dashboard content */}
    </div>
  );
};

export default AdminDashboard;