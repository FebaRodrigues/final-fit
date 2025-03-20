import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';
import '../styles/NotificationIcon.css';

const NotificationIcon = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  // Sample notifications for demonstration
  const sampleNotifications = [
    {
      _id: '1',
      type: 'Workout',
      message: 'You have completed your weekly workout goal!',
      status: 'Unread',
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString()
    },
    {
      _id: '2',
      type: 'Goal',
      message: 'Your weight loss goal is 50% complete.',
      status: 'Unread',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
    },
    {
      _id: '3',
      type: 'System',
      message: 'Welcome to TrackFit! Start by setting up your fitness goals.',
      status: 'Read',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
    }
  ];

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user || !user.id) return;
      
      try {
        // Try to fetch from API
        try {
          const response = await API.get(`/notifications/user/${user.id}`);
          setNotifications(response.data.slice(0, 5)); // Get only the 5 most recent
          
          // Count unread notifications
          const unread = response.data.filter(n => n.status === 'Unread').length;
          setUnreadCount(unread);
        } catch (apiError) {
          console.log('API not available, using sample data:', apiError.message);
          // If API fails, use sample data
          setNotifications(sampleNotifications);
          setUnreadCount(sampleNotifications.filter(n => n.status === 'Unread').length);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    fetchNotifications();
    
    // Set up polling for new notifications every 2 minutes
    const intervalId = setInterval(fetchNotifications, 2 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [user]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      // Try to update via API
      try {
        await API.put(`/notifications/${notificationId}`);
      } catch (apiError) {
        console.log('API not available for marking as read:', apiError.message);
      }
      
      // Update local state
      setNotifications(notifications.map(n => 
        n._id === notificationId ? { ...n, status: 'Read' } : n
      ));
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} min ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hr ago`;
    } else {
      return `${diffDays} day ago`;
    }
  };

  if (!user) return null;

  return (
    <div className="notification-icon-container" ref={dropdownRef}>
      <button 
        className="notification-icon-button" 
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="notification-bell-icon">
          <path d="M5.85 3.5a.75.75 0 00-1.117-1 9.719 9.719 0 00-2.348 4.876.75.75 0 001.479.248A8.219 8.219 0 015.85 3.5zM19.267 2.5a.75.75 0 10-1.118 1 8.22 8.22 0 011.987 4.124.75.75 0 001.48-.248A9.72 9.72 0 0019.266 2.5z" />
          <path fillRule="evenodd" d="M12 2.25A6.75 6.75 0 005.25 9v.75a8.217 8.217 0 01-2.119 5.52.75.75 0 00.298 1.206c1.544.57 3.16.99 4.831 1.243a3.75 3.75 0 107.48 0 24.583 24.583 0 004.83-1.244.75.75 0 00.298-1.205 8.217 8.217 0 01-2.118-5.52V9A6.75 6.75 0 0012 2.25zM9.75 18c0-.034 0-.067.002-.1a25.05 25.05 0 004.496 0l.002.1a2.25 2.25 0 11-4.5 0z" clipRule="evenodd" />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>
      
      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            <Link to="/user/notifications" onClick={() => setShowDropdown(false)}>
              View All
            </Link>
          </div>
          
          <div className="notification-list">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div 
                  key={notification._id} 
                  className={`notification-item ${notification.status.toLowerCase()}`}
                >
                  <div className="notification-content">
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">{formatDate(notification.createdAt)}</div>
                  </div>
                  {notification.status === 'Unread' && (
                    <button 
                      onClick={() => handleMarkAsRead(notification._id)}
                      className="mark-read-btn"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="no-notifications">No notifications</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationIcon; 