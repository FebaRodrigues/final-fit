// components/UserDashboard/UserProfile.jsx
import React, { useEffect, useState, useRef } from 'react';
import API, { updateUserFields } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';

// Handle formatting image URLs for consistent display
const formatImageUrl = (imageUrl) => {
    if (!imageUrl) return '';
    
    // Add cache-busting parameter if needed
    if (imageUrl.includes('cloudinary.com')) {
        return `${imageUrl}?t=${new Date().getTime()}`;
    }
    
    return imageUrl;
};

const UserProfile = () => {
    const { user, setUser } = useAuth();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        age: '',
        height: '',
        weight: '',
        gender: '',
        image: null,
    });
    const [previewImage, setPreviewImage] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const dataFetchedRef = useRef(false);
    const userIdRef = useRef(user?.id);

    // Log only on first render
    useEffect(() => {
        console.log("UserProfile - Initial render", { user, refreshKey });
    }, []);

    // Single useEffect to handle initial data setup - runs only once
    useEffect(() => {
        // Skip if we've already processed this user or if no user exists
        if (dataFetchedRef.current && userIdRef.current === user?.id) {
            console.log("UserProfile - Data already fetched for this user, skipping");
            return;
        }
        
        console.log("UserProfile - Component mounted or user changed");
        
        // Check if user exists
        if (!user) {
            console.log("UserProfile - No user found");
            setError('User data not available');
            setLoading(false);
            return;
        }
        
        // Check user role
        if (user.role !== 'user') {
            console.log("UserProfile - Not a user role:", user.role);
            setError('Unauthorized access');
            setLoading(false);
            return;
        }
        
        // Update local state from user context
        console.log("UserProfile - Updating from user context:", user);
        setUserData(user);
        setFormData({
            name: user.name || '',
            email: user.email || '',
            age: user.age ? user.age.toString() : '',
            height: user.height ? user.height.toString() : '',
            weight: user.weight ? user.weight.toString() : '',
            gender: user.gender || '',
            image: null,
        });
        
        // Set image preview from user's existing image
        if (user.imageUrl) {
            console.log('Setting initial image preview from user imageUrl:', user.imageUrl);
            setPreviewImage(formatImageUrl(user.imageUrl));
        } else if (user.image) {
            console.log('Setting initial image preview from user image:', user.image);
            setPreviewImage(formatImageUrl(user.image));
        }
        
        setLoading(false);
        
        // Only fetch user data once
        if (!dataFetchedRef.current) {
            fetchUserData();
            dataFetchedRef.current = true;
            userIdRef.current = user.id;
        }
    }, [user?.id]); // Only depend on user.id, not the entire user object

    const fetchUserData = async () => {
        console.log("UserProfile - Fetching user data");
        try {
            // Check if token exists before making the request
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No authentication token found');
                // Use cached data if available
                const cachedUser = localStorage.getItem('user');
                if (cachedUser) {
                    const userData = JSON.parse(cachedUser);
                    setUserData(userData);
                    setFormData({
                        name: userData.name || '',
                        email: userData.email || '',
                        age: userData.age ? userData.age.toString() : '',
                        height: userData.height ? userData.height.toString() : '',
                        weight: userData.weight ? userData.weight.toString() : '',
                        gender: userData.gender || '',
                        image: null,
                    });
                }
                setLoading(false);
                return;
            }

            const response = await API.get('/users/profile');
            console.log("UserProfile - API response:", response.data);
            
            // Update both local state and context
            setUserData(response.data);
            
            // Update the user context with the latest data
            const updatedUser = {
                ...user,
                name: response.data.name,
                email: response.data.email,
                age: response.data.age,
                height: response.data.height,
                weight: response.data.weight,
                gender: response.data.gender,
                image: response.data.image
            };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            setFormData({
                name: response.data.name || '',
                email: response.data.email || '',
                age: response.data.age ? response.data.age.toString() : '',
                height: response.data.height ? response.data.height.toString() : '',
                weight: response.data.weight ? response.data.weight.toString() : '',
                gender: response.data.gender || '',
                image: null,
            });
            
            // Set image preview from user's existing image
            if (response.data.imageUrl) {
                console.log('Setting initial image preview from user imageUrl:', response.data.imageUrl);
                setPreviewImage(formatImageUrl(response.data.imageUrl));
            } else if (response.data.image) {
                console.log('Setting initial image preview from user image:', response.data.image);
                setPreviewImage(formatImageUrl(response.data.image));
            }
            
            setLoading(false);
        } catch (error) {
            console.error('Error fetching user data:', error);
            
            // If we get a 403 error, use cached data from localStorage
            if (error.response && error.response.status === 403) {
                console.log('Using cached user data due to 403 error');
                const cachedUser = localStorage.getItem('user');
                if (cachedUser) {
                    const userData = JSON.parse(cachedUser);
                    setUserData(userData);
                    setFormData({
                        name: userData.name || '',
                        email: userData.email || '',
                        age: userData.age ? userData.age.toString() : '',
                        height: userData.height ? userData.height.toString() : '',
                        weight: userData.weight ? userData.weight.toString() : '',
                        gender: userData.gender || '',
                        image: null,
                    });
                }
            }
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                setError('Image size should be less than 5MB');
                toast.error('Image size should be less than 5MB');
                e.target.value = ''; // Reset file input
                return;
            }
            
            // Check file type
            const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
            if (!validTypes.includes(file.type)) {
                setError('Please select a valid image file (JPEG, PNG or GIF)');
                toast.error('Please select a valid image file (JPEG, PNG or GIF)');
                e.target.value = ''; // Reset file input
                return;
            }
            
            // All checks passed, update form data
            setFormData(prev => ({
                ...prev,
                image: file,
            }));
            
            // Create a blob URL for preview
            const blobUrl = URL.createObjectURL(file);
            
            // Revoke any existing blob URL to prevent memory leaks
            if (previewImage && previewImage.startsWith('blob:')) {
                URL.revokeObjectURL(previewImage);
            }
            
            setPreviewImage(blobUrl);
            
            console.log("Image selected for upload:", file.name, file.size, "bytes", "type:", file.type);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            console.log("=== USER PROFILE FORM SUBMISSION ===");
            console.log("Current form data:", formData);
            console.log("Current user data:", userData);
            
            // For image uploads, we use FormData
            if (formData.image) {
                console.log("Image selected, using multipart form data");
                
                // Create a new FormData object for the API call
                const dataToUpdate = new FormData();
                
                // Only append changed values to reduce payload size
                if (formData.name !== userData.name) dataToUpdate.append('name', formData.name);
                if (formData.email !== userData.email) dataToUpdate.append('email', formData.email);
                if (formData.age !== userData.age?.toString()) dataToUpdate.append('age', formData.age);
                if (formData.height !== userData.height?.toString()) dataToUpdate.append('height', formData.height);
                if (formData.weight !== userData.weight?.toString()) dataToUpdate.append('weight', formData.weight);
                if (formData.gender !== userData.gender) dataToUpdate.append('gender', formData.gender || '');
                
                // Validate image file
                const imageFile = formData.image;
                if (imageFile) {
                    // Check file size (max 5MB)
                    if (imageFile.size > 5 * 1024 * 1024) {
                        toast.error('Image size must be less than 5MB');
                        return;
                    }
                    
                    // Check file type
                    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
                    if (!validTypes.includes(imageFile.type)) {
                        toast.error('Please select a valid image file (JPEG, PNG or GIF)');
                        return;
                    }
                    
                    // Add the image file to FormData
                    console.log(`Appending image file: ${imageFile.name} (${imageFile.size} bytes, type: ${imageFile.type})`);
                    dataToUpdate.append('image', imageFile);
                }
                
                // Log what's in the FormData (for debugging)
                console.log('Profile update FormData contents:');
                for (let pair of dataToUpdate.entries()) {
                    if (pair[0] === 'image' && pair[1] instanceof File) {
                        console.log(`${pair[0]}: [File] ${pair[1].name} (${pair[1].size} bytes, type: ${pair[1].type})`);
                    } else {
                        console.log(`${pair[0]}: ${pair[1]}`);
                    }
                }
                
                // Show loading toast during upload
                const toastId = toast.info('Uploading image, please wait... This may take a minute.', {
                    autoClose: false,
                    closeButton: false,
                    closeOnClick: false,
                    draggable: false
                });
                
                try {
                    // Simple PUT request with FormData
                    console.log("Making API request to upload image...");
                    
                    // Use the axios instance directly for better control
                    const token = localStorage.getItem('token');
                    const response = await axios.put('http://localhost:5050/api/users/profile', dataToUpdate, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                            // Don't set Content-Type for FormData - browser will set it with boundary
                        },
                        timeout: 180000 // 3 minutes timeout
                    });
                    
                    // Close the loading toast
                    toast.dismiss(toastId);
                    
                    console.log("API response received:", response.status);
                    console.log("Profile update response:", response.data);
                    
                    // Process the response and update the UI
                    handleUpdateSuccess(response.data);
                } catch (uploadError) {
                    // Close the loading toast
                    toast.dismiss(toastId);
                    
                    console.error('Error uploading image:', uploadError);
                    
                    // Get a more specific error message if available
                    let errorMessage = 'Failed to upload image. Please try again with a smaller image or different format.';
                    
                    if (uploadError.response && uploadError.response.data && uploadError.response.data.error) {
                        errorMessage = uploadError.response.data.error;
                    }
                    
                    // Show error message
                    toast.error(errorMessage);
                    
                    // Detailed logging
                    if (uploadError.response) {
                        console.error('Error response status:', uploadError.response.status);
                        console.error('Error response data:', uploadError.response.data);
                    } else if (uploadError.request) {
                        console.error('No response received. Request:', uploadError.request);
                    } else {
                        console.error('Error message:', uploadError.message);
                    }
                }
            } else {
                // No image - use the direct field update API
                console.log("No image selected, using direct field update");
                
                // Create a clean object with only changed values
                const updateData = {};
                
                if (formData.name !== userData.name) updateData.name = formData.name;
                if (formData.email !== userData.email) updateData.email = formData.email;
                if (formData.age !== userData.age?.toString()) updateData.age = formData.age;
                if (formData.height !== userData.height?.toString()) updateData.height = formData.height;
                if (formData.weight !== userData.weight?.toString()) updateData.weight = formData.weight;
                if (formData.gender !== userData.gender) updateData.gender = formData.gender || '';
                
                // Only proceed if there are changes to update
                if (Object.keys(updateData).length === 0) {
                    toast.info('No changes to update');
                    return;
                }
                
                console.log("Sending direct field update:", updateData);
                
                try {
                    // Use our specialized function for field updates
                    const updatedUser = await updateUserFields(updateData);
                    console.log("Profile update response:", updatedUser);
                    handleUpdateSuccess(updatedUser);
                } catch (updateError) {
                    console.error('Failed to update fields:', updateError);
                    toast.error(updateError.message || 'Failed to update profile');
                }
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile. Please try again.');
        }
    };
    
    // Helper function to handle successful updates
    const handleUpdateSuccess = (updatedUser) => {
        console.log('Profile update successful:', updatedUser);
        
        // Revoke the blob URL to avoid memory leaks
        if (previewImage && previewImage.startsWith('blob:')) {
            URL.revokeObjectURL(previewImage);
        }
        
        // Add cache busting timestamp to image URL
        let imageUrlToUse = null;
        
        if (updatedUser.imageUrl) {
            console.log('Using imageUrl from response:', updatedUser.imageUrl);
            imageUrlToUse = formatImageUrl(updatedUser.imageUrl);
        } else if (updatedUser.image) {
            console.log('Using image from response:', updatedUser.image);
            imageUrlToUse = formatImageUrl(updatedUser.image);
        }
        
        // Update local state
        setUserData(updatedUser);
        setFormData({
            name: updatedUser.name || '',
            email: updatedUser.email || '',
            age: updatedUser.age ? updatedUser.age.toString() : '',
            height: updatedUser.height ? updatedUser.height.toString() : '',
            weight: updatedUser.weight ? updatedUser.weight.toString() : '',
            gender: updatedUser.gender || '',
            image: null,
        });
        
        // Set preview image with the new URL
        if (imageUrlToUse) {
            setPreviewImage(imageUrlToUse);
        }
        
        // Update user context with the updated user data
        setUser({
            ...user,
            ...updatedUser
        });
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify({
            ...user,
            ...updatedUser
        }));
        
        setIsEditing(false);
        toast.success('Profile updated successfully!');
        
        // Force a refresh of the component
        setRefreshKey(prevKey => prevKey + 1);
    };

    // Cleanup effect for blob URLs
    useEffect(() => {
        // Cleanup function to revoke any blob URLs when component unmounts
        return () => {
            if (previewImage && previewImage.startsWith('blob:')) {
                URL.revokeObjectURL(previewImage);
                console.log("Blob URL revoked on cleanup");
            }
        };
    }, [previewImage]);

    // Update the cancel handler to revoke blob URL
    const handleCancel = () => {
        // Revoke any blob URLs to prevent memory leaks
        if (previewImage && previewImage.startsWith('blob:')) {
            URL.revokeObjectURL(previewImage);
            console.log("Blob URL revoked on cancel");
        }
        
        // Reset form data to current user data
        setFormData({
            name: userData?.name || '',
            email: userData?.email || '',
            age: userData?.age?.toString() || '',
            height: userData?.height?.toString() || '',
            weight: userData?.weight?.toString() || '',
            gender: userData?.gender || '',
            image: null,
        });
        
        // Reset preview image
        setPreviewImage(userData?.image || null);
        
        // Exit edit mode
        setIsEditing(false);
    };

    if (loading) {
        console.log("UserProfile - Loading state");
        return <div className="loading">Loading profile information...</div>;
    }
    
    if (error) {
        console.log("UserProfile - Error state:", error);
        return <div className="error">{error}</div>;
    }

    if (!userData) {
        console.log("UserProfile - No user data");
        return <div className="error">No profile information available</div>;
    }

    console.log("UserProfile - Rendering profile with data:", userData);

    return (
        <div className="profile-container">
            <h3>Profile Information</h3>
            <div className="profile-content">
                <div className="image-container">
                    <img
                        src={previewImage || (userData?.image ? formatImageUrl(userData.image) : "/default-avatar.png")}
                        alt="Profile"
                        className="profile-image"
                        key={refreshKey} // Force re-render when refresh key changes
                        onError={(e) => {
                            console.log("Image load error, using default avatar");
                            e.target.src = "/default-avatar.png";
                        }}
                    />
                </div>

                {isEditing ? (
                    <form onSubmit={handleSubmit} className="profile-form">
                        <div className="form-group">
                            <label>Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Age</label>
                            <input
                                type="number"
                                name="age"
                                value={formData.age}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Height (cm)</label>
                            <input
                                type="number"
                                name="height"
                                value={formData.height}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Weight (kg)</label>
                            <input
                                type="number"
                                name="weight"
                                value={formData.weight}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Gender</label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                            >
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Profile Image</label>
                            <input
                                type="file"
                                name="image"
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                        </div>

                        <div className="form-actions">
                            <button type="submit">Save Changes</button>
                            <button type="button" onClick={handleCancel}>
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="profile-info">
                        <div className="info-row">
                            <span className="info-label">Name:</span>
                            <span className="info-value">{userData.name || 'Not set'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Email:</span>
                            <span className="info-value">{userData.email || 'Not set'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Age:</span>
                            <span className="info-value">{userData.age || 'Not set'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Height:</span>
                            <span className="info-value">
                                {userData.height ? `${userData.height} cm` : 'Not set'}
                            </span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Weight:</span>
                            <span className="info-value">
                                {userData.weight ? `${userData.weight} kg` : 'Not set'}
                            </span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Gender:</span>
                            <span className="info-value">
                                {userData.gender ? userData.gender.charAt(0).toUpperCase() + userData.gender.slice(1) : 'Not set'}
                            </span>
                        </div>
                        <button
                            className="edit-btn"
                            onClick={() => setIsEditing(true)}
                        >
                            Edit Profile
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfile;