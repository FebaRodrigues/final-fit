import React, { useContext, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API, { updateUserWithImage } from '../../api';
import { AuthContext } from '../../context/AuthContext';
import '../../styles/EditProfile.css';
import { toast } from 'react-toastify';
import axios from 'axios';

// Helper function to add cache busting to image URLs
const addCacheBustingToUrl = (url) => {
    if (!url) return url;
    // First remove any existing cache busting parameter
    const baseUrl = url.split('?')[0];
    // Add a timestamp parameter to the URL to prevent caching
    return `${baseUrl}?t=${Date.now()}`;
};

// Cloudinary configuration
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'fitness_app_preset';
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'daacjyk3d';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

const EditProfile = () => {
    const { user, setUser, checkTokenValidity } = useContext(AuthContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        age: '',
        height: '',
        weight: '',
        gender: '',
        goals: [],
        image: null,
    });
    const [previewImage, setPreviewImage] = useState(null);
    const [newGoal, setNewGoal] = useState('');
    const dataFetchedRef = useRef(false);
    const userIdRef = useRef(user?.id);
    const formInitializedRef = useRef(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    // Log only on first render
    useEffect(() => {
        console.log("EditProfile - Initial render with user:", user?.id);
    }, []);

    useEffect(() => {
        // Check if user exists in context
        if (!user) {
            console.log("No user found in context, redirecting to login");
            navigate('/users/login');
            return;
        }
        
        // Skip if we've already processed this user
        if (dataFetchedRef.current && userIdRef.current === user.id && formInitializedRef.current) {
            console.log("EditProfile - Data already fetched and form initialized for this user, skipping");
            return;
        }
        
        console.log("EditProfile - User changed or component mounted");
        console.log("Current user in context:", user);
        
        // Only update form data if it hasn't been set yet
        if (!formInitializedRef.current) {
            console.log("EditProfile - Initializing form with user data");
            // Pre-populate form with user data from context
            setFormData({
                name: user.name || '',
                email: user.email || '',
                age: user.age?.toString() || '',
                height: user.height?.toString() || '',
                weight: user.weight?.toString() || '',
                gender: user.gender || '',
                goals: user.goals || [],
                image: null,
            });
            
            // Apply cache-busting to ensure we're showing the latest image
            if (user.image) {
                setPreviewImage(addCacheBustingToUrl(user.image));
            } else {
                setPreviewImage(null);
            }
            setLoading(false);
            formInitializedRef.current = true;
        }
        
        // Only fetch user data once per user
        if (!dataFetchedRef.current || userIdRef.current !== user.id) {
            console.log("EditProfile - Fetching data for user:", user.id);
            fetchUserData();
            dataFetchedRef.current = true;
            userIdRef.current = user.id;
        }
    }, [user?.id, navigate]); // Only depend on user.id and navigate
    
    // Separate function to fetch user data
    const fetchUserData = async () => {
        try {
            console.log("EditProfile - Fetching user profile data");
            
            // Check if token is valid before making the request
            const token = localStorage.getItem('token');
            if (!token) {
                console.log("No token found, using data from context");
                return;
            }
            
            // Make a direct API call with the token
            const response = await API.get('/users/profile');
            
            console.log("EditProfile - User profile response:", response.data);
            
            const userData = response.data;
            
            setFormData({
                name: userData.name || '',
                email: userData.email || '',
                age: userData.age?.toString() || '',
                height: userData.height?.toString() || '',
                weight: userData.weight?.toString() || '',
                gender: userData.gender || '',
                goals: userData.goals || [],
                image: null,
            });
            
            // Apply cache-busting to ensure we're showing the latest image
            if (userData.image) {
                setPreviewImage(addCacheBustingToUrl(userData.image));
            } else {
                setPreviewImage(null);
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            
            // Handle network errors gracefully
            if (error.code === 'ERR_NETWORK') {
                console.log("Network error - continuing with user data from context");
                toast.warning("Could not connect to server. Using locally stored profile data.");
                return;
            }
            
            // Check if it's an authentication error but don't redirect immediately
            if (error.response?.status === 401 || error.response?.status === 403) {
                console.log("Authentication error when fetching profile data");
                toast.warning("Session may have expired. Using locally stored profile data.");
                return;
            }
            
            // Just show an error toast but don't redirect
            toast.error(`Failed to load latest profile data: ${error.message || 'Unknown error'}`);
        }
    };

    useEffect(() => {
        // At component mount, clear any cached images that might be related to the profile
        const clearImageCache = () => {
            if ('caches' in window) {
                caches.keys().then(cacheNames => {
                    cacheNames.forEach(cacheName => {
                        console.log('Clearing cache:', cacheName);
                        caches.delete(cacheName);
                    });
                });
            }
        };
        
        clearImageCache();
    }, []);

    // Function to upload images to Cloudinary
    const uploadToCloudinary = async (file) => {
        try {
            // Check if Cloudinary is properly configured
            if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
                console.warn('Cloudinary not configured properly. Using direct upload fallback.');
                return null; // Return null to trigger fallback
            }
            
            setIsUploading(true);
            setUploadProgress(0);
            
            // Create form data for upload
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            
            // Add timestamp to prevent caching issues
            formData.append('timestamp', Math.round(new Date().getTime() / 1000));
            
            // Upload to Cloudinary with progress tracking
            const response = await axios.post(CLOUDINARY_UPLOAD_URL, formData, {
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                    console.log(`Upload progress: ${percentCompleted}%`);
                }
            });
            
            setIsUploading(false);
            
            // Log success for debugging
            console.log('Cloudinary upload successful:', response.data);
            
            // Return the secure URL of the uploaded image
            return response.data.secure_url;
        } catch (error) {
            console.error('Error uploading to Cloudinary:', error);
            setIsUploading(false);
            
            // Log error details but don't throw - let fallback handle it
            if (error.response) {
                console.error('Cloudinary server error:', error.response.data);
            }
            
            // Return null to trigger the fallback
            return null;
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check file size - limit to 5MB
            if (file.size > 5 * 1024 * 1024) {
                setError('Image size should be less than 5MB');
                toast.error('Image size should be less than 5MB');
                return;
            }
            
            // Check file type - only accept images
            const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
            if (!allowedMimeTypes.includes(file.type)) {
                setError('Please select a valid image file (JPEG, PNG or GIF)');
                toast.error('Please select a valid image file (JPEG, PNG or GIF)');
                return;
            }

            // Show loading state
            setLoading(true);
            setError(null);
            toast.info('Processing image...', { autoClose: false, toastId: 'image-processing' });

            try {
                // Try Cloudinary first - if it fails, fall back to direct upload
                let imageUrl = null;
                
                try {
                    // Attempt Cloudinary upload
                    setIsUploading(true);
                    imageUrl = await uploadToCloudinary(file);
                    setIsUploading(false);
                    console.log("Cloudinary upload result:", imageUrl);
                } catch (e) {
                    setIsUploading(false);
                    console.error("Cloudinary upload failed:", e);
                    // Will continue to direct upload fallback
                }
                
                if (imageUrl) {
                    // If Cloudinary upload succeeded, use the URL
                    setFormData(prevData => ({ 
                        ...prevData, 
                        image: null, 
                        imageUrl: imageUrl 
                    }));
                    setPreviewImage(imageUrl);
                    toast.update('image-processing', { 
                        render: 'Image uploaded to cloud storage!', 
                        type: toast.TYPE.SUCCESS,
                        autoClose: 3000 
                    });
                } else {
                    // If Cloudinary upload failed, use direct file upload
                    console.log("Using direct file upload as fallback");
                    setFormData(prevData => ({ 
                        ...prevData, 
                        image: file, 
                        imageUrl: null 
                    }));
                    
                    // Clean up any previous blob URLs to prevent memory leaks
                    if (previewImage && previewImage.startsWith('blob:')) {
                        URL.revokeObjectURL(previewImage);
                    }
                    
                    // Create a local URL for preview
                    const imageUrl = URL.createObjectURL(file);
                    setPreviewImage(imageUrl);
                    console.log("Image preview set to local blob URL:", imageUrl);
                    
                    toast.update('image-processing', { 
                        render: 'Image selected for direct upload', 
                        type: toast.TYPE.INFO,
                        autoClose: 3000 
                    });
                }
            } catch (error) {
                console.error("Error processing image:", error);
                toast.update('image-processing', { 
                    render: 'Error processing image: ' + (error.message || 'Unknown error'), 
                    type: toast.TYPE.ERROR,
                    autoClose: 3000 
                });
                setError('Error processing image: ' + (error.message || 'Unknown error'));
            } finally {
                setLoading(false);
            }
        }
    };

    const addGoal = () => {
        if (newGoal.trim()) {
            setFormData(prev => ({
                ...prev,
                goals: [...prev.goals, newGoal.trim()]
            }));
            setNewGoal('');
        }
    };

    const removeGoal = (index) => {
        setFormData(prev => ({
            ...prev,
            goals: prev.goals.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let updatedUser;
            const dataToUpdate = { ...formData };
            delete dataToUpdate.image; // Remove image from the JSON data

            // For image uploads through Cloudinary - if we have an imageUrl from Cloudinary
            if (formData.imageUrl) {
                console.log("Using Cloudinary URL for profile update:", formData.imageUrl);
                dataToUpdate.image = formData.imageUrl;
                
                try {
                    const response = await API.put(`/users/profile`, dataToUpdate);
                    updatedUser = response.data;
                    toast.success("Profile updated successfully!");
                } catch (error) {
                    console.error("Error updating profile with Cloudinary image:", error);
                    throw error;
                }
            }
            // For direct image uploads with FormData
            else if (formData.image) {
                console.log("Image selected, using multipart form data");
                
                const formDataToSend = new FormData();
                
                // Append basic fields
                formDataToSend.append('name', formData.name);
                formDataToSend.append('email', formData.email);
                formDataToSend.append('age', formData.age);
                formDataToSend.append('height', formData.height);
                formDataToSend.append('weight', formData.weight);
                formDataToSend.append('gender', formData.gender);
                
                // Handle array fields
                formData.goals.forEach(goal => {
                    formDataToSend.append('goals', goal);
                });
                
                // Append image
                formDataToSend.append('image', formData.image);
                
                // Show a loading toast since image uploads can take time
                const toastId = toast.info('Uploading image...', {
                    autoClose: false,
                    closeOnClick: false,
                    draggable: false,
                });
                
                console.log("Sending API request with image upload");
                try {
                    const response = await updateUserWithImage(formDataToSend);
                    updatedUser = response.data;
                    toast.update(toastId, {
                        render: "Profile updated successfully!",
                        type: toast.TYPE.SUCCESS,
                        autoClose: 3000,
                    });
                } catch (error) {
                    toast.update(toastId, {
                        render: "Error updating profile. Please try again.",
                        type: toast.TYPE.ERROR,
                        autoClose: 3000,
                    });
                    
                    console.log("Error during image upload");
                    throw error;
                }
                
                // Clean up any blob URLs
                if (previewImage && previewImage.startsWith('blob:')) {
                    URL.revokeObjectURL(previewImage);
                }
            } else {
                // For regular updates without image, use the direct field update endpoint
                console.log("No image selected, using direct field update");
                
                try {
                    const response = await API.put(`/users/profile`, dataToUpdate);
                    updatedUser = response.data;
                    toast.success("Profile updated successfully!");
                } catch (error) {
                    console.error("Error updating profile without image:", error);
                    throw error;
                }
            }

            console.log("Update successful, user data:", updatedUser);
            
            // Update the user context
            if (updatedUser && setUser) {
                // Get the updated image URL with cache busting
                const updatedImageUrl = updatedUser.image ? addCacheBustingToUrl(updatedUser.image) : updatedUser.image;
                
                // Use the updated user and add any additional fields we need
                setUser({
                    ...user,
                    ...updatedUser,
                    image: updatedImageUrl
                });
                
                // Also update in localStorage to persist across reloads
                const jsonUser = JSON.parse(localStorage.getItem('user') || '{}');
                localStorage.setItem('user', JSON.stringify({
                    ...jsonUser,
                    ...updatedUser,
                    image: updatedImageUrl
                }));
            }
            
            // Wait a moment to ensure state updates have propagated
            setTimeout(() => {
                navigate('/user/dashboard');
            }, 500);
            
        } catch (error) {
            console.error("Error in profile update:", error);
            if (error.response) {
                setError(`Error updating profile: ${error.response.data.message || error.response.data.error || 'Unknown error'}`);
                toast.error(`Error updating profile: ${error.response.data.message || error.response.data.error || 'Unknown error'}`);
            } else {
                setError(`Error updating profile: ${error.message || 'Unknown error'}`);
                toast.error(`Error updating profile: ${error.message || 'Unknown error'}`);
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading && !user) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading profile data...</p>
            </div>
        );
    }

    return (
        <div className="edit-profile-container">
            <h2>Edit Profile</h2>
            
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleSubmit} className="edit-profile-form">
                <div className="profile-image-section">
                    <div className="profile-image-container">
                        {loading ? (
                            <div className="image-loading">
                                <div className="spinner"></div>
                                <p>Loading image...</p>
                            </div>
                        ) : isUploading ? (
                            <div className="image-loading">
                                <div className="spinner"></div>
                                <p>Uploading to Cloudinary: {uploadProgress}%</p>
                            </div>
                        ) : (
                            <img 
                                src={previewImage || 'https://res.cloudinary.com/daacjyk3d/image/upload/v1740376690/fitnessApp/gfo0vamcfcurte2gc4jk.jpg'} 
                                alt="Profile" 
                                className="profile-image" 
                                key={`${refreshKey}-${previewImage}`} // Add key to force re-render when the URL changes
                                onError={(e) => {
                                    console.error("Image failed to load:", e);
                                    e.target.src = 'https://res.cloudinary.com/daacjyk3d/image/upload/v1740376690/fitnessApp/gfo0vamcfcurte2gc4jk.jpg';
                                }}
                            />
                        )}
                    </div>
                    <div className="image-upload">
                        <label htmlFor="image">Change Profile Picture</label>
                        <input 
                            type="file" 
                            id="image" 
                            name="image" 
                            accept="image/*" 
                            onChange={handleImageChange} 
                            disabled={loading || isUploading}
                        />
                        <div className="image-info">
                            <small>Max size: 5MB. Accepted formats: JPEG, PNG, GIF</small>
                        </div>
                        {previewImage && previewImage.includes('cloudinary.com') && (
                            <div className="upload-success">
                                <small>✓ Image stored in cloud storage</small>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input 
                        type="text" 
                        id="name" 
                        name="name" 
                        value={formData.name} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input 
                        type="email" 
                        id="email" 
                        name="email" 
                        value={formData.email} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="age">Age</label>
                        <input 
                            type="number" 
                            id="age" 
                            name="age" 
                            value={formData.age} 
                            onChange={handleChange} 
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="gender">Gender</label>
                        <select 
                            id="gender" 
                            name="gender" 
                            value={formData.gender} 
                            onChange={handleChange}
                        >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                            <option value="prefer-not-to-say">Prefer not to say</option>
                        </select>
                    </div>
                </div>
                
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="height">Height (cm)</label>
                        <input 
                            type="number" 
                            id="height" 
                            name="height" 
                            value={formData.height} 
                            onChange={handleChange} 
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="weight">Weight (kg)</label>
                        <input 
                            type="number" 
                            id="weight" 
                            name="weight" 
                            value={formData.weight} 
                            onChange={handleChange} 
                        />
                    </div>
                </div>
                
                <div className="form-group">
                    <label>Fitness Goals</label>
                    <div className="goals-input">
                        <input 
                            type="text" 
                            value={newGoal} 
                            onChange={(e) => setNewGoal(e.target.value)} 
                            placeholder="Add a new goal" 
                        />
                        <button type="button" onClick={addGoal}>Add</button>
                    </div>
                    
                    <div className="goals-list">
                        {formData.goals.map((goal, index) => (
                            <div key={index} className="goal-item">
                                <span>{goal}</span>
                                <button type="button" onClick={() => removeGoal(index)}>Remove</button>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="form-actions">
                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'Updating...' : 'Update Profile'}
                    </button>
                    <button 
                        type="button" 
                        className="cancel-btn" 
                        onClick={() => navigate('/user/dashboard')}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditProfile; 