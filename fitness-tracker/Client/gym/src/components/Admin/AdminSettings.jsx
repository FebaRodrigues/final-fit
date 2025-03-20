import React, { useState, useEffect, useRef } from 'react';
import { getAdminProfile, updateAdminProfile } from '../../api';
import { FaUser, FaEnvelope, FaImage, FaSave, FaTimes, FaEdit, FaBug, FaCloudUploadAlt, FaLink } from 'react-icons/fa';
import axios from 'axios';

// Utility function to validate image URLs
const isValidImageUrl = (url) => {
  if (!url) return false;
  
  try {
    // Remove any timestamp or query parameters that might be added
    const cleanUrl = url.split('?')[0];
    
    // If it's a Cloudinary URL
    if (cleanUrl.includes('cloudinary.com')) {
      return true;
    }
    
    // If it's a data URL, make sure it's properly formatted
    if (cleanUrl.startsWith('data:image')) {
      // Basic validation for data URLs
      if (!cleanUrl.includes('base64,')) {
        console.warn('Invalid data URL: missing base64 marker');
        return false;
      }
      
      // Check if the data URL is truncated (common issue with large base64 strings)
      const base64Part = cleanUrl.split('base64,')[1];
      if (!base64Part || base64Part.length < 10) {
        console.warn('Invalid data URL: base64 data appears to be truncated');
        return false;
      }
      
      // More lenient check for base64 characters - only log a warning but still accept the image
      // This helps with images that might have been slightly corrupted but are still usable
      const validBase64Regex = /^[A-Za-z0-9+/=]+$/;
      if (!validBase64Regex.test(base64Part)) {
        console.warn('Warning: base64 data contains potentially invalid characters, but we\'ll try to display it anyway');
        // Return true anyway to attempt to display the image
        return true;
      }
      
      return true;
    }
    
    // For regular URLs, try to create a URL object to validate
    if (cleanUrl.startsWith('http') || cleanUrl.startsWith('https')) {
      new URL(cleanUrl); // This will throw if the URL is invalid
      return true;
    }
    
    // For relative URLs
    return true;
  } catch (error) {
    console.error('Error validating image URL:', error);
    return false;
  }
};

// Debug component to show image information
const ImageDebugInfo = ({ imageUrl, show = false }) => {
  const [expanded, setExpanded] = useState(false);
  const [imageSize, setImageSize] = useState(null);
  
  useEffect(() => {
    // Calculate image size if it's a data URL
    if (imageUrl && imageUrl.startsWith('data:')) {
      // Estimate the size in bytes (base64 uses ~4 characters per 3 bytes)
      const base64Part = imageUrl.split('base64,')[1] || '';
      const estimatedBytes = Math.ceil(base64Part.length * 0.75);
      
      if (estimatedBytes > 1024 * 1024) {
        setImageSize(`~${(estimatedBytes / (1024 * 1024)).toFixed(2)} MB`);
      } else if (estimatedBytes > 1024) {
        setImageSize(`~${(estimatedBytes / 1024).toFixed(2)} KB`);
      } else {
        setImageSize(`~${estimatedBytes} bytes`);
      }
    } else {
      setImageSize(null);
    }
  }, [imageUrl]);
  
  if (!show) return null;
  
  const getImageInfo = () => {
    if (!imageUrl) return 'No image URL';
    
    // Clean the URL by removing query parameters
    const cleanUrl = imageUrl.split('?')[0];
    const hasQueryParams = imageUrl.includes('?');
    
    const isDataUrl = cleanUrl.startsWith('data:');
    const isCloudinaryUrl = cleanUrl.includes('cloudinary.com');
    const hasTimestamp = imageUrl.includes('?t=');
    const urlType = isDataUrl ? 'Data URL' : (isCloudinaryUrl ? 'Cloudinary URL' : 'Regular URL');
    const urlLength = cleanUrl.length;
    
    // Check for potential issues
    let issues = [];
    if (isDataUrl) {
      if (!cleanUrl.includes('base64,')) {
        issues.push('Missing base64 marker');
      }
      
      const base64Part = cleanUrl.split('base64,')[1] || '';
      if (base64Part.length < 10) {
        issues.push('Base64 data appears to be truncated');
      }
      
      if (urlLength > 1024 * 1024) {
        issues.push('Data URL is extremely large (>1MB text)');
      } else if (urlLength > 100000) {
        issues.push('Data URL is quite large (>100KB text)');
      }
      
      // Check for invalid characters in base64
      const validBase64Regex = /^[A-Za-z0-9+/=]+$/;
      if (base64Part && !validBase64Regex.test(base64Part)) {
        issues.push('Base64 data contains invalid characters');
      }
      
      if (hasQueryParams) {
        issues.push('Data URL has query parameters which may cause issues');
      }
    } else if (cleanUrl.startsWith('http')) {
      try {
        new URL(cleanUrl);
      } catch (e) {
        issues.push('Invalid URL format');
      }
    }
    
    return (
      <div className="debug-details">
        <p><strong>URL Type:</strong> {urlType}</p>
        <p><strong>Has Timestamp:</strong> {hasTimestamp ? 'Yes' : 'No'}</p>
        <p><strong>Has Query Parameters:</strong> {hasQueryParams ? 'Yes' : 'No'}</p>
        <p><strong>URL Length:</strong> {urlLength} characters</p>
        {imageSize && <p><strong>Estimated Size:</strong> {imageSize}</p>}
        {isDataUrl && (
          <>
            <p><strong>Data Format:</strong> {cleanUrl.substring(0, cleanUrl.indexOf(',') + 10)}...</p>
            <p><strong>MIME Type:</strong> {cleanUrl.substring(5, cleanUrl.indexOf(';'))}</p>
          </>
        )}
        {isCloudinaryUrl && (
          <p><strong>Cloudinary URL:</strong> Image hosted on Cloudinary</p>
        )}
        {issues.length > 0 && (
          <div className="debug-issues">
            <p><strong>Potential Issues:</strong></p>
            <ul>
              {issues.map((issue, index) => (
                <li key={index} style={{ color: '#dc3545' }}>{issue}</li>
              ))}
            </ul>
          </div>
        )}
        {expanded && (
          <div className="full-url">
            <p><strong>Full URL:</strong></p>
            <textarea 
              readOnly 
              value={isDataUrl ? 
                `${cleanUrl.substring(0, cleanUrl.indexOf(',') + 10)}... (${urlLength} chars total)` : 
                cleanUrl} 
              rows={5} 
            />
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="image-debug-info">
      <div className="debug-header" onClick={() => setExpanded(!expanded)}>
        <FaBug /> Image Debug Info {expanded ? '▼' : '▶'}
      </div>
      {getImageInfo()}
    </div>
  );
};

// Utility function to safely display images with fallback
const SafeImage = ({ src, alt, className, fallbackSrc = "/assets/default-profile.svg" }) => {
  // Remove any query parameters from the source URL
  const cleanSrc = src ? src.split('?')[0] : null;
  
  const [imgSrc, setImgSrc] = useState(isValidImageUrl(cleanSrc) ? cleanSrc : fallbackSrc);
  const [hasError, setHasError] = useState(false);
  const [errorDetails, setErrorDetails] = useState('');
  
  useEffect(() => {
    // Clean the source URL by removing query parameters
    const cleanSrc = src ? src.split('?')[0] : null;
    
    // Update image source if the src prop changes
    if (cleanSrc && isValidImageUrl(cleanSrc)) {
      setImgSrc(cleanSrc);
      setHasError(false);
      setErrorDetails('');
    } else if (cleanSrc) {
      // If src exists but is invalid
      setHasError(true);
      setImgSrc(fallbackSrc);
      
      // Provide more detailed error information
      if (!cleanSrc.startsWith('data:image') && !cleanSrc.includes('cloudinary.com') && !cleanSrc.startsWith('http')) {
        setErrorDetails('Invalid image URL format');
      } else if (cleanSrc.startsWith('data:image') && !cleanSrc.includes('base64,')) {
        setErrorDetails('Missing base64 marker in data URL');
      } else {
        setErrorDetails('Invalid or corrupted image data');
      }
    }
  }, [src, fallbackSrc]);
  
  const handleError = () => {
    console.log("Image failed to load:", src?.substring(0, 100) + "...");
    setHasError(true);
    setImgSrc(fallbackSrc);
    setErrorDetails('Image failed to load');
  };
  
  return (
    <div className="safe-image-container">
      <img 
        src={imgSrc} 
        alt={alt} 
        className={className}
        onError={handleError}
      />
      {hasError && (
        <div className="image-error-message">
          {errorDetails || 'Image failed to load. Using fallback.'}
        </div>
      )}
    </div>
  );
};

// Cloudinary configuration
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'fitness_app_preset';
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

const AdminSettings = ({ adminProfile, setAdminProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', image: '' });
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (adminProfile) {
      setFormData({
        name: adminProfile.name || '',
        email: adminProfile.email || '',
        image: adminProfile.image || ''
      });
      setImagePreview(adminProfile.image || '');
    }
  }, [adminProfile]);

  // Check Cloudinary configuration on component initialization
  useEffect(() => {
    // Verify Cloudinary configuration
    if (!CLOUDINARY_CLOUD_NAME) {
      setError('Image upload service is not properly configured. Please contact the administrator.');
    }
  }, []);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Modified uploadToCloudinary to handle errors better
  const uploadToCloudinary = async (file) => {
    try {
      // Check if Cloudinary is properly configured
      if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
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
        }
      });
      
      setIsUploading(false);
      
      // Return the secure URL of the uploaded image
      return response.data.secure_url;
    } catch (error) {
      setIsUploading(false);
      
      // Return null to trigger the fallback
      return null;
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check if it's an image file
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file (JPEG, PNG, etc.)');
        return;
      }
      
      // Check file size - limit to 5MB for Cloudinary
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB. Please choose a smaller image or compress the current one.');
        return;
      }
      
      // Show loading state
      setLoading(true);
      setError(null);
      
      // Try Cloudinary first - if it fails, fallback to base64
      let imageUrl = null;
      
      try {
        imageUrl = await uploadToCloudinary(file);
      } catch (e) {
        // Continue to base64 fallback
      }
      
      // If Cloudinary upload failed or returned null, use base64 fallback
      if (!imageUrl) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const imageData = reader.result;
          setImagePreview(imageData);
          setFormData(prevData => ({ ...prevData, image: imageData }));
          setLoading(false);
        };
        
        reader.onerror = () => {
          setError('Failed to read the image file. Please try again with a different image.');
          setLoading(false);
        };
        
        reader.readAsDataURL(file);
      } else {
        // Use the Cloudinary URL
        setImagePreview(imageUrl);
        setFormData(prevData => ({ ...prevData, image: imageUrl }));
        setLoading(false);
      }
    }
  };

  const handleChooseImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess('');
    
    try {
      // Check if the server is reachable before making the request
      try {
        await axios.get(`${import.meta.env.VITE_API_URL.replace(/\/api$/, '')}/api/health`, { timeout: 5000 });
      } catch (connectionError) {
        setError('Cannot connect to the server. Please check if the server is running and try again.');
        setLoading(false);
        return;
      }
      
      // Make API call to update profile
      const response = await updateAdminProfile(formData);
      
      // Check if we have both the required state update function and the response data
      if (setAdminProfile && response.data && response.data.admin) {
        // Update the admin profile in state
        setAdminProfile(response.data.admin);
        
        // Update the adminUser in localStorage with the latest profile data
        const storedAdminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        const updatedAdminUser = {
          ...storedAdminUser,
          name: response.data.admin.name,
          email: response.data.admin.email,
          image: response.data.admin.image
        };
        localStorage.setItem('adminUser', JSON.stringify(updatedAdminUser));
        
        // Force refresh the image by adding a timestamp
        const timestamp = new Date().getTime();
        const imageWithTimestamp = response.data.admin.image && response.data.admin.image.includes('?') 
          ? `${response.data.admin.image.split('?')[0]}?t=${timestamp}` 
          : `${response.data.admin.image}?t=${timestamp}`;
        
        // Update the admin profile with the timestamped image
        setAdminProfile(prev => ({
          ...prev,
          image: imageWithTimestamp
        }));
      } else {
        // Handle the case where setAdminProfile is not provided
        setSuccess('Profile updated successfully! You may need to refresh the page to see all changes.');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
      
      setIsEditing(false);
      setSuccess('Profile updated successfully! Page will refresh in a moment...');
      
      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      let errorMessage = 'Error updating profile: ';
      
      if (error.response) {
        errorMessage += error.response.data.message || error.response.data.error || error.message || 'Server error';
      } else if (error.request) {
        errorMessage += 'No response from server. Please check your network connection.';
      } else {
        errorMessage += error.message || 'Unknown error';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    // Reset form data to current profile values
    if (adminProfile) {
      setFormData({
        name: adminProfile.name || '',
        email: adminProfile.email || '',
        image: adminProfile.image || ''
      });
      setImagePreview(adminProfile.image || '');
    }
    setError(null);
  };

  return (
    <div className="admin-content">
      <div className="admin-settings-container">
        <h2><FaUser /> Admin Profile Settings</h2>
        
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}
        
        {success && (
          <div className="success-message">
            {success}
            <button onClick={() => setSuccess('')}>×</button>
          </div>
        )}
        
        <div className="admin-profile-section">
          {!isEditing ? (
            <div className="admin-profile-details">
              <div className="profile-image-container">
                <SafeImage 
                  src={adminProfile?.image} 
                  alt="Admin" 
                  className="profile-image"
                />
              </div>
              <div className="profile-info">
                <h3>{adminProfile?.name}</h3>
                <p><FaEnvelope /> {adminProfile?.email}</p>
                <button 
                  className="primary-button" 
                  onClick={() => setIsEditing(true)}
                >
                  <FaEdit /> Edit Profile
                </button>
              </div>
            </div>
          ) : (
            <form className="admin-profile-form" onSubmit={handleUpdateProfile}>
              <h3>Edit {adminProfile?.name}'s Profile</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name"><FaUser /> Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleProfileChange}
                    required
                  />
                </div>
                  
                <div className="form-group">
                  <label htmlFor="email"><FaEnvelope /> Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleProfileChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="image"><FaImage /> Profile Image</label>
                <div className="image-upload-container">
                  <div className="image-preview">
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
                      <SafeImage 
                        src={imagePreview} 
                        alt="Profile Preview" 
                        className="profile-image-preview"
                      />
                    )}
                  </div>
                  
                  <div className="image-upload-buttons">
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="file-input"
                      name="image"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                    
                    <button 
                      type="button"
                      className="custom-file-upload"
                      onClick={handleChooseImage}
                    >
                      <FaImage /> Choose Image
                    </button>
                    
                    <div className="direct-file-upload">
                      <label htmlFor="direct-image" className="direct-file-label">
                        <FaImage /> Or drag and drop here
                        <input
                          type="file"
                          id="direct-image"
                          name="direct-image"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="direct-file-input"
                        />
                      </label>
                    </div>
                  </div>
                  
                  {imagePreview && (
                    <div className="image-source-info">
                      {imagePreview.split('?')[0].includes('cloudinary') ? (
                        <div className="cloudinary-info">
                          <FaCloudUploadAlt /> Image hosted on Cloudinary
                        </div>
                      ) : imagePreview.split('?')[0].startsWith('data:') ? (
                        <div className="base64-info">
                          <FaImage /> Image stored as base64 data
                        </div>
                      ) : (
                        <div className="external-url-info">
                          <FaLink /> Image from external URL
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-buttons">
                <button 
                  type="submit" 
                  className="primary-button"
                  disabled={loading || isUploading}
                >
                  {loading ? 'Saving...' : <><FaSave /> Save Changes</>}
                </button>
                <button 
                  type="button" 
                  className="secondary-button"
                  onClick={cancelEdit}
                  disabled={loading || isUploading}
                >
                  <FaTimes /> Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings; 