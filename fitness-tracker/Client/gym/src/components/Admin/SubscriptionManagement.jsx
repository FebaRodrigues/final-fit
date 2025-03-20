import React, { useState, useEffect } from 'react';
import { 
  getMembershipsAdmin, 
  getPaymentsAdmin, 
  updateMembership, 
  updatePayment, 
  createUserActivity,
  createMembershipPlan
} from '../../api';
import { FaEdit, FaEye, FaCheck, FaTimes, FaBell, FaLock, FaUnlock, FaSync } from 'react-icons/fa';
import "../../styles/AdminStyle.css";
import axios from 'axios';

const SubscriptionManagement = () => {
  const [activeTab, setActiveTab] = useState('memberships');
  const [memberships, setMemberships] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [membershipFormData, setMembershipFormData] = useState({
    planName: '',
    duration: 'Monthly',
    status: 'Active',
    autoRenew: true,
    price: 0
  });
  const [showMembershipForm, setShowMembershipForm] = useState(false);
  const [notification, setNotification] = useState({
    message: '',
    type: 'Payment'
  });
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (activeTab === 'memberships') {
        try {
          const response = await getMembershipsAdmin();
          if (response && response.data) {
            setMemberships(response.data);
          } else {
            // Handle empty response
            setMemberships([]);
            console.warn('Empty response from getMembershipsAdmin');
          }
        } catch (err) {
          console.error('Error fetching memberships:', err);
          // Set empty array instead of failing
          setMemberships([]);
          setError('Failed to load memberships. Using empty data.');
        }
      } else {
        try {
          const response = await getPaymentsAdmin();
          if (response && response.data) {
            setPayments(response.data);
          } else {
            // Handle empty response
            setPayments([]);
            console.warn('Empty response from getPaymentsAdmin');
          }
        } catch (err) {
          console.error('Error fetching payments:', err);
          // Set empty array instead of failing
          setPayments([]);
          setError('Failed to load payments. Using empty data.');
        }
      }
    } catch (err) {
      console.error('Error in fetchData:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewMembership = (membership) => {
    setSelectedMembership(membership);
    setSelectedPayment(null);
    setEditMode(false);
  };

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setSelectedMembership(null);
    setEditMode(false);
  };

  const handleEditMembership = (membership) => {
    setEditMode(true);
    setSelectedMembership(membership);
    setSelectedPayment(null);
    setMembershipFormData({
      userId: membership.userId,
      planType: membership.planType || 'Basic',
      startDate: membership.startDate ? new Date(membership.startDate).toISOString().split('T')[0] : '',
      endDate: membership.endDate ? new Date(membership.endDate).toISOString().split('T')[0] : '',
      status: membership.status || 'Active',
      autoRenew: membership.autoRenew !== false,
      price: membership.price || 0
    });
  };

  const handleUpdateMembership = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      await updateMembership(selectedMembership._id, membershipFormData);
      
      // Update the local state
      setMemberships(memberships.map(membership => 
        membership._id === selectedMembership._id ? { ...membership, ...membershipFormData } : membership
      ));
      
      setEditMode(false);
      setSelectedMembership(null);
      alert('Membership updated successfully!');
    } catch (err) {
      console.error('Error updating membership:', err);
      setError('Failed to update membership: ' + (err.message || 'Unknown error'));
    }
  };

  const handleCreateMembership = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      // Create a new membership plan without a specific user
      const response = await createMembershipPlan({
        name: membershipFormData.planName,
        duration: membershipFormData.duration,
        price: membershipFormData.price
      });
      
      // Refresh the memberships list
      fetchData();
      
      setShowMembershipForm(false);
      setMembershipFormData({
        planName: '',
        duration: 'Monthly',
        status: 'Active',
        autoRenew: true,
        price: 0
      });
      
      alert('Membership plan created successfully!');
    } catch (err) {
      console.error('Error creating membership plan:', err);
      setError('Failed to create membership plan: ' + (err.message || 'Unknown error'));
    }
  };

  const handleSendNotification = async () => {
    if (!notification.message.trim()) {
      alert('Please enter a notification message');
      return;
    }

    try {
      setError(null);
      if (!selectedMembership || !selectedMembership.userId) {
        throw new Error('No user selected for notification');
      }
      
      await createUserActivity({
        userId: selectedMembership.userId,
        activityType: 'PaymentNotification',
        description: notification.message
      });
      
      setNotification({ message: '', type: 'Payment' });
      setShowNotificationForm(false);
      alert('Notification sent successfully!');
    } catch (err) {
      console.error('Error sending notification:', err);
      setError('Failed to send notification: ' + (err.message || 'Unknown error'));
    }
  };

  const handleUpdatePaymentStatus = async (paymentId, newStatus) => {
    try {
      setError(null);
      await updatePayment(paymentId, { status: newStatus });
      
      // Update the local state
      setPayments(payments.map(payment => 
        payment._id === paymentId ? { ...payment, status: newStatus } : payment
      ));
      
      alert(`Payment status updated to ${newStatus}!`);
    } catch (err) {
      console.error('Error updating payment status:', err);
      setError('Failed to update payment status: ' + (err.message || 'Unknown error'));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Invalid Date';
    }
  };

  const handleRetry = () => {
    fetchData();
  };

  return (
    <div className="admin-content">
      <div className="subscription-management-container">
        <h2>Subscription Management</h2>
        
        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'memberships' ? 'active' : ''}`}
            onClick={() => setActiveTab('memberships')}
          >
            Memberships
          </button>
          <button 
            className={`tab-button ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            Payments
          </button>
        </div>
        
        {/* Error Message with Retry Button */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={handleRetry} className="retry-button">
              <FaSync /> Retry
            </button>
          </div>
        )}
        
        {/* Content based on active tab */}
        <div className="tab-content">
          {loading ? (
            <div className="loading">Loading data...</div>
          ) : (
            <>
              {activeTab === 'memberships' && (
                <div>
                  <div className="section-header">
                    <h3>Memberships ({memberships.length})</h3>
                    <button 
                      className="primary-button"
                      onClick={() => setShowMembershipForm(true)}
                    >
                      Add Membership Plan
                    </button>
                  </div>
                  {memberships.length > 0 ? (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Plan</th>
                          <th>Start Date</th>
                          <th>End Date</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {memberships.map(membership => (
                          <tr key={membership._id || `membership-${Math.random()}`}>
                            <td>{membership.userName || membership.userId?.name || 'Unknown User'}</td>
                            <td>{membership.planType || 'Basic'}</td>
                            <td>{formatDate(membership.startDate)}</td>
                            <td>{formatDate(membership.endDate)}</td>
                            <td>{membership.status || 'Active'}</td>
                            <td className="action-buttons">
                              <button 
                                onClick={() => handleViewMembership(membership)}
                                className="icon-button"
                                title="View Details"
                              >
                                <FaEye />
                              </button>
                              <button 
                                onClick={() => handleEditMembership(membership)}
                                className="icon-button"
                                title="Edit Membership"
                              >
                                <FaEdit />
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedMembership(membership);
                                  setShowNotificationForm(true);
                                }}
                                className="icon-button"
                                title="Send Notification"
                              >
                                <FaBell />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="no-data-message">No memberships found</div>
                  )}
                </div>
              )}
              
              {activeTab === 'payments' && (
                <div>
                  <h3>Payments ({payments.length})</h3>
                  {payments.length > 0 ? (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Amount</th>
                          <th>Date</th>
                          <th>Method</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map(payment => (
                          <tr key={payment._id || `payment-${Math.random()}`}>
                            <td>{payment.userName || payment.userId?.name || 'Unknown User'}</td>
                            <td>₹{payment.amount?.toFixed(2) || '0.00'}</td>
                            <td>{formatDate(payment.date)}</td>
                            <td>{payment.method || 'Card'}</td>
                            <td>{payment.status || 'Completed'}</td>
                            <td className="action-buttons">
                              <button 
                                onClick={() => handleViewPayment(payment)}
                                className="icon-button"
                                title="View Details"
                              >
                                <FaEye />
                              </button>
                              {payment.status !== 'Completed' && (
                                <button 
                                  onClick={() => handleUpdatePaymentStatus(payment._id, 'Completed')}
                                  className="icon-button approve"
                                  title="Mark as Completed"
                                >
                                  <FaCheck />
                                </button>
                              )}
                              {payment.status !== 'Failed' && (
                                <button 
                                  onClick={() => handleUpdatePaymentStatus(payment._id, 'Failed')}
                                  className="icon-button delete"
                                  title="Mark as Failed"
                                >
                                  <FaTimes />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="no-data-message">No payments found</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Membership Details View */}
        {selectedMembership && !editMode && !showNotificationForm && (
          <div className="membership-details">
            <h3>Membership Details</h3>
            <div className="details-container">
              <div className="detail-item">
                <strong>User:</strong> {selectedMembership.userName || selectedMembership.userId?.name || 'Unknown User'}
              </div>
              <div className="detail-item">
                <strong>Plan Type:</strong> {selectedMembership.planType || 'Basic'}
              </div>
              <div className="detail-item">
                <strong>Start Date:</strong> {formatDate(selectedMembership.startDate)}
              </div>
              <div className="detail-item">
                <strong>End Date:</strong> {formatDate(selectedMembership.endDate)}
              </div>
              <div className="detail-item">
                <strong>Status:</strong> {selectedMembership.status || 'Active'}
              </div>
              <div className="detail-item">
                <strong>Auto Renew:</strong> {selectedMembership.autoRenew ? 'Yes' : 'No'}
              </div>
              <div className="detail-item">
                <strong>Price:</strong> ₹{selectedMembership.price?.toFixed(2) || '0.00'}
              </div>
            </div>
            <button 
              onClick={() => setSelectedMembership(null)}
              className="secondary-button"
            >
              Close
            </button>
          </div>
        )}
        
        {/* Payment Details View */}
        {selectedPayment && !showNotificationForm && (
          <div className="payment-details">
            <h3>Payment Details</h3>
            <div className="details-container">
              <div className="detail-item">
                <strong>User:</strong> {selectedPayment.userName || selectedPayment.userId?.name || 'Unknown User'}
              </div>
              <div className="detail-item">
                <strong>Amount:</strong> ₹{selectedPayment.amount?.toFixed(2) || '0.00'}
              </div>
              <div className="detail-item">
                <strong>Date:</strong> {formatDate(selectedPayment.date)}
              </div>
              <div className="detail-item">
                <strong>Method:</strong> {selectedPayment.method || 'Card'}
              </div>
              <div className="detail-item">
                <strong>Status:</strong> {selectedPayment.status || 'Completed'}
              </div>
              <div className="detail-item">
                <strong>Transaction ID:</strong> {selectedPayment.transactionId || 'N/A'}
              </div>
            </div>
            <div className="action-buttons">
              {selectedPayment.status !== 'Completed' && (
                <button 
                  onClick={() => handleUpdatePaymentStatus(selectedPayment._id, 'Completed')}
                  className="primary-button"
                >
                  Mark as Completed
                </button>
              )}
              {selectedPayment.status !== 'Failed' && (
                <button 
                  onClick={() => handleUpdatePaymentStatus(selectedPayment._id, 'Failed')}
                  className="secondary-button"
                >
                  Mark as Failed
                </button>
              )}
              <button 
                onClick={() => setSelectedPayment(null)}
                className="secondary-button"
              >
                Close
              </button>
            </div>
          </div>
        )}
        
        {/* Edit Membership Form */}
        {editMode && selectedMembership && (
          <div className="edit-membership-form">
            <h3>Edit Membership</h3>
            <form onSubmit={handleUpdateMembership}>
              <div className="form-group">
                <label>Plan Type:</label>
                <select
                  value={membershipFormData.planType}
                  onChange={(e) => setMembershipFormData({...membershipFormData, planType: e.target.value})}
                >
                  <option value="Basic">Basic</option>
                  <option value="Standard">Standard</option>
                  <option value="Premium">Premium</option>
                  <option value="Elite">Elite</option>
                </select>
              </div>
              <div className="form-group">
                <label>Start Date:</label>
                <input
                  type="date"
                  value={membershipFormData.startDate}
                  onChange={(e) => setMembershipFormData({...membershipFormData, startDate: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>End Date:</label>
                <input
                  type="date"
                  value={membershipFormData.endDate}
                  onChange={(e) => setMembershipFormData({...membershipFormData, endDate: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Status:</label>
                <select
                  value={membershipFormData.status}
                  onChange={(e) => setMembershipFormData({...membershipFormData, status: e.target.value})}
                >
                  <option value="Active">Active</option>
                  <option value="Expired">Expired</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={membershipFormData.autoRenew}
                    onChange={(e) => setMembershipFormData({...membershipFormData, autoRenew: e.target.checked})}
                  />
                  Auto Renew
                </label>
              </div>
              <div className="form-buttons">
                <button type="submit" className="primary-button">Save Changes</button>
                <button 
                  type="button" 
                  onClick={() => {
                    setEditMode(false);
                    setSelectedMembership(null);
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
            <h3>Send Payment Notification</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSendNotification();
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
                  <option value="Payment">Payment</option>
                  <option value="Renewal">Renewal</option>
                  <option value="Expiration">Expiration</option>
                </select>
              </div>
              <div className="form-buttons">
                <button type="submit" className="primary-button">Send Notification</button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowNotificationForm(false);
                    setNotification({ message: '', type: 'Payment' });
                  }}
                  className="secondary-button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* New Membership Plan Form */}
        {showMembershipForm && (
          <div className="membership-form">
            <h3>Create New Membership Plan</h3>
            <form onSubmit={handleCreateMembership}>
              <div className="form-group">
                <label>Plan Name:</label>
                <input
                  type="text"
                  value={membershipFormData.planName}
                  onChange={(e) => setMembershipFormData({...membershipFormData, planName: e.target.value})}
                  required
                  placeholder="e.g. Premium, Elite, etc."
                />
              </div>
              <div className="form-group">
                <label>Duration:</label>
                <select
                  value={membershipFormData.duration}
                  onChange={(e) => setMembershipFormData({...membershipFormData, duration: e.target.value})}
                  required
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>
              <div className="form-group">
                <label>Price (₹):</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={membershipFormData.price}
                  onChange={(e) => setMembershipFormData({...membershipFormData, price: parseFloat(e.target.value)})}
                  required
                />
              </div>
              <div className="form-buttons">
                <button type="submit" className="primary-button">Create Plan</button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowMembershipForm(false);
                    setMembershipFormData({
                      planName: '',
                      duration: 'Monthly',
                      status: 'Active',
                      autoRenew: true,
                      price: 0
                    });
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
    </div>
  );
};

export default SubscriptionManagement; 