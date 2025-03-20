// src/api.jsx
import axios from 'axios';
import { resetPortDetection } from './utils/serverPortDetector';

// Function to get the server URL with the correct port
export const getServerUrl = () => {
    // Use the environment variable instead of hardcoded localhost
    let apiUrl = import.meta.env.VITE_API_URL;
    console.log('Raw API URL from environment:', apiUrl);
    
    // Ensure the URL starts with http:// or https://
    if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
        console.warn('API URL does not start with http:// or https://, adding https://');
        apiUrl = `https://${apiUrl}`;
    }
    
    // Ensure the URL ends with /api for server routes
    if (!apiUrl.endsWith('/api')) {
        console.warn('API URL does not end with /api, adding /api suffix');
        apiUrl = apiUrl.endsWith('/') ? `${apiUrl}api` : `${apiUrl}/api`;
    }
    
    console.log('Using final API URL:', apiUrl);
    return apiUrl;
};

// Define API URL constant
const API_URL = getServerUrl();

// Initialize API with the server URL
const API = axios.create({
    baseURL: API_URL,
    timeout: 60000, // Increased to 60 seconds
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Add request interceptor for FormData and auth
API.interceptors.request.use(config => {
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    
    // For FormData, don't set Content-Type (browser will set it with boundary)
    if (config.data instanceof FormData) {
        // Set a longer timeout for image uploads (3 minutes)
        config.timeout = 180000;
        console.log("FormData detected, using extended timeout:", config.timeout);
        delete config.headers['Content-Type']; // Let browser set it for FormData
    }
    
    // Add auth token to every request if available
    const token = localStorage.getItem('token');
    if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("Added auth token to request");
    }
    
    return config;
}, error => {
    console.error("Request configuration error:", error);
    return Promise.reject(error);
});

// Add response interceptor for debugging
API.interceptors.response.use(
    response => {
        console.log(`API Response: ${response.status} for ${response.config.url}`);
        return response;
    },
    error => {
        console.error("API Error:", error);
        if (error.response) {
            console.error("Response data:", error.response.data);
            console.error("Response status:", error.response.status);
        } else if (error.request) {
            console.error("No response received, request:", error.request);
        } else {
            console.error("Error message:", error.message);
        }
        return Promise.reject(error);
    }
);

// Track server status
const serverStatus = {
    isDown: false,
    lastCheck: 0,
    retryCount: 0,
    maxRetries: 3,
    retryDelay: 5000, // 5 seconds
    
    markDown() {
        this.isDown = true;
        this.lastCheck = Date.now();
        this.retryCount++;
        console.log(`Server marked as down. Retry count: ${this.retryCount}`);
    },
    
    markUp() {
        this.isDown = false;
        this.lastCheck = Date.now();
        this.retryCount = 0;
        console.log('Server marked as up');
    },
    
    shouldRetry() {
        return this.retryCount < this.maxRetries;
    },
    
    canCheck() {
        return Date.now() - this.lastCheck > this.retryDelay;
    }
};

// Function to show server not running message
const showServerNotRunningMessage = () => {
    // Only show the message if we haven't shown it recently
    if (!serverStatus.isDown || serverStatus.canCheck()) {
        serverStatus.markDown();
        
        // Create or update the server status message
        let messageElement = document.getElementById('server-status-message');
        
        if (!messageElement) {
            messageElement = document.createElement('div');
            messageElement.id = 'server-status-message';
            messageElement.style.position = 'fixed';
            messageElement.style.bottom = '20px';
            messageElement.style.right = '20px';
            messageElement.style.backgroundColor = '#f8d7da';
            messageElement.style.color = '#721c24';
            messageElement.style.padding = '10px 15px';
            messageElement.style.borderRadius = '4px';
            messageElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
            messageElement.style.zIndex = '9999';
            messageElement.style.maxWidth = '300px';
            document.body.appendChild(messageElement);
        }
        
        messageElement.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <strong>Server Connection Issue</strong>
                <button onclick="this.parentNode.parentNode.style.display='none'" style="background: none; border: none; cursor: pointer; font-size: 16px;">&times;</button>
            </div>
            <p style="margin: 5px 0;">The server appears to be down or unreachable. Some features may not work correctly.</p>
            <button onclick="window.location.reload()" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-top: 5px;">Refresh Page</button>
        `;
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (messageElement && messageElement.parentNode) {
                messageElement.style.display = 'none';
            }
        }, 10000);
    }
};

// Add request interceptor to update baseURL if needed
API.interceptors.request.use(
    (config) => {
        // Update baseURL on each request to ensure we're using the latest port
        const baseUrl = getServerUrl();
        config.baseURL = baseUrl;
        console.log(`API Request to: ${baseUrl}${config.url}`);
        
        // If server was previously down, but we're trying again, log it
        if (serverStatus.isDown && serverStatus.canCheck() && serverStatus.shouldRetry()) {
            console.log(`Retrying request after server was down. Retry #${serverStatus.retryCount}`);
        }
        
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Function to update the server port
export const updateServerPort = (port) => {
    // Use the environment variable instead of hardcoded localhost
    console.log('Using API URL from environment');
    API.defaults.baseURL = import.meta.env.VITE_API_URL;
    console.log(`API baseURL updated to: ${API.defaults.baseURL}`);
};

// Cache for API data to prevent excessive API calls
const apiCache = {
    data: new Map(), // Map of endpoint -> data
    timestamp: new Map(), // Map of endpoint -> timestamp
    maxAge: 60000, // 1 minute cache
    
    get(endpoint) {
        const cachedData = this.data.get(endpoint);
        const timestamp = this.timestamp.get(endpoint);
        
        if (cachedData && timestamp) {
            const age = Date.now() - timestamp;
            if (age < this.maxAge) {
                return cachedData;
            }
        }
        
        return null;
    },
    
    set(endpoint, data) {
        this.data.set(endpoint, data);
        this.timestamp.set(endpoint, Date.now());
    },
    
    clear(endpoint) {
        if (endpoint) {
            this.data.delete(endpoint);
            this.timestamp.delete(endpoint);
        } else {
            this.data.clear();
            this.timestamp.clear();
        }
    }
};

// Add a request interceptor to include the auth token
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle errors
API.interceptors.response.use(
    (response) => {
        // If we get a successful response, mark the server as up
        serverStatus.markUp();
        return response;
    },
    (error) => {
        if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
            console.error(`Network error - server may be down or unreachable: ${error.code}`, error.message);
            showServerNotRunningMessage();
        } else if (error.response) {
            console.error('Response error:', error.response.status, error.response.data);
            
            // If we get a 401 or 403, the token might be invalid
            if (error.response.status === 401 || error.response.status === 403) {
                // Check if we're not on the login page
                if (!window.location.pathname.includes('/login')) {
                    console.warn('Authentication error, redirecting to login');
                    
                    // Get the user role
                    const role = localStorage.getItem('role');
                    
                    // Check if this is a request to /admin/users or /memberships/user - if so, don't redirect
                    const isAdminUsersRequest = error.config && 
                                               error.config.url && 
                                               error.config.url.includes('/admin/users');
                                               
                    const isMembershipsRequest = error.config && 
                                               error.config.url && 
                                               error.config.url.includes('/memberships/user');
                    
                    if (isAdminUsersRequest || isMembershipsRequest) {
                        console.log('Admin users or memberships request failed with auth error - not redirecting automatically');
                        return Promise.reject(error);
                    }
                    
                    // Clear token and user data
                    localStorage.removeItem('token');
                    
                    // Handle different roles differently
                    if (role === 'admin') {
                        console.log('Admin authentication error, clearing admin data');
                        localStorage.removeItem('adminUser');
                        // Don't remove role for admin to ensure proper redirect
                    } else {
                        localStorage.removeItem('user');
                        localStorage.removeItem('trainer');
                        localStorage.removeItem('role');
                    }
                    
                    // Determine the appropriate login page based on the role or current path
                    let loginPath = '/users/login'; // Default
                    
                    if (role === 'admin' || window.location.pathname.includes('/admin')) {
                        loginPath = '/admin/login';
                    } else if (role === 'trainer' || window.location.pathname.includes('/trainer')) {
                        loginPath = '/trainers/login';
                    }
                    
                    // Redirect to the appropriate login page after a short delay
                    setTimeout(() => {
                        window.location.href = loginPath;
                    }, 1000);
                }
            }
        } else if (error.request) {
            console.error('Request error - no response received:', error.request);
            showServerNotRunningMessage();
        } else {
            console.error('Error:', error.message);
        }
        return Promise.reject(error);
    }
);

// Admin API Functions
export const getAdminProfile = () => {
    return API.get('/admin/profile');
};

export const updateAdminProfile = (data) => {
    // Create a clean copy of the data
    let cleanData = { ...data };
    
    // Handle image data
    if (cleanData.image && typeof cleanData.image === 'string') {
        // For Cloudinary URLs, no processing needed
        if (cleanData.image.includes('cloudinary.com')) {
            console.log('Using Cloudinary image URL');
        }
        // For data URLs, ensure they're properly formatted
        else if (cleanData.image.startsWith('data:')) {
            // Remove any query parameters
            cleanData.image = cleanData.image.split('?')[0];
            
            // Log the image data length for debugging
            console.log(`Sending image data of length: ${cleanData.image.length} characters`);
            
            // Check if the image data is too large
            if (cleanData.image.length > 1024 * 1024 * 2) { // 2MB limit
                console.warn('Image data is very large, this may cause issues with the server');
            }
        }
    }
    
    return API.put('/admin/profile', cleanData);
};

export const loginAdmin = async (credentials) => {
    try {
        // Clear any existing tokens before login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('trainer');
        localStorage.removeItem('role');
        localStorage.removeItem('adminUser');
        
        const { email, password } = credentials;
        console.log('Attempting admin login with email:', email);
        
        // Create a new axios instance for this request to ensure we use the latest port
        const response = await API.post('/admin/login', { email, password });
        
        console.log('Admin login response:', response.data);
        
        // Return a standardized format for the login response
        return {
            token: response.data.token,
            admin: response.data.admin || { 
                _id: 'admin-id',
                name: 'Admin User',
                email: email
            },
            role: 'admin'
        };
    } catch (error) {
        console.error('Admin login error:', error);
        
        // Provide more detailed error messages
        if (error.response && error.response.status === 401) {
            throw new Error('Invalid email or password. Please try again.');
        }
        
        // Provide a more user-friendly error message for server connection issues
        if (error.code === 'ERR_NETWORK') {
            throw new Error('Cannot connect to server. Please check if the server is running.');
        }
        
        throw error;
    }
};

export const registerAdmin = (data) => {
    return API.post('/admin/register', data)
        .then(response => {
            return {
                success: true,
                message: response.data.message
            };
        })
        .catch(error => {
            console.error('Error registering admin:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to register admin'
            };
        });
};

// Admin Registration OTP
export const sendAdminRegistrationOTP = (email) => {
    // Get the authentication token
    const token = localStorage.getItem('token');
    
    // Set headers with authentication token
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    return API.post('/admin/send-otp', { email }, { headers })
        .then(response => {
            return {
                success: true,
                data: response.data,
                expiresAt: response.data.expiresAt
            };
        })
        .catch(error => {
            console.error('Error sending admin registration OTP:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to send OTP'
            };
        });
};

export const verifyAdminRegistrationOTP = (email, otp) => {
    return API.post('/admin/verify-otp', { email, otp })
        .then(response => {
            return {
                success: true,
                message: response.data.message
            };
        })
        .catch(error => {
            console.error('Error verifying admin registration OTP:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to verify OTP'
            };
        });
};

export const manageUsers = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No token found for manageUsers API call');
        return Promise.reject(new Error('Authentication required'));
    }
    
    console.log('Making manageUsers API call with token:', token.substring(0, 10) + '...');
    
    return API.get('/admin/users', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    }).catch(error => {
        console.error('Error in manageUsers API call:', error);
        
        // Just log the error and reject the promise
        // Don't redirect to login page - let the component handle the error
        return Promise.reject(error);
    });
};

export const getUserByIdAdmin = (userId) => {
    return API.get(`/admin/users/${userId}`);
};

export const adminUpdateUser = (userId, data) => {
    return API.put(`/admin/users/${userId}`, data);
};

export const adminDeleteUser = (userId) => {
    return API.delete(`/admin/users/${userId}`);
};

export const getUserActivity = (userId) => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('No token found for getUserActivity API call');
        return Promise.resolve({ data: [] });
    }
    
    console.log(`Fetching activity for user ${userId}`);
    
    // Try the admin endpoint first as it's most reliable for admin users
    return API.get(`/admin/users/${userId}/activity`)
        .then(response => {
            console.log(`Successfully fetched ${response.data.length} activities for user ${userId}`);
            return response;
        })
        .catch(error => {
            console.error(`Error fetching activity for user ${userId} from primary endpoint:`, error);
            
            // If that fails, try the user-activity/:id endpoint as fallback
            console.log(`Trying fallback endpoint for user ${userId} activity`);
            return API.get(`/admin/user-activity/${userId}`)
                .then(response => {
                    console.log(`Successfully fetched ${response.data.length} activities from fallback endpoint`);
                    return response;
                })
                .catch(fallbackError => {
                    console.error(`Error fetching from fallback endpoint:`, fallbackError);
                    
                    // Try direct workout logs endpoint as another fallback
                    return API.get(`/workout-logs/user/${userId}`)
                        .then(workoutResponse => {
                            console.log(`Successfully fetched ${workoutResponse.data.length} workout logs directly`);
                            
                            // Convert workout logs to activity format
                            const workoutActivities = workoutResponse.data.map(log => ({
                                _id: log._id,
                                userId: log.userId,
                                activityType: 'Workout',
                                description: `Completed workout: ${log.title || 'Unnamed'} (${log.exercises?.length || 0} exercises)`,
                                timestamp: log.date || new Date()
                            }));
                            
                            return { data: workoutActivities };
                        })
                        .catch(workoutError => {
                            console.error(`Error fetching workout logs:`, workoutError);
                            
                            // Try goals as another data source
                            return API.get(`/goals/user/${userId}`)
                                .then(goalsResponse => {
                                    console.log(`Successfully fetched ${goalsResponse.data.length} goals directly`);
                                    
                                    // Convert goals to activity format
                                    const goalActivities = goalsResponse.data.map(goal => ({
                                        _id: goal._id,
                                        userId: goal.userId,
                                        activityType: 'Goal',
                                        description: `Created goal: ${goal.goalType || 'Unknown'} - Target: ${goal.targetValue || 'Not specified'}`,
                                        timestamp: goal.createdAt || new Date()
                                    }));
                                    
                                    return { data: goalActivities };
                                })
                                .catch(goalsError => {
                                    console.error(`All activity endpoints failed:`, goalsError);
                                    
                                    // Create some sample activity data if all endpoints fail
                                    const sampleActivities = [
                                        {
                                            _id: 'sample1',
                                            userId,
                                            activityType: 'Login',
                                            description: 'User logged into the system',
                                            timestamp: new Date(Date.now() - 86400000) // 1 day ago
                                        },
                                        {
                                            _id: 'sample2',
                                            userId,
                                            activityType: 'Profile Update',
                                            description: 'User updated their profile',
                                            timestamp: new Date(Date.now() - 43200000) // 12 hours ago
                                        }
                                    ];
                                    
                                    return { data: sampleActivities };
                                });
                        });
                });
        });
};

export const getTrainerActivity = (trainerId) => {
    return API.get(`/admin/trainers/${trainerId}/activity`);
};

export const createUserActivity = (data) => {
    return API.post('/admin/user-activity', data);
};

export const getAllTrainersAdmin = () => {
    return API.get('/admin/trainers');
};

export const getTrainerByIdAdmin = (trainerId) => {
    return API.get(`/admin/trainers/${trainerId}`);
};

export const updateTrainerAdmin = (trainerId, data) => {
    return API.put(`/admin/trainers/${trainerId}`, data);
};

export const deleteTrainerAdmin = (trainerId) => {
    return API.delete(`/admin/trainers/${trainerId}`);
};

export const approveTrainer = (trainerId, approvedSalary) => {
    return API.post('/admin/approve-trainer', { trainerId, approvedSalary });
};

export const getWorkoutProgramsAdmin = () => {
    return API.get('/workout-programs/admin/all');
};

export const getMembershipsAdmin = () => {
    console.log('Fetching admin memberships...');
    
    // Try the admin endpoint first
    return API.get('/admin/memberships')
        .then(response => {
            console.log('Successfully fetched memberships from admin endpoint:', response.data.length);
            return response;
        })
        .catch(adminError => {
            console.error('Error fetching from admin memberships endpoint:', adminError);
            
            // If that fails, try the memberships endpoint as a fallback
            console.log('Trying memberships endpoint as fallback');
            return API.get('/memberships')
                .then(response => {
                    console.log('Successfully fetched memberships from fallback endpoint:', response.data.length);
                    return response;
                })
                .catch(membershipError => {
                    console.error('Error fetching from memberships endpoint:', membershipError);
                    
                    // If both fail, return an empty array instead of throwing an error
                    console.log('All membership endpoints failed, returning empty array');
                    return { data: [] };
                });
        });
};

export const getPaymentsAdmin = () => {
    console.log('Fetching admin payments...');
    
    // Try the admin endpoint first
    return API.get('/admin/payments')
        .then(response => {
            console.log('Successfully fetched payments from admin endpoint:', response.data.length);
            return response;
        })
        .catch(adminError => {
            console.error('Error fetching from admin payments endpoint:', adminError);
            
            // If that fails, try the payments endpoint as a fallback
            console.log('Trying payments endpoint as fallback');
            return API.get('/payments')
                .then(response => {
                    console.log('Successfully fetched payments from fallback endpoint:', response.data.length);
                    return response;
                })
                .catch(paymentsError => {
                    console.error('Error fetching from payments endpoint:', paymentsError);
                    
                    // If both fail, return an empty array instead of throwing an error
                    console.log('All payment endpoints failed, returning empty array');
                    return { data: [] };
                });
        });
};

export const createMembershipPlan = (planData) => {
    console.log('Creating membership plan:', planData);
    
    return API.post('/admin/memberships/plans', planData)
        .then(response => {
            console.log('Successfully created membership plan');
            return response;
        })
        .catch(error => {
            console.error('Error creating membership plan:', error);
            throw error;
        });
};

export const getAnalyticsAdmin = () => {
    // Try the admin endpoint first
    return API.get('/admin/analytics')
        .catch(adminError => {
            console.error('Error fetching from admin analytics endpoint:', adminError);
            
            // If that fails, try the analytics endpoint as a fallback
            console.log('Trying analytics endpoint as fallback');
            return API.get('/analytics/admin')
                .catch(analyticsError => {
                    console.error('Error fetching from analytics endpoint:', analyticsError);
                    
                    // If both fail, return a mock response for development
                    console.log('Returning mock analytics data for development');
                    return {
                        data: {
                            users: {
                                total: 100,
                                active: 75,
                                premium: 30,
                                newThisMonth: 15
                            },
                            workouts: {
                                total: 500,
                                completed: 450,
                                averagePerUser: "5.00",
                                mostPopular: "Full Body Workout"
                            },
                            finance: {
                                totalRevenue: "5000.00",
                                revenueThisMonth: "1200.00",
                                membershipRevenue: "4000.00",
                                trainerRevenue: "1000.00"
                            },
                            memberships: {
                                total: 80,
                                active: 65,
                                mostPopular: "Premium"
                            },
                            trainers: {
                                total: 10,
                                active: 8
                            }
                        }
                    };
                });
        });
};

export const getUserProgressReportsAdmin = () => {
    return API.get('/admin/progress-reports');
};

export const generateReportAdmin = (reportType, startDate, endDate, userId) => {
    return API.post('/admin/generate-report', 
        { reportType, startDate, endDate, userId }, 
        { responseType: 'blob' }
    );
};

// Add a new function to get memberships for a specific user as admin
export const getUserMembershipsAdmin = (userId) => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('No token found for getUserMembershipsAdmin API call');
        return Promise.resolve({ data: [] });
    }
    
    // Try the admin-specific endpoint first
    return API.get(`/admin/memberships/user/${userId}`)
        .then(response => {
            console.log(`Successfully fetched ${response.data.length} memberships for user ${userId} from admin endpoint`);
            return response;
        })
        .catch(error => {
            console.warn(`Error in getUserMembershipsAdmin for ${userId}:`, error);
            
            // Try the general admin memberships endpoint as fallback
            return API.get('/admin/memberships')
                .then(generalResponse => {
                    // Filter memberships for the specific user
                    const userMemberships = generalResponse.data.filter(membership => 
                        (membership.userId && (membership.userId === userId || membership.userId._id === userId)) || 
                        membership.user === userId
                    );
                    
                    console.log(`Found ${userMemberships.length} memberships for user ${userId} in general admin endpoint`);
                    return { data: userMemberships };
                })
                .catch(generalError => {
                    console.error(`Error fetching from general admin endpoint:`, generalError);
                    
                    // Create a sample membership if all endpoints fail
                    const sampleMembership = {
                        _id: `sample-${userId}`,
                        userId: userId,
                        planType: 'Standard',
                        status: 'Active',
                        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
                        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),   // 60 days from now
                        price: 29.99
                    };
                    
                    return { data: [sampleMembership] };
                });
        });
};

// Function to get user memberships as admin with fallback mechanisms
export const getAdminUserMemberships = (userId) => {
    // Check if token exists
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('No token found for getAdminUserMemberships API call');
        return Promise.resolve({ data: [] }); // Return empty array instead of rejecting
    }
    
    // First try the admin-specific endpoint using getUserMembershipsAdmin
    return getUserMembershipsAdmin(userId)
        .then(response => {
            if (response.data && response.data.length > 0) {
                return response;
            }
            
            // If no data from admin endpoint, try the direct user memberships endpoint
            console.log(`No memberships found in admin endpoint for ${userId}, trying direct endpoint`);
            return API.get(`/memberships/user/${userId}`)
                .then(directResponse => {
                    if (directResponse.data && directResponse.data.length > 0) {
                        console.log(`Found ${directResponse.data.length} memberships for user ${userId} in direct endpoint`);
                        return directResponse;
                    }
                    
                    // If still no data, return the empty array from the admin endpoint
                    console.log(`No memberships found for user ${userId} in any endpoints`);
                    return response;
                })
                .catch(directError => {
                    console.error(`Error fetching from direct endpoint for ${userId}:`, directError);
                    // Return whatever we got from the admin endpoint
                    return response;
                });
        });
};

// User API
export const loginUser = async (email, password) => {
    try {
        // Clear any existing tokens before login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        
        // Use the environment variable for the API URL
        const baseURL = getServerUrl();
        
        console.log(`Attempting login with server at ${baseURL}`);
        
        // Create a new axios instance for this request
        const loginAPI = axios.create({
            baseURL,
            timeout: 60000 // Increased to 60 seconds
        });
        
        const response = await loginAPI.post('/users/login', { email, password });
        
        // Update the API baseURL
        updateServerPort();
        
        return response;
    } catch (error) {
        console.error('Login error:', error);
        
        // Provide more detailed error messages
        if (error.response && error.response.status === 401) {
            throw new Error('Invalid email or password. Please try again.');
        }
        
        // Provide a more user-friendly error message for server connection issues
        if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
            console.warn('Server connection timeout or error. Retrying with longer timeout...');
            
            try {
                // Retry with even longer timeout
                const retryAPI = axios.create({
                    baseURL: getServerUrl(),
                    timeout: 120000 // 120 seconds (2 minutes) for retry
                });
                
                const retryResponse = await retryAPI.post('/users/login', { email, password });
                return retryResponse;
            } catch (retryError) {
                console.error('Retry login failed:', retryError);
                throw new Error('Server connection failed. The server might be temporarily unavailable. Please try again later.');
            }
        }
        
        throw error;
    }
};

export const registerUser = async (data) => {
    try {
        // Use the environment variable for the API URL
        const baseURL = getServerUrl();
        
        console.log(`Attempting registration with server at ${baseURL}`);
        
        // Create a new axios instance for this request
        const registerAPI = axios.create({
            baseURL,
            timeout: 60000 // Increased to 60 seconds
        });
        
        // Log the FormData contents for debugging
        if (data instanceof FormData) {
            console.log('Registration FormData contents:');
            for (let pair of data.entries()) {
                // Don't log the actual file content, just its presence
                if (pair[0] === 'image' && pair[1] instanceof File) {
                    console.log(`${pair[0]}: [File] ${pair[1].name} (${pair[1].size} bytes)`);
                } else {
                    console.log(`${pair[0]}: ${pair[1]}`);
                }
            }
        }
        
        const response = await registerAPI.post('/users/register', data, {
            headers: {
                'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json'
            }
        });
        
        // Update the API baseURL
        updateServerPort();
        
        return response;
    } catch (error) {
        console.error('Registration error:', error);
        
        // Provide more detailed error messages
        if (error.response && error.response.data && error.response.data.message) {
            throw new Error(error.response.data.message);
        }
        
        // Handle connection timeouts and network errors
        if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
            console.warn('Server connection timeout or error. Retrying with longer timeout...');
            
            try {
                // Retry with even longer timeout
                const retryAPI = axios.create({
                    baseURL: getServerUrl(),
                    timeout: 120000 // 120 seconds (2 minutes) for retry
                });
                
                const retryResponse = await retryAPI.post('/users/register', data, {
                    headers: {
                        'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json'
                    }
                });
                return retryResponse;
            } catch (retryError) {
                console.error('Retry registration failed:', retryError);
                throw new Error('Server connection failed. The server might be temporarily unavailable. Please try again later.');
            }
        }
        
        throw error;
    }
};

export const getUserById = () => {
    return API.get('/users/profile');
};

export const updateUser = async (formData) => {
    try {
        console.log("=== API.updateUser called with FormData ===");
        
        // Check if token exists before proceeding
        const token = localStorage.getItem('token');
        if (!token) {
            console.error("No authentication token found");
            throw new Error("Authentication required");
        }
        
        // Log FormData contents for debugging without exposing file content
        if (formData instanceof FormData) {
            console.log("FormData contents:");
            for (let [key, value] of formData.entries()) {
                if (value instanceof File) {
                    console.log(`${key}: [File] ${value.name} (${value.size} bytes, type: ${value.type})`);
                } else {
                    console.log(`${key}: ${value}`);
                }
            }
        } else {
            console.log("Regular object:", formData);
        }
        
        // Configure the request
        const config = {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            // Set a longer timeout for image uploads (3 minutes)
            timeout: 180000
        };
        
        // IMPORTANT: Do NOT set Content-Type header for FormData
        // The browser will set it automatically with the correct boundary
        
        console.log("Making API request to /users/profile with:");
        console.log("- Method: PUT");
        console.log("- Is FormData:", formData instanceof FormData);
        console.log("- Auth header present:", !!config.headers.Authorization);
        console.log("- Timeout:", config.timeout + "ms");
        
        // Make the request using axios directly to ensure FormData is properly sent
        const response = await axios.put(`${API.defaults.baseURL}/users/profile`, formData, config);
        console.log("API response received:", response.status);
        
        return response;
    } catch (error) {
        console.error("Error in updateUser API call:", error);
        
        // Log detailed error info
        if (error.response) {
            console.error("Response error:", error.response.status, error.response.data);
        } else if (error.request) {
            console.error("Request error (no response):", error.request);
        } else {
            console.error("Error message:", error.message);
        }
        
        throw error;
    }
};

export const updateUserWithImage = async (formData) => {
    try {
        console.log("updateUserWithImage called with FormData");
        
        // Get token
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error("Authentication required - no token found");
        }
        
        // Log what's in the FormData
        console.log("FormData contents:");
        for (let [key, value] of formData.entries()) {
            if (value instanceof File) {
                console.log(`${key}: [File] ${value.name} (${value.size} bytes, type: ${value.type})`);
            } else {
                console.log(`${key}: ${value}`);
            }
        }
        
        // Check if the image field is a URL (from Cloudinary) instead of a file
        const imageEntry = formData.get('image');
        if (typeof imageEntry === 'string' && imageEntry.includes('cloudinary.com')) {
            console.log("Found Cloudinary URL in FormData, converting to JSON request");
            
            // Extract all data from FormData into a plain object
            const jsonData = {};
            for (let [key, value] of formData.entries()) {
                // Skip file entries - we're using the URL instead
                if (!(value instanceof File)) {
                    jsonData[key] = value;
                }
            }
            
            // Use regular API.put for JSON data with Cloudinary URL
            console.log("Making JSON request with image URL");
            const response = await API.put(`/users/profile`, jsonData);
            console.log("Upload successful - status:", response.status);
            
            return response;
        }
        
        // Configure request with full headers
        const config = {
            headers: {
                'Authorization': `Bearer ${token}`,
                // Don't set Content-Type for FormData (browser sets it with boundary)
            },
            timeout: 180000 // 3 minutes
        };
        
        console.log("Making direct request to server for image upload");
        console.log(`URL: ${API_URL}/users/profile`);
        console.log("Auth header included:", !!config.headers.Authorization);
        
        // Make request using direct axios call
        const response = await axios.put(`${API_URL}/users/profile`, formData, config);
        console.log("Upload successful - status:", response.status);
        console.log("Response data:", response.data);
        
        // Add a cache-busting parameter to the image URL if present
        if (response.data) {
            // Check both image and imageUrl fields for compatibility
            const imageUrl = response.data.image || response.data.imageUrl;
            
            if (imageUrl) {
                console.log("Original image URL:", imageUrl);
                
                // Add timestamp to prevent caching
                const timestamp = new Date().getTime();
                const updatedImageUrl = imageUrl.includes('?') 
                    ? `${imageUrl.split('?')[0]}?t=${timestamp}` 
                    : `${imageUrl}?t=${timestamp}`;
                
                response.data.image = updatedImageUrl;
                if (response.data.imageUrl) {
                    response.data.imageUrl = updatedImageUrl;
                }
                
                console.log("Updated image URL with cache busting:", updatedImageUrl);
            }
        }
        
        return response;
    } catch (error) {
        console.error("Error in updateUserWithImage:", error);
        
        // Detailed error logging
        if (error.response) {
            console.error("Server returned error:", error.response.status, error.response.data);
        } else if (error.request) {
            console.error("No response received from server");
        } else {
            console.error("Error setting up request:", error.message);
        }
        
        throw error;
    }
};

// Trainer API
export const loginTrainer = (email, password) => {
    return API.post('/trainers/login', { email, password });
};

export const registerTrainer = (data) => {
    return API.post('/trainers/register', data);
};

// Updated to use the public endpoint for regular users
export const getAllTrainers = async () => {
    return API.get('/trainers/available');
};

// Goals API
export const getGoalsByUserId = async (userId, params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        
        // Add optional query parameters
        if (params.status) queryParams.append('status', params.status);
        
        const queryString = queryParams.toString();
        const url = `/goals/user/${userId}${queryString ? `?${queryString}` : ''}`;
        
        const response = await API.get(url);
        return response;
    } catch (error) {
        console.error('Error fetching goals:', error);
        const membershipError = handleMembershipError(error);
        if (membershipError.isMembershipError) {
            throw membershipError;
        }
        throw error;
    }
};

export const getAllUserGoals = async (userId, params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        
        // Add optional query parameters
        if (params.status) queryParams.append('status', params.status);
        if (params.goalType) queryParams.append('goalType', params.goalType);
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
        
        const queryString = queryParams.toString();
        const url = `/goals/all/${userId}${queryString ? `?${queryString}` : ''}`;
        
        const response = await API.get(url);
        return response;
    } catch (error) {
        console.error('Error fetching all user goals:', error);
        const membershipError = handleMembershipError(error);
        if (membershipError.isMembershipError) {
            throw membershipError;
        }
        throw error;
    }
};

export const getGoalById = async (goalId) => {
    try {
        const response = await API.get(`/goals/${goalId}`);
        return response;
    } catch (error) {
        console.error('Error fetching goal:', error);
        const membershipError = handleMembershipError(error);
        if (membershipError.isMembershipError) {
            throw membershipError;
        }
        throw error;
    }
};

export const createGoal = async (goalData) => {
    try {
        const response = await API.post('/goals', goalData);
        return response;
    } catch (error) {
        console.error('Error creating goal:', error);
        const membershipError = handleMembershipError(error);
        if (membershipError.isMembershipError) {
            throw membershipError;
        }
        throw error;
    }
};

export const updateGoal = async (goalId, goalData) => {
    try {
        const response = await API.put(`/goals/${goalId}`, goalData);
        return response;
    } catch (error) {
        console.error('Error updating goal:', error);
        const membershipError = handleMembershipError(error);
        if (membershipError.isMembershipError) {
            throw membershipError;
        }
        throw error;
    }
};

export const updateGoalProgress = async (goalId, progressData) => {
    try {
        const response = await API.put(`/goals/${goalId}/progress`, progressData);
        return response;
    } catch (error) {
        console.error('Error updating goal progress:', error);
        const membershipError = handleMembershipError(error);
        if (membershipError.isMembershipError) {
            throw membershipError;
        }
        throw error;
    }
};

export const deleteGoal = async (goalId) => {
    try {
        const response = await API.delete(`/goals/${goalId}`);
        return response;
    } catch (error) {
        console.error('Error deleting goal:', error);
        const membershipError = handleMembershipError(error);
        if (membershipError.isMembershipError) {
            throw membershipError;
        }
        throw error;
    }
};

export const getGoalStats = async (userId) => {
    try {
        const response = await API.get(`/goals/stats/${userId}`);
        return response;
    } catch (error) {
        console.error('Error fetching goal stats:', error);
        const membershipError = handleMembershipError(error);
        if (membershipError.isMembershipError) {
            throw membershipError;
        }
        throw error;
    }
};

// Workouts API
export const getWorkoutsByUserId = (userId) => {
    return API.get(`/workouts/user/${userId}`);
};

export const createWorkout = (workoutData) => {
    return API.post('/workouts', workoutData);
};

export const deleteWorkout = (workoutId) => {
    return API.delete(`/workouts/${workoutId}`);
};

export const updateTrainerProfile = async (trainerId, data) => {
    // Check if data is FormData and set the correct headers
    const config = {
        timeout: 30000 // Increase timeout for image uploads
    };
    if (data instanceof FormData) {
        // Important: Do NOT set Content-Type for FormData
        // Let the browser set it automatically with the correct boundary
        config.headers = {};
        console.log("Using FormData for trainer profile update");
    }
    return API.put(`/trainers/${trainerId}`, data, config);
};

export const getTrainerClients = () => {
    // Get the trainer ID from localStorage
    const trainer = JSON.parse(localStorage.getItem('trainer') || '{}');
    const trainerId = trainer._id || trainer.id;
    
    if (!trainerId) {
        console.error('No trainer ID found in localStorage');
        return Promise.reject(new Error('No trainer ID found'));
    }
    
    return API.get(`/trainers/${trainerId}/clients`);
};

// Workout Logs API
export const createWorkoutLog = async (workoutData) => {
    try {
        const response = await API.post('/workout-logs', workoutData);
        return response;
    } catch (error) {
        handleMembershipError(error);
        console.error('Error creating workout log:', error);
        throw error;
    }
};

export const getWorkoutLogs = async (userId, params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        
        if (userId) {
            queryParams.append('userId', userId);
        }
        
        if (params.startDate) {
            queryParams.append('startDate', params.startDate);
        }
        
        if (params.endDate) {
            queryParams.append('endDate', params.endDate);
        }
        
        if (params.limit) {
            queryParams.append('limit', params.limit);
        }
        
        if (params.page) {
            queryParams.append('page', params.page);
        }
        
        if (params.sort) {
            queryParams.append('sort', params.sort);
        }
        
        const queryString = queryParams.toString();
        const url = `/workout-logs/user/${userId}${queryString ? `?${queryString}` : ''}`;
        
        const response = await API.get(url);
        return response;
    } catch (error) {
        handleMembershipError(error);
        console.error('Error fetching workout logs:', error);
        throw error;
    }
};

export const getWorkoutLogById = async (logId) => {
    try {
        const response = await API.get(`/workout-logs/${logId}`);
        return response;
    } catch (error) {
        console.error('Error fetching workout log:', error);
        throw error;
    }
};

export const updateWorkoutLog = async (logId, workoutData) => {
    try {
        const response = await API.put(`/workout-logs/${logId}`, workoutData);
        return response;
    } catch (error) {
        console.error('Error updating workout log:', error);
        throw error;
    }
};

export const deleteWorkoutLog = async (logId) => {
    try {
        const response = await API.delete(`/workout-logs/${logId}`);
        return response;
    } catch (error) {
        console.error('Error deleting workout log:', error);
        throw error;
    }
};

export const getWorkoutStats = async (userId, period = 'month', startDate, endDate) => {
    try {
        const queryParams = new URLSearchParams();
        
        if (period) queryParams.append('period', period);
        if (startDate) queryParams.append('startDate', startDate);
        if (endDate) queryParams.append('endDate', endDate);
        
        const queryString = queryParams.toString();
        const url = `/workout-logs/stats/${userId}${queryString ? `?${queryString}` : ''}`;
        
        const response = await API.get(url);
        return response;
    } catch (error) {
        console.error('Error fetching workout stats:', error);
        throw error;
    }
};

// Workout Programs API
export const getWorkoutPrograms = async (userId, params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        
        // Add optional query parameters
        if (params.category) queryParams.append('category', params.category);
        if (params.difficulty) queryParams.append('difficulty', params.difficulty);
        
        const queryString = queryParams.toString();
        const url = `/workout-programs/${userId}${queryString ? `?${queryString}` : ''}`;
        
        const response = await API.get(url);
        return response;
    } catch (error) {
        console.error('Error fetching workout programs:', error);
        const membershipError = handleMembershipError(error);
        if (membershipError.isMembershipError) {
            throw membershipError;
        }
        throw error;
    }
};

export const getLibraryWorkoutPrograms = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        
        // Add optional query parameters
        if (params.category) queryParams.append('category', params.category);
        if (params.difficulty) queryParams.append('difficulty', params.difficulty);
        if (params.search) queryParams.append('search', params.search);
        
        const queryString = queryParams.toString();
        const url = `/workout-programs/library${queryString ? `?${queryString}` : ''}`;
        
        const response = await API.get(url);
        return response;
    } catch (error) {
        console.error('Error fetching library workout programs:', error);
        throw error;
    }
};

export const getWorkoutProgramById = async (programId) => {
    try {
        const response = await API.get(`/workout-programs/program/${programId}`);
        return response;
    } catch (error) {
        console.error('Error fetching workout program:', error);
        throw error;
    }
};

export const createWorkoutProgram = async (programData) => {
    try {
        const response = await API.post('/workout-programs', programData);
        return response;
    } catch (error) {
        console.error('Error creating workout program:', error);
        throw error;
    }
};

export const updateWorkoutProgram = async (programId, programData) => {
    try {
        const response = await API.put(`/workout-programs/${programId}`, programData);
        return response;
    } catch (error) {
        console.error('Error updating workout program:', error);
        throw error;
    }
};

export const deleteWorkoutProgram = async (programId) => {
    try {
        const response = await API.delete(`/workout-programs/${programId}`);
        return response;
    } catch (error) {
        console.error('Error deleting workout program:', error);
        throw error;
    }
};

export const assignWorkoutProgram = async (assignData) => {
    try {
        const response = await API.post('/workout-programs/assign', assignData);
        return response;
    } catch (error) {
        console.error('Error assigning workout program:', error);
        throw error;
    }
};

export const getTrainerById = (trainerId) => {
    return API.get(`/trainers/${trainerId}`);
};

// Membership API
export const getUserMemberships = (userId) => {
    // Check if token exists
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('No token found for getUserMemberships API call');
        return Promise.resolve({ data: [] }); // Return empty array instead of rejecting
    }
    
    return API.get(`/memberships/user/${userId}`)
        .catch(error => {
            // If there's an authentication error, just return an empty array
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                console.warn(`Authentication error in getUserMemberships for user ${userId} - returning empty array`);
                return { data: [] };
            }
            
            // For other errors, reject the promise
            return Promise.reject(error);
        });
};

export const createMembership = (membershipData) => {
    return API.post('/memberships', membershipData);
};

export const updateMembership = (membershipId, membershipData) => {
    console.log('Updating membership:', membershipId, membershipData);
    
    if (!membershipId) {
        console.error('No membership ID provided for update');
        return Promise.reject(new Error('Membership ID is required'));
    }
    
    return API.put(`/memberships/${membershipId}`, membershipData)
        .then(response => {
            console.log('Successfully updated membership');
            return response;
        })
        .catch(error => {
            console.error('Error updating membership:', error);
            
            // Try admin endpoint as fallback
            console.log('Trying admin endpoint as fallback for membership update');
            return API.put(`/admin/memberships/${membershipId}`, membershipData)
                .then(response => {
                    console.log('Successfully updated membership via admin endpoint');
                    return response;
                })
                .catch(adminError => {
                    console.error('Error updating membership via admin endpoint:', adminError);
                    throw error; // Throw the original error
                });
        });
};

export const fixMembership = (userId, membershipId) => {
    return API.post(`/memberships/fix/${membershipId}`, { userId });
};

export const fixAllMemberships = (userId) => {
    return API.post('/memberships/fix-all', { userId });
};

// Payment API
export const getUserPayments = (userId) => {
    return API.get(`/payments/user/${userId}`);
};

export const createPayment = (paymentData) => {
    return API.post('/payments', paymentData);
};

export const createPendingPayment = (paymentData) => {
    return API.post('/payments/create-pending', paymentData);
};

export const sendPaymentOTP = (userId, email) => {
    return API.post('/payments/send-otp', { userId, email });
};

export const verifyPaymentOTP = (userId, otp) => {
    return API.post('/payments/verify-otp', { userId, otp });
};

export const verifyPaymentSession = (sessionId) => {
    return API.get(`/payments/verify-session?session_id=${sessionId}`);
};

export const updatePayment = (paymentId, paymentData) => {
    console.log('Updating payment:', paymentId, paymentData);
    
    if (!paymentId) {
        console.error('No payment ID provided for update');
        return Promise.reject(new Error('Payment ID is required'));
    }
    
    return API.put(`/payments/${paymentId}`, paymentData)
        .then(response => {
            console.log('Successfully updated payment');
            return response;
        })
        .catch(error => {
            console.error('Error updating payment:', error);
            
            // Try admin endpoint as fallback
            console.log('Trying admin endpoint as fallback for payment update');
            return API.put(`/admin/payments/${paymentId}`, paymentData)
                .then(response => {
                    console.log('Successfully updated payment via admin endpoint');
                    return response;
                })
                .catch(adminError => {
                    console.error('Error updating payment via admin endpoint:', adminError);
                    throw error; // Throw the original error
                });
        });
};

// Appointment API
export const getUserAppointments = async (userId) => {
    return API.get(`/appointments/${userId}`);
};

export const bookAppointment = async (appointmentData) => {
    return API.post('/appointments', appointmentData);
};

export const updateAppointmentStatus = async (appointmentId, status) => {
    return API.put(`/appointments/${appointmentId}`, { status });
};

export const getTrainerAppointments = async (trainerId) => {
    return API.get(`/appointments/trainer/${trainerId}`);
};

export const getUserCurrentTrainer = async (userId) => {
    try {
        return await API.get(`/users/${userId}/confirmed-appointments`);
    } catch (error) {
        console.warn("Error fetching confirmed appointments:", error.message);
        // Return an empty array instead of throwing an error
        return { data: [] };
    }
};

// Progress Reports API
export const getClientProgressReports = async (clientId) => {
  return API.get(`/progress-reports/client/${clientId}`);
};

export const getTrainerProgressReports = async (trainerId) => {
  return API.get(`/progress-reports/trainer/${trainerId}`);
};

export const getProgressReportById = async (reportId) => {
  return API.get(`/progress-reports/${reportId}`);
};

export const createProgressReport = async (reportData) => {
  return API.post('/progress-reports', reportData);
};

// Notifications API
export const getNotifications = async (recipientId) => {
  try {
    // Check if the user is a trainer based on the URL or stored role
    const isTrainer = window.location.pathname.includes('/trainer') || localStorage.getItem('role') === 'trainer';
    
    // Use the appropriate endpoint based on the user type
    if (isTrainer) {
      console.log("Fetching trainer notifications");
      return API.get(`/notifications/trainer/${recipientId}`);
    } else {
      console.log("Fetching user notifications");
      return API.get(`/notifications/user/${recipientId}`);
    }
  } catch (error) {
    console.error("Error in getNotifications:", error);
    // Return empty array as fallback
    return { data: [] };
  }
};

export const markNotificationAsRead = async (notificationId) => {
  return API.put(`/notifications/${notificationId}`);
};

export const sendNotification = async (notificationData) => {
  return API.post('/notifications/send', notificationData);
};

// Trainer payment API
export const getTrainerPayments = async (trainerId) => {
    return API.get(`/trainer-payments/${trainerId}`);
};

export const getTrainerPaymentStats = async (trainerId) => {
    return API.get(`/trainer-payments/stats/${trainerId}`);
};

export const createTrainerPayment = async (paymentData) => {
    return API.post('/trainer-payments', paymentData);
};

export const generateMonthlyPayments = async (month, year) => {
    return API.post('/trainer-payments/generate-monthly', { month, year });
};

// SPA Services API
export const getSpaServices = async () => {
  try {
    const response = await API.get('/spa/services');
    return response;
  } catch (error) {
    console.error('Error fetching SPA services:', error);
    const membershipError = handleMembershipError(error);
    if (membershipError.isMembershipError) {
        throw membershipError;
    }
    throw error;
  }
};

export const getSpaServiceById = async (serviceId) => {
  try {
    const response = await API.get(`/spa/services/${serviceId}`);
    return response;
  } catch (error) {
    console.error('Error fetching spa service:', error);
    throw error;
  }
};

export const getSpaReports = async (period = 'month') => {
  try {
    const response = await API.get(`/spa/report?period=${period}`);
    return response;
  } catch (error) {
    console.error('Error fetching spa reports:', error);
    throw error;
  }
};

export const createSpaService = async (serviceData) => {
  try {
    const response = await API.post('/spa/services', serviceData);
    return response;
  } catch (error) {
    console.error('Error creating spa service:', error);
    throw error;
  }
};

export const updateSpaService = async (serviceId, serviceData) => {
  try {
    const response = await API.put(`/spa/services/${serviceId}`, serviceData);
    return response;
  } catch (error) {
    console.error('Error updating spa service:', error);
    throw error;
  }
};

export const deleteSpaService = async (serviceId) => {
  try {
    const response = await API.delete(`/spa/services/${serviceId}`);
    return response;
  } catch (error) {
    console.error('Error deleting spa service:', error);
    throw error;
  }
};

export const getUserSpaBookings = async (userId) => {
  try {
    const response = await API.get(`/spa/bookings/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user SPA bookings:', error);
        const membershipError = handleMembershipError(error);
        if (membershipError.isMembershipError) {
            throw membershipError;
        }
    throw error;
  }
};

export const checkFreeSessionEligibility = async (userId) => {
  try {
    const response = await API.get(`/spa/bookings/free-eligibility/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error checking free session eligibility:', error);
        const membershipError = handleMembershipError(error);
        if (membershipError.isMembershipError) {
            throw membershipError;
        }
    throw error;
  }
};

export const bookSpaSession = async (bookingData) => {
  try {
    const response = await API.post('/spa/bookings', bookingData);
    return response.data;
  } catch (error) {
    console.error('Error booking SPA session:', error);
        const membershipError = handleMembershipError(error);
        if (membershipError.isMembershipError) {
            throw membershipError;
        }
    throw error;
  }
};

export const cancelSpaBooking = async (bookingId) => {
  try {
    const response = await API.delete(`/spa/bookings/${bookingId}`);
    return response.data;
  } catch (error) {
    console.error('Error cancelling SPA booking:', error);
        const membershipError = handleMembershipError(error);
        if (membershipError.isMembershipError) {
            throw membershipError;
        }
    throw error;
  }
};

export const updateSpaBookingStatus = async (bookingId, status) => {
  try {
    const response = await API.put(`/spa/bookings/${bookingId}`, { status });
    return response;
  } catch (error) {
    console.error('Error updating SPA booking status:', error);
    throw error;
  }
};

// Announcements API
export const getAnnouncements = () => {
  return API.get('/announcements');
};

export const getAnnouncementsAdmin = () => {
  return API.get('/admin/announcements');
};

export const createAnnouncement = (announcementData) => {
  return API.post('/admin/announcements', announcementData);
};

export const updateAnnouncement = (id, announcementData) => {
  return API.put(`/admin/announcements/${id}`, announcementData);
};

export const deleteAnnouncement = (id) => {
  return API.delete(`/admin/announcements/${id}`);
};

// Helper functions for caching
function getCachedData(key) {
    return apiCache.get(key);
}

function setCachedData(key, data) {
    apiCache.set(key, data);
}

// Add this function to handle membership access errors
export const handleMembershipError = (error) => {
    if (error.response && error.response.status === 403) {
        const data = error.response.data;
        
        // Check if this is a membership access error
        if (data.error && (
            data.error.includes('Access denied') || 
            data.error.includes('membership required')
        )) {
            // Return structured error for UI handling
            return {
                isMembershipError: true,
                message: data.error,
                requiredPlans: data.requiredPlans || [],
                currentPlan: data.currentPlan || 'None'
            };
        }
    }
    
    // Not a membership error
    return {
        isMembershipError: false,
        message: error.message || 'An error occurred'
    };
};

// Workout Log API Functions
export const getAssignedWorkouts = async () => {
    try {
        const response = await API.get('/workouts/assigned');
        return response;
    } catch (error) {
        handleMembershipError(error);
        throw error;
    }
};

export const markAssignedWorkoutCompleted = async (workoutId) => {
    try {
        const response = await API.put(`/workouts/assigned/${workoutId}/complete`, {});
        return response;
    } catch (error) {
        handleMembershipError(error);
        throw error;
    }
};

/**
 * Update user fields (no image upload)
 * 
 * @param {Object} fields - Object containing user fields to update 
 * @returns {Promise} - API response
 */
export const updateUserFields = async (fields) => {
    console.log("Updating user fields (no image):", fields);
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found');
        }
        
        const response = await axios.put(`${import.meta.env.VITE_API_URL}/users/update-fields`, fields, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 seconds timeout
        });
        
        console.log("Fields update successful:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error updating user fields:", error);
        
        // Enhance error reporting
        if (error.response) {
            console.error('Error response status:', error.response.status);
            console.error('Error response data:', error.response.data);
            throw new Error(error.response.data.error || 'Failed to update user fields');
        } else if (error.request) {
            console.error('No response received. Request:', error.request);
            throw new Error('No response from server. Please try again later.');
        } else {
            console.error('Error message:', error.message);
            throw error;
        }
    }
};

export const getAllSpaBookings = async () => {
  try {
    const response = await API.get('/spa/bookings');
    return response;
  } catch (error) {
    console.error('Error fetching all SPA bookings:', error);
    throw error;
  }
};

// Make sure API is exported as the default export
export default API;