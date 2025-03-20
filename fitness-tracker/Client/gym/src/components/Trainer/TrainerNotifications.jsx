// src/components/Trainer/TrainerNotifications.jsx (New File)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api';
import { getNotifications, markNotificationAsRead } from '../../api';
import '../../styles/TrainerNotifications.css';

const TrainerNotifications = () => {
    const { trainer } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Sample notifications to use as fallback
    const sampleNotifications = [
        {
            _id: 'sample1',
            type: 'Announcement',
            message: 'Welcome to the trainer dashboard! This is a sample notification.',
            status: 'Unread',
            createdAt: new Date().toISOString()
        },
        {
            _id: 'sample2',
            type: 'Reminder',
            message: 'You have upcoming client sessions this week.',
            status: 'Unread',
            createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
        }
    ];

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!trainer) return;
            setLoading(true);
            try {
                const trainerId = trainer.id || trainer._id;
                console.log("Fetching notifications for trainer:", trainerId);
                
                // Use the getNotifications function from the API
                const response = await getNotifications(trainerId);
                console.log("Notifications response:", response.data);
                
                if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                    setNotifications(response.data);
                    setError(null);
                } else {
                    console.log("No notifications found, using sample data");
                    setNotifications(sampleNotifications);
                    setError(null);
                }
            } catch (error) {
                console.error('Error fetching notifications:', error);
                setError('Failed to fetch notifications. Using sample data instead.');
                // Use sample notifications as fallback
                setNotifications(sampleNotifications);
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, [trainer]);

    const handleMarkAsRead = async (notificationId) => {
        try {
            // Skip API call for sample notifications
            if (notificationId.startsWith('sample')) {
                setNotifications(notifications.map(n => 
                    n._id === notificationId ? { ...n, status: 'Read' } : n
                ));
                return;
            }
            
            // Use the markNotificationAsRead function from the API
            await markNotificationAsRead(notificationId);
            setNotifications(notifications.map(n => 
                n._id === notificationId ? { ...n, status: 'Read' } : n
            ));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    if (loading) return <div className="loading">Loading notifications...</div>;
    if (error) return (
        <div className="notifications-container">
            <h2>Notifications & Reminders</h2>
            <div className="error-message">{error}</div>
            <ul className="notifications-list">
                {notifications.map((notification) => (
                    <li key={notification._id} className={`notification-item ${notification.status === 'Unread' ? 'unread' : ''}`}>
                        <div className="notification-content">
                            <strong>{notification.type}:</strong> {notification.message}
                            <div className="notification-meta">
                                <span className="notification-date">{new Date(notification.createdAt).toLocaleString()}</span>
                                <span className="notification-status">{notification.status}</span>
                            </div>
                        </div>
                        {notification.status === 'Unread' && (
                            <button 
                                className="mark-read-btn"
                                onClick={() => handleMarkAsRead(notification._id)}
                            >
                                Mark as Read
                            </button>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );

    return (
        <div className="notifications-container">
            <h2>Notifications & Reminders</h2>
            {notifications.length > 0 ? (
                <ul className="notifications-list">
                    {notifications.map((notification) => (
                        <li key={notification._id} className={`notification-item ${notification.status === 'Unread' ? 'unread' : ''}`}>
                            <div className="notification-content">
                                <strong>{notification.type}:</strong> {notification.message}
                                <div className="notification-meta">
                                    <span className="notification-date">{new Date(notification.createdAt).toLocaleString()}</span>
                                    <span className="notification-status">{notification.status}</span>
                                </div>
                            </div>
                            {notification.status === 'Unread' && (
                                <button 
                                    className="mark-read-btn"
                                    onClick={() => handleMarkAsRead(notification._id)}
                                >
                                    Mark as Read
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="no-data-message">No notifications available.</p>
            )}
        </div>
    );
};

export default TrainerNotifications;