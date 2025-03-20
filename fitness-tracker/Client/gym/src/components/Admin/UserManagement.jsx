import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  manageUsers, 
  getUserActivity, 
  adminUpdateUser, 
  adminDeleteUser, 
  getUserMemberships,
  getAdminUserMemberships,
  getUserMembershipsAdmin,
  createUserActivity
} from '../../api';
import { FaEdit, FaEye, FaLock, FaUnlock, FaBell, FaSync } from 'react-icons/fa';
import "../../styles/AdminStyle.css";
import axios from 'axios';

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [userMemberships, setUserMemberships] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userActivity, setUserActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    membershipPlan: '',
    goals: []
  });
  const [notification, setNotification] = useState({
    message: '',
    type: 'Announcement'
  });
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [membershipFilter, setMembershipFilter] = useState('all');

  useEffect(() => {
    // Check if we have the necessary data before fetching users
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const adminUser = localStorage.getItem('adminUser');
    
    console.log('UserManagement - Initial authentication check:', { 
      hasToken: !!token, 
      role, 
      hasAdminUser: !!adminUser,
      tokenPrefix: token ? token.substring(0, 10) + '...' : 'No token'
    });
    
    if (!token || role !== 'admin' || !adminUser) {
      setError('Authentication required. Please log in as an admin.');
      setLoading(false);
      return;
    }
    
    fetchUsers();
  }, []);

  const refreshAdminToken = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get admin data from localStorage
      const adminData = localStorage.getItem('adminUser');
      if (!adminData) {
        throw new Error('No admin data found. Please log in again.');
      }
      
      const admin = JSON.parse(adminData);
      
      // Make a request to refresh the token
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5050/api'}/admin/refresh-token`, {
        adminId: admin._id
      });
      
      if (response.data && response.data.token) {
        // Update the token in localStorage
        localStorage.setItem('token', response.data.token);
        console.log('Admin token refreshed successfully');
        
        // Fetch users again with the new token
        await fetchUsers();
      } else {
        throw new Error('Failed to refresh token');
      }
    } catch (err) {
      console.error('Error refreshing admin token:', err);
      setError('Failed to refresh token: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Check if token exists before making the API call
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');
      const adminUser = localStorage.getItem('adminUser');
      
      console.log('UserManagement - Authentication check:', { 
        hasToken: !!token, 
        role, 
        hasAdminUser: !!adminUser,
        tokenPrefix: token ? token.substring(0, 10) + '...' : 'No token'
      });
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      if (role !== 'admin') {
        throw new Error('You do not have permission to access this resource.');
      }
      
      // Make a direct API call with explicit headers to bypass interceptors
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5050/api'}/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('UserManagement - Users fetched successfully:', response.data.length);
      setUsers(response.data);
      
      // Fetch memberships for each user
      const memberships = {};
      
      // Use Promise.allSettled to fetch all memberships in parallel and handle errors gracefully
      const membershipPromises = response.data.map(user => 
        getAdminUserMemberships(user._id)
          .then(membershipResponse => {
            const activeMembership = membershipResponse.data.find(m => m.status === 'Active');
            memberships[user._id] = activeMembership || null;
          })
          .catch(err => {
            console.error(`Failed to fetch memberships for user ${user._id}:`, err);
            memberships[user._id] = null; // Set to null on error
          })
      );
      
      // Wait for all membership requests to complete (successfully or with errors)
      await Promise.allSettled(membershipPromises);
      
      setUserMemberships(memberships);
    } catch (err) {
      console.error('Error in fetchUsers:', err);
      
      // Provide more detailed error information
      let errorMessage = 'Failed to fetch users: ';
      
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Server response error:', {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data
        });
        
        errorMessage += `${err.response.status} ${err.response.statusText} - ${err.response.data.message || 'Unknown server error'}`;
        
        // Don't redirect automatically for auth errors, just show the error
        if (err.response.status === 401 || err.response.status === 403) {
          errorMessage += ' (Authentication error)';
        }
      } else if (err.request) {
        // The request was made but no response was received
        console.error('No response received:', err.request);
        errorMessage += 'No response received from server';
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Request setup error:', err.message);
        errorMessage += err.message;
      }
      
      setError(errorMessage);
      
      // Only redirect if explicitly requested by clicking a button
      // Don't auto-redirect on error
    } finally {
      setLoading(false);
    }
  };

  const handleViewActivity = async (userId) => {
    try {
      setActivityLoading(true);
      setSelectedUser(users.find(user => user._id === userId));
      
      console.log(`Fetching activity for user ${userId} in UserManagement component`);
      
      // Use a direct API call with explicit headers to bypass interceptors
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';
      
      // Try the admin endpoint first
      try {
        const response = await axios.get(`${apiUrl}/admin/users/${userId}/activity`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log(`Successfully fetched ${response.data.length} activities from admin endpoint`);
        setUserActivity(response.data);
        return;
      } catch (adminError) {
        console.error('Error fetching from admin endpoint:', adminError);
        
        // Try the fallback endpoint
        try {
          const fallbackResponse = await axios.get(`${apiUrl}/admin/user-activity/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log(`Successfully fetched ${fallbackResponse.data.length} activities from fallback endpoint`);
          setUserActivity(fallbackResponse.data);
          return;
        } catch (fallbackError) {
          console.error('Error fetching from fallback endpoint:', fallbackError);
          
          // If both admin endpoints fail, use the getUserActivity function as a last resort
          const activityResponse = await getUserActivity(userId);
          console.log(`Fetched ${activityResponse.data.length} activities using getUserActivity function`);
          setUserActivity(activityResponse.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch user activity:', err);
      setError('Failed to fetch user activity: ' + (err.response?.data?.message || err.message));
      
      // If all attempts fail, set some sample activity data
      setUserActivity([
        {
          _id: 'sample1',
          activityType: 'Login',
          description: 'User logged into the system',
          timestamp: new Date(Date.now() - 86400000) // 1 day ago
        },
        {
          _id: 'sample2',
          activityType: 'Profile Update',
          description: 'User updated their profile',
          timestamp: new Date(Date.now() - 43200000) // 12 hours ago
        }
      ]);
    } finally {
      setActivityLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setEditMode(true);
    setSelectedUser(user);
    
    // Get the current membership plan
    const membership = userMemberships[user._id];
    let membershipPlan = 'standard';
    
    if (membership && membership.planType) {
      // Use the membership planType if available
      membershipPlan = membership.planType.toLowerCase();
    } else if (user.membershipPlan) {
      // Fallback to user's membershipPlan if available
      membershipPlan = user.membershipPlan.toLowerCase();
    }
    
    // Normalize plan names to match the select options
    if (['basic', 'standard'].includes(membershipPlan)) {
      membershipPlan = 'standard';
    } else if (membershipPlan === 'premium') {
      membershipPlan = 'premium';
    } else if (membershipPlan === 'elite') {
      membershipPlan = 'elite';
    }
    
    setEditData({
      name: user.name,
      email: user.email,
      membershipPlan: membershipPlan,
      goals: user.goals || []
    });
  };

  const handleUpdateUser = async () => {
    try {
      await adminUpdateUser(selectedUser._id, editData);
      setUsers(users.map(user => 
        user._id === selectedUser._id ? { ...user, ...editData } : user
      ));
      setEditMode(false);
      setSelectedUser(null);
      alert('User updated successfully!');
    } catch (err) {
      setError('Failed to update user: ' + err.message);
    }
  };

  const handleSuspendUser = async (userId, isSuspended) => {
    try {
      await adminUpdateUser(userId, { isSuspended: !isSuspended });
      setUsers(users.map(user => 
        user._id === userId ? { ...user, isSuspended: !isSuspended } : user
      ));
      alert(`User ${isSuspended ? 'unsuspended' : 'suspended'} successfully!`);
    } catch (err) {
      setError(`Failed to ${isSuspended ? 'unsuspend' : 'suspend'} user: ` + err.message);
    }
  };

  const handleSendNotification = async () => {
    if (!notification.message.trim()) {
      alert('Please enter a notification message');
      return;
    }

    try {
      // Create a user activity for notification
      await createUserActivity({
        userId: selectedUser._id,
        activityType: 'Notification',
        description: notification.message
      });
      
      setNotification({ message: '', type: 'Announcement' });
      setShowNotificationForm(false);
      alert('Notification sent successfully!');
    } catch (err) {
      setError('Failed to send notification: ' + err.message);
    }
  };

  const handleBulkNotification = async () => {
    if (!notification.message.trim()) {
      alert('Please enter a notification message');
      return;
    }

    try {
      // Send notification to all users
      const promises = users.map(user => 
        createUserActivity({
          userId: user._id,
          activityType: 'Notification',
          description: notification.message
        })
      );
      await Promise.all(promises);
      setNotification({ message: '', type: 'Announcement' });
      setShowNotificationForm(false);
      alert('Bulk notification sent successfully!');
    } catch (err) {
      setError('Failed to send bulk notification: ' + err.message);
    }
  };

  // Helper function to get membership info
  const getMembershipInfo = (userId) => {
    const membership = userMemberships[userId];
    if (!membership) return 'No Active Membership';
    
    // Check if the membership has a valid planType
    if (!membership.planType || membership.planType === 'standard') {
      // If planType is missing or standard, check if there's a plan in editData
      const user = users.find(u => u._id === userId);
      if (user && user.membershipPlan) {
        return `${user.membershipPlan.charAt(0).toUpperCase() + user.membershipPlan.slice(1)} (${membership.duration || 'Monthly'})`;
      }
    }
    
    // Format the plan type to ensure first letter is capitalized
    const planType = membership.planType 
      ? membership.planType.charAt(0).toUpperCase() + membership.planType.slice(1) 
      : 'Basic';
    
    return `${planType} (${membership.duration || 'Monthly'})`;
  };

  const handleRetryLogin = () => {
    // Clear token and navigate to login
    localStorage.removeItem('token');
    navigate('/admin/login');
  };

  const viewUser = async (user) => {
    try {
      setSelectedUser(user);
      setActivityLoading(true);
      
      // Fetch user activity
      const activityResponse = await getUserActivity(user._id);
      setUserActivity(activityResponse.data);
      
      // Fetch user memberships directly when viewing a user
      const membershipResponse = await getAdminUserMemberships(user._id);
      if (membershipResponse.data && membershipResponse.data.length > 0) {
        // Update the membership for this specific user
        setUserMemberships(prevMemberships => ({
          ...prevMemberships,
          [user._id]: membershipResponse.data.find(m => m.status === 'Active') || membershipResponse.data[0]
        }));
      }
      
      setEditMode(false);
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setActivityLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const nameMatch = user.name.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = statusFilter === 'all' || (user.isSuspended ? 'inactive' : 'active') === statusFilter;
    const membershipMatch = membershipFilter === 'all' || (user.membershipPlan || '').toLowerCase() === membershipFilter;
    return nameMatch && statusMatch && membershipMatch;
  });

  if (loading) return <div className="loading">Loading users...</div>;
  if (error) return (
    <div className="error-container">
      <div className="error">{error}</div>
      <div className="error-actions">
        <button onClick={() => fetchUsers()} className="retry-button">
          <FaSync /> Retry
        </button>
        <button onClick={refreshAdminToken} className="refresh-button">
          <FaSync /> Refresh Token
        </button>
        <button onClick={handleRetryLogin} className="login-button">
          Go to Login
        </button>
      </div>
    </div>
  );

  return (
    <div className="user-management-container">
      <h2>User Management</h2>
      
      {/* User List */}
      <div className="user-list">
        <h3>All Users ({users.length})</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Membership Plan</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id} className={user.isSuspended ? 'suspended-user' : ''}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{getMembershipInfo(user._id)}</td>
                <td>{user.isSuspended ? 'Suspended' : 'Active'}</td>
                <td className="action-buttons">
                  <button 
                    onClick={() => viewUser(user)}
                    title="View Activity"
                    className="icon-button"
                  >
                    <FaEye />
                  </button>
                  <button 
                    onClick={() => handleEditUser(user)} 
                    title="Edit User"
                    className="icon-button"
                  >
                    <FaEdit />
                  </button>
                  <button 
                    onClick={() => handleSuspendUser(user._id, user.isSuspended)}
                    title={user.isSuspended ? "Unsuspend User" : "Suspend User"}
                    className="icon-button"
                  >
                    {user.isSuspended ? <FaUnlock /> : <FaLock />}
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedUser(user);
                      setShowNotificationForm(true);
                    }} 
                    title="Send Notification"
                    className="icon-button"
                  >
                    <FaBell />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bulk Notification Button */}
      <div className="bulk-notification">
        <button 
          onClick={() => {
            setSelectedUser(null);
            setShowNotificationForm(true);
          }}
          className="primary-button"
        >
          Send Bulk Notification
        </button>
      </div>

      {/* User Activity View */}
      {selectedUser && !editMode && !showNotificationForm && (
        <div className="user-activity">
          <h3>Activity for {selectedUser.name}</h3>
          {activityLoading ? (
            <div className="loading">Loading activity...</div>
          ) : userActivity.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Activity Type</th>
                  <th>Description</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {userActivity.map(activity => (
                  <tr key={activity._id}>
                    <td>{activity.activityType}</td>
                    <td>{activity.description}</td>
                    <td>{new Date(activity.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No activity found for this user.</p>
          )}
          <button 
            onClick={() => setSelectedUser(null)}
            className="secondary-button"
          >
            Close
          </button>
        </div>
      )}

      {/* Edit User Form */}
      {editMode && selectedUser && (
        <div className="edit-user-form">
          <h3>Edit User: {selectedUser.name}</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleUpdateUser();
          }}>
            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData({...editData, name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                value={editData.email}
                onChange={(e) => setEditData({...editData, email: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Membership Plan:</label>
              <select
                value={editData.membershipPlan}
                onChange={(e) => setEditData({...editData, membershipPlan: e.target.value})}
              >
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="elite">Elite</option>
              </select>
            </div>
            <div className="form-buttons">
              <button type="submit" className="primary-button">Save Changes</button>
              <button 
                type="button" 
                onClick={() => {
                  setEditMode(false);
                  setSelectedUser(null);
                }}
                className="secondary-button"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notification Form */}
      {showNotificationForm && (
        <div className="notification-form">
          <h3>Send {selectedUser ? `Notification to ${selectedUser.name}` : 'Bulk Notification'}</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            selectedUser ? handleSendNotification() : handleBulkNotification();
          }}>
            <div className="form-group">
              <label>Message:</label>
              <textarea
                value={notification.message}
                onChange={(e) => setNotification({...notification, message: e.target.value})}
                required
                rows={4}
              />
            </div>
            <div className="form-group">
              <label>Type:</label>
              <select
                value={notification.type}
                onChange={(e) => setNotification({...notification, type: e.target.value})}
              >
                <option value="Announcement">Announcement</option>
                <option value="Reminder">Reminder</option>
                <option value="Payment">Payment</option>
                <option value="Workout">Workout</option>
              </select>
            </div>
            <div className="form-buttons">
              <button type="submit" className="primary-button">Send Notification</button>
              <button 
                type="button" 
                onClick={() => {
                  setShowNotificationForm(false);
                  setNotification({ message: '', type: 'Announcement' });
                }}
                className="secondary-button"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UserManagement; 