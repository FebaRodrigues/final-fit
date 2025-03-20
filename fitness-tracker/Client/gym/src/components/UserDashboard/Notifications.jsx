// src/components/UserDashboard/Notifications.jsx
import React, { useContext, useEffect, useState } from 'react';
import { getNotifications, markNotificationAsRead, getAnnouncements } from '../../api';
import { AuthContext } from '../../context/AuthContext';
import { FaBell, FaBullhorn, FaDumbbell, FaTrophy, FaCalendarAlt, FaMoneyBillWave, FaCheck, FaCog, FaCheckCircle, FaExclamationCircle, FaFlag } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../../styles/Notifications.css';
import useMembershipAccess from '../../hooks/useMembershipAccess';
import MembershipAccessError from '../common/MembershipAccessError';

const Notifications = () => {
    const { user, membership } = useContext(AuthContext);
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [unreadCount, setUnreadCount] = useState(0);
    const [membershipError, setMembershipError] = useState(null);
    const { hasWorkoutAccess, hasGoalsAccess } = useMembershipAccess();

    // Sample notifications for demonstration
    const sampleNotifications = [
        {
            _id: '1',
            type: 'Workout',
            message: 'Your trainer has assigned you a new workout plan',
            status: 'Unread',
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
        },
        {
            _id: '2',
            type: 'Goal',
            message: 'Congratulations! You\'ve reached your weight loss goal',
            status: 'Unread',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
        },
        {
            _id: '3',
            type: 'System',
            message: 'Your account has been successfully updated',
            status: 'Read',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
        },
        {
            _id: '4',
            type: 'Payment',
            message: 'Your membership payment was successful',
            status: 'Read',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() // 2 days ago
        },
        {
            _id: '5',
            type: 'Appointment',
            message: 'Reminder: You have a training session tomorrow at 10:00 AM',
            status: 'Unread',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString() // 3 days ago
        }
    ];

    // Sample announcements for demonstration
    const sampleAnnouncements = [
        {
            _id: '1',
            title: 'New Yoga Classes',
            content: 'We\'re excited to announce new yoga classes starting next week. Check the schedule for details!',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
            important: false
        },
        {
            _id: '2',
            title: 'Holiday Hours',
            content: 'Please note that we will have modified hours during the upcoming holiday. The gym will be open from 8 AM to 6 PM.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
            important: true
        },
        {
            _id: '3',
            title: 'New Equipment Arrival',
            content: 'We\'ve added new strength training equipment to the weight room. Come check it out!',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
            important: false
        }
    ];

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch notifications
                let notificationsData = [];
                try {
                    const response = await getNotifications();
                    notificationsData = response.data;
                    
                    // If we got an empty array from the server, don't use sample data
                    if (Array.isArray(notificationsData) && notificationsData.length === 0) {
                        console.log('No notifications found for user');
                    } else if (!Array.isArray(notificationsData) || notificationsData.length === 0) {
                        console.log('API not available for notifications, using sample data');
                        // Use sample data if API is not available
                        notificationsData = sampleNotifications;
                    }
                } catch (notifError) {
                    console.log('API not available for notifications:', notifError.message);
                    // Use sample data if API is not available
                    notificationsData = sampleNotifications;
                }
                
                // Fetch announcements
                let announcementsData = [];
                try {
                    const response = await getAnnouncements();
                    announcementsData = response.data;
                    
                    // If we got an empty array from the server, don't use sample data
                    if (Array.isArray(announcementsData) && announcementsData.length === 0) {
                        console.log('No announcements found');
                    } else if (!Array.isArray(announcementsData) || announcementsData.length === 0) {
                        console.log('API not available for announcements, using sample data');
                        // Use sample data if API is not available
                        announcementsData = sampleAnnouncements;
                    }
                } catch (announceError) {
                    console.log('API not available for announcements:', announceError.message);
                    // Use sample data if API is not available
                    announcementsData = sampleAnnouncements;
                }
                
                setNotifications(notificationsData);
                setAnnouncements(announcementsData);
                setError(null);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load notifications and announcements. Please try again later.');
                // Use sample data as fallback
                setNotifications(sampleNotifications);
                setAnnouncements(sampleAnnouncements);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    // Update unread count whenever notifications change
    useEffect(() => {
        const count = notifications.filter(n => n.status === 'Unread').length;
        setUnreadCount(count);
    }, [notifications]);

    const handleMarkAsRead = async (notificationId) => {
        try {
            // Try to update via API
            try {
                await markNotificationAsRead(notificationId);
            } catch (apiError) {
                console.log('API not available for marking as read:', apiError.message);
                // If API fails, just update the local state
            }
            
            // Update local state regardless of API success
            setNotifications(notifications.map(n => 
                n._id === notificationId ? { ...n, status: 'Read' } : n
            ));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            // Update all unread notifications to read
            const updatedNotifications = notifications.map(n => 
                n.status === 'Unread' ? { ...n, status: 'Read' } : n
            );
            
            setNotifications(updatedNotifications);
            
            // Try to update via API for each notification
            const unreadIds = notifications
                .filter(n => n.status === 'Unread')
                .map(n => n._id);
                
            for (const id of unreadIds) {
                try {
                    await markNotificationAsRead(id);
                } catch (apiError) {
                    console.log(`API not available for marking notification ${id} as read:`, apiError.message);
                }
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'Workout':
                return <FaDumbbell className="notification-icon workout" />;
            case 'Goal':
                return <FaTrophy className="notification-icon goal" />;
            case 'System':
                return <FaCog className="notification-icon" />;
            case 'Payment':
                return <FaMoneyBillWave className="notification-icon" />;
            case 'Appointment':
                return <FaCalendarAlt className="notification-icon appointment" />;
            default:
                return <FaBell className="notification-icon" />;
        }
    };

    const handleNotificationClick = async (notification) => {
        // Mark as read if unread
        if (notification.status === 'Unread') {
            await handleMarkAsRead(notification._id);
        }
        
        // Check membership access before redirecting
        switch (notification.type) {
            case 'Workout':
                // Check if this is an assigned workout notification
                if (notification.message.includes('assigned') || notification.message.includes('trainer')) {
                    // Check if user has Elite membership for assigned workouts
                    if (!membership || membership.planType !== 'Elite') {
                        setMembershipError({
                            message: 'You need an Elite membership to access trainer-assigned workouts.',
                            requiredPlans: ['Elite'],
                            currentPlan: membership?.planType || 'None',
                            isMembershipError: true
                        });
                        return;
                    }
                    navigate('/user/workout-log', { state: { activeTab: 'assigned' } });
                } else {
                    // For other workout notifications
                    if (!hasWorkoutAccess()) {
                        setMembershipError({
                            message: 'You need a Basic, Premium, or Elite membership to access workout tracking.',
                            requiredPlans: ['Basic', 'Premium', 'Elite'],
                            currentPlan: membership?.planType || 'None',
                            isMembershipError: true
                        });
                        return;
                    }
                    navigate('/user/workout-log');
                }
                break;
            case 'Goal':
                if (!hasGoalsAccess()) {
                    setMembershipError({
                        message: 'You need a Premium or Elite membership to access fitness goals.',
                        requiredPlans: ['Premium', 'Elite'],
                        currentPlan: membership?.planType || 'None',
                        isMembershipError: true
                    });
                    return;
                }
                navigate('/user/goals');
                break;
            case 'Appointment':
                navigate('/user/appointments');
                break;
            case 'Payment':
                navigate('/user/payments');
                break;
            default:
                // For other types, just mark as read without navigation
                break;
        }
    };

    if (loading) {
        return <div className="notifications-container loading">Loading notifications...</div>;
    }

    if (error) {
        return <div className="notifications-container error">{error}</div>;
    }

    // If there's a membership error, show the error component
    if (membershipError) {
        return (
            <MembershipAccessError 
                error={membershipError}
                featureName={membershipError.message.includes('workout') ? 'workout tracking' : 'fitness goals'}
                onBack={() => setMembershipError(null)}
            />
        );
    }

    return (
        <div className="page-container">
            <div className="page-title">
                <h1>Notifications Center</h1>
                <p>Stay updated with your fitness journey</p>
            </div>
            
            <div className="notifications-container">
                <div className="notifications-header">
                    <h2>Notifications {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}</h2>
                    {unreadCount > 0 && (
                        <button className="mark-all-read" onClick={handleMarkAllAsRead}>
                            Mark all as read
                        </button>
                    )}
                </div>

                <div className="notification-tabs">
                    <button 
                        className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        All
                    </button>
                    <button 
                        className={`tab-button ${activeTab === 'announcements' ? 'active' : ''}`}
                        onClick={() => setActiveTab('announcements')}
                    >
                        Announcements
                    </button>
                </div>

                {activeTab === 'all' && (
                    <div className="notifications-list">
                        {notifications.length === 0 ? (
                            <div className="no-notifications">No notifications to display</div>
                        ) : (
                            notifications.map((notification) => (
                                <div 
                                    key={notification._id} 
                                    className={`notification-item ${notification.status === 'Unread' ? 'unread' : ''}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="notification-icon-container">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="notification-content">
                                        <div className="notification-message">{notification.message}</div>
                                        <div className="notification-date">{formatDate(notification.createdAt)}</div>
                                    </div>
                                    {notification.status === 'Unread' && <div className="unread-indicator"></div>}
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'announcements' && (
                    <div className="announcements-list">
                        {announcements.length === 0 ? (
                            <div className="no-announcements">No announcements to display</div>
                        ) : (
                            announcements.map((announcement) => (
                                <div 
                                    key={announcement._id} 
                                    className={`announcement-item ${announcement.important ? 'important' : ''}`}
                                >
                                    <div className="announcement-header">
                                        <h3 className="announcement-title">{announcement.title}</h3>
                                        {announcement.important && (
                                            <span className="important-badge">Important</span>
                                        )}
                                    </div>
                                    <div className="announcement-content">{announcement.content}</div>
                                    <div className="announcement-date">{formatDate(announcement.createdAt)}</div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;