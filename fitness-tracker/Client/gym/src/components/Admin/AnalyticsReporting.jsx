// src/components/Admin/AnalyticsReporting.jsx
import React, { useState, useEffect } from 'react';
import { 
  getAnalyticsAdmin, 
  generateReportAdmin 
} from '../../api';
import { FaDownload, FaEye, FaChartBar, FaUsers, FaDumbbell, FaMoneyBillWave } from 'react-icons/fa';
import "../../styles/AdminStyle.css";

const AnalyticsReporting = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState({
    userStats: {
      totalUsers: 0,
      activeUsers: 0,
      premiumUsers: 0,
      newUsersThisMonth: 0
    },
    workoutStats: {
      totalWorkouts: 0,
      completedWorkouts: 0,
      averageWorkoutsPerUser: 0,
      mostPopularWorkout: ''
    },
    financialStats: {
      totalRevenue: 0,
      revenueThisMonth: 0,
      averageRevenuePerUser: 0,
      pendingPayments: 0
    },
    trainerStats: {
      totalTrainers: 0,
      activeTrainers: 0,
      mostBookedTrainer: ''
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [reportType, setReportType] = useState('user-activity');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [generatingReport, setGeneratingReport] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Define tabs array
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'User Analytics' },
    { id: 'workouts', label: 'Workout Analytics' },
    { id: 'financial', label: 'Financial Analytics' },
    { id: 'reports', label: 'Generate Reports' }
  ];

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'overview' || activeTab === 'users' || activeTab === 'workouts' || activeTab === 'financial') {
        const response = await getAnalyticsAdmin();
        setAnalytics(response.data);
      }
    } catch (err) {
      setError(`Failed to fetch ${activeTab} data: ` + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true);
      const response = await generateReportAdmin(
        reportType,
        dateRange.startDate,
        dateRange.endDate,
        selectedUser ? selectedUser._id : null
      );
      
      // Create a download link for the report
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}-report-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      alert('Report generated successfully!');
    } catch (err) {
      setError('Failed to generate report: ' + err.message);
    } finally {
      setGeneratingReport(false);
    }
  };

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const handleUserSelect = (userId) => {
    setSelectedUserId(userId);
    const user = analytics?.users?.list?.find(u => u._id === userId);
    setSelectedUser(user);
  };

  if (loading) return <div className="loading">Loading data...</div>;
  if (error) return <div className="error">{error}</div>;
  
  // Check if analytics data is available
  const isAnalyticsAvailable = analytics && Object.keys(analytics).length > 0;
  
  if (!analytics || Object.keys(analytics).length === 0) {
    return (
      <div className="analytics-container">
        <div className="tabs">
          {tabs.map(tab => (
            <button 
              key={tab.id} 
              className={activeTab === tab.id ? 'active' : ''}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="no-data">
          <h3>No analytics data available</h3>
          <p>There is no data available for this section. Please try again later or contact support if this issue persists.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-reporting-container">
      <h2>Performance Analytics & Reporting</h2>
      
      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          User Analytics
        </button>
        <button 
          className={`tab-button ${activeTab === 'workouts' ? 'active' : ''}`}
          onClick={() => setActiveTab('workouts')}
        >
          Workout Analytics
        </button>
        <button 
          className={`tab-button ${activeTab === 'financial' ? 'active' : ''}`}
          onClick={() => setActiveTab('financial')}
        >
          Financial Analytics
        </button>
        <button 
          className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          Generate Reports
        </button>
      </div>
      
      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="tab-content">
          <h3>Platform Overview</h3>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon user-icon">
                <FaUsers />
              </div>
              <div className="stat-content">
                <h4>Users</h4>
                <div className="stat-value">{analytics?.users?.total || 0}</div>
                <div className="stat-detail">
                  <span>{analytics?.users?.active || 0} active</span>
                  <span>{analytics?.users?.newThisMonth || 0} new this month</span>
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon workout-icon">
                <FaDumbbell />
              </div>
              <div className="stat-content">
                <h4>Workouts</h4>
                <div className="stat-value">{analytics?.workouts?.total || 0}</div>
                <div className="stat-detail">
                  <span>{analytics?.workouts?.completed || 0} completed</span>
                  <span>{analytics?.workouts?.averagePerUser || 0} avg per user</span>
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon financial-icon">
                <FaMoneyBillWave />
              </div>
              <div className="stat-content">
                <h4>Revenue</h4>
                <div className="stat-value">{formatCurrency(analytics?.finance?.totalRevenue || 0)}</div>
                <div className="stat-detail">
                  <span>{formatCurrency(analytics?.finance?.revenueThisMonth || 0)} this month</span>
                  <span>{analytics?.memberships?.total || 0} memberships</span>
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon trainer-icon">
                <FaChartBar />
              </div>
              <div className="stat-content">
                <h4>Trainers</h4>
                <div className="stat-value">{analytics?.trainers?.total || 0}</div>
                <div className="stat-detail">
                  <span>{analytics?.trainers?.active || 0} active</span>
                  <span>Most popular: {analytics?.memberships?.mostPopular || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="summary-section">
            <h4>Platform Summary</h4>
            <p>
              The platform currently has {analytics?.users?.total || 0} total users, with {analytics?.users?.active || 0} active users and {analytics?.users?.premium || 0} premium subscribers. 
              There have been {analytics?.workouts?.total || 0} total workouts logged, with an average of {analytics?.workouts?.averagePerUser || 0} workouts per user.
              The total revenue generated is {formatCurrency(analytics?.finance?.totalRevenue || 0)}, with {formatCurrency(analytics?.finance?.revenueThisMonth || 0)} generated this month.
            </p>
          </div>
        </div>
      )}
      
      {/* User Analytics Tab */}
      {activeTab === 'users' && (
        <div className="tab-content">
          <h3>User Analytics</h3>
          
          <div className="analytics-grid">
            <div className="analytics-card">
              <h4>Total Users</h4>
              <div className="analytics-value">{analytics?.users?.total || 0}</div>
              <div className="analytics-details">
                <p>New users this month: {analytics?.users?.newThisMonth || 0}</p>
                <p>Active users: {analytics?.users?.active || 0}</p>
                <p>Premium users: {analytics?.users?.premium || 0}</p>
                <p>Premium percentage: {((analytics?.users?.premium || 0) / (analytics?.users?.total || 1) * 100).toFixed(1)}%</p>
              </div>
            </div>
            
            <div className="analytics-card">
              <h4>User Engagement</h4>
              <div className="analytics-value">{analytics?.workouts?.averagePerUser || 0}</div>
              <div className="analytics-details">
                <p>Most active day: {analytics?.users?.mostActiveDay || 'N/A'}</p>
                <p>Most active time: {analytics?.users?.mostActiveTime || 'N/A'}</p>
                <p>Average session duration: {analytics?.users?.averageSessionDuration || 'N/A'}</p>
              </div>
            </div>
            
            <div className="analytics-card">
              <h4>User Retention</h4>
              <div className="analytics-value">{analytics?.users?.retentionRate || '0'}%</div>
              <div className="analytics-details">
                <p>Churn rate: {analytics?.users?.churnRate || '0'}%</p>
                <p>Average user lifetime: {analytics?.users?.averageUserLifetime || 'N/A'}</p>
                <p>Returning users: {analytics?.users?.returningUsers || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Workout Analytics Tab */}
      {activeTab === 'workouts' && (
        <div className="tab-content">
          <h3>Workout Analytics</h3>
          
          <div className="analytics-grid">
            <div className="analytics-card">
              <h4>Total Workouts</h4>
              <div className="analytics-value">{analytics?.workouts?.total || 0}</div>
              <div className="analytics-details">
                <p>Completed workouts: {analytics?.workouts?.completed || 0}</p>
                <p>Completion rate: {((analytics?.workouts?.completed || 0) / (analytics?.workouts?.total || 1) * 100).toFixed(1)}%</p>
                <p>Average duration: {analytics?.workouts?.averageDuration || 'N/A'}</p>
              </div>
            </div>
            
            <div className="analytics-card">
              <h4>Popular Workouts</h4>
              <div className="analytics-value">{analytics?.workouts?.mostPopular || 'N/A'}</div>
              <div className="analytics-details">
                <p>Most popular category: {analytics?.workouts?.mostPopularCategory || 'N/A'}</p>
                <p>Most popular exercise: {analytics?.workouts?.mostPopularExercise || 'N/A'}</p>
                <p>Average exercises per workout: {analytics?.workouts?.averageExercisesPerWorkout || 0}</p>
              </div>
            </div>
            
            <div className="analytics-card">
              <h4>Workout Growth</h4>
              <div className="analytics-value">{analytics?.workouts?.thisMonth || 0}</div>
              <div className="analytics-details">
                <p>Growth from last month: {analytics?.workouts?.growthRate || '0'}%</p>
                <p>Most active day: {analytics?.workouts?.mostActiveDay || 'N/A'}</p>
                <p>Most active time: {analytics?.workouts?.mostActiveTime || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Financial Analytics Tab */}
      {activeTab === 'financial' && (
        <div className="tab-content">
          <h3>Financial Analytics</h3>
          
          <div className="analytics-grid">
            <div className="analytics-card">
              <h4>Total Revenue</h4>
              <div className="analytics-value">{formatCurrency(analytics?.finance?.totalRevenue || 0)}</div>
              <div className="analytics-details">
                <p>Revenue this month: {formatCurrency(analytics?.finance?.revenueThisMonth || 0)}</p>
                <p>Revenue growth: {analytics?.finance?.growthRate || '0'}%</p>
                <p>Average revenue per user: {formatCurrency(analytics?.finance?.averageRevenuePerUser || 0)}</p>
              </div>
            </div>
            
            <div className="analytics-card">
              <h4>Membership Revenue</h4>
              <div className="analytics-value">{formatCurrency(analytics?.finance?.membershipRevenue || 0)}</div>
              <div className="analytics-details">
                <p>Active memberships: {analytics?.memberships?.active || 0}</p>
                <p>Most popular plan: {analytics?.memberships?.mostPopular || 'N/A'}</p>
                <p>Renewal rate: {analytics?.memberships?.renewalRate || '0'}%</p>
              </div>
            </div>
            
            <div className="analytics-card">
              <h4>Payment Status</h4>
              <div className="analytics-value">{analytics?.finance?.pendingPayments || 0}</div>
              <div className="analytics-details">
                <p>Pending payments</p>
                <p>Failed payments: {analytics?.finance?.failedPayments || 0}</p>
                <p>Payment success rate: {analytics?.finance?.paymentSuccessRate || '0'}%</p>
                <p>Outstanding amount: {formatCurrency(analytics?.finance?.outstandingAmount || 0)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Generate Reports Tab */}
      {activeTab === 'reports' && (
        <div className="tab-content">
          <h3>Generate Reports</h3>
          
          <div className="report-form">
            <div className="form-group">
              <label>Report Type:</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="user-activity">User Activity</option>
                <option value="workout-completion">Workout Completion</option>
                <option value="financial">Financial Report</option>
                <option value="trainer-performance">Trainer Performance</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Date Range:</label>
              <div className="date-range">
                <div>
                  <label>From:</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <label>To:</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                  />
                </div>
              </div>
            </div>
            
            <div className="form-group">
              <label>User (Optional):</label>
              <select
                value={selectedUserId}
                onChange={(e) => handleUserSelect(e.target.value)}
              >
                <option value="">All Users</option>
                {analytics?.users?.list?.map(user => (
                  <option key={user._id} value={user._id}>{user.name}</option>
                ))}
              </select>
            </div>
            
            <button 
              onClick={handleGenerateReport}
              className="primary-button"
              disabled={generatingReport}
            >
              {generatingReport ? 'Generating...' : 'Generate Report'} <FaDownload />
            </button>
          </div>
          
          <div className="report-description">
            <h4>Report Descriptions</h4>
            <ul>
              <li><strong>User Activity:</strong> Shows login frequency, session duration, and feature usage for users.</li>
              <li><strong>Workout Completion:</strong> Details on workout completion rates, popular workouts, and user engagement.</li>
              <li><strong>Financial Report:</strong> Revenue breakdown, subscription details, and payment status information.</li>
              <li><strong>Trainer Performance:</strong> Metrics on trainer bookings, ratings, and client retention.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsReporting; 