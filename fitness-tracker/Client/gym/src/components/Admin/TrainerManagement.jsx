import React, { useState, useEffect } from 'react';
import { 
  getAllTrainersAdmin, 
  getTrainerByIdAdmin, 
  updateTrainerAdmin, 
  createUserActivity,
  approveTrainer
} from '../../api';
import { FaEdit, FaTimes, FaEye, FaCheck, FaBell } from 'react-icons/fa';
import "../../styles/AdminStyle.css";

const TrainerManagement = () => {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    specialties: [],
    bio: '',
    approvedSalary: 0
  });
  const [notification, setNotification] = useState({
    message: '',
    type: 'Announcement'
  });
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [approvalForm, setApprovalForm] = useState({
    show: false,
    trainerId: '',
    approvedSalary: 0
  });

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    try {
      setLoading(true);
      const response = await getAllTrainersAdmin();
      setTrainers(response.data);
    } catch (err) {
      setError('Failed to fetch trainers: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (trainerId) => {
    try {
      setDetailsLoading(true);
      const response = await getTrainerByIdAdmin(trainerId);
      setSelectedTrainer(response.data);
    } catch (err) {
      setError('Failed to fetch trainer details: ' + err.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleEditTrainer = (trainer) => {
    setEditMode(true);
    setSelectedTrainer(trainer);
    setEditData({
      name: trainer.name,
      email: trainer.email,
      specialties: trainer.specialties || [],
      bio: trainer.bio || '',
      approvedSalary: trainer.approvedSalary || 0,
      isActive: trainer.isActive !== false
    });
  };

  const handleUpdateTrainer = async () => {
    try {
      await updateTrainerAdmin(selectedTrainer._id, editData);
      setTrainers(trainers.map(trainer => 
        trainer._id === selectedTrainer._id ? { ...trainer, ...editData } : trainer
      ));
      setEditMode(false);
      setSelectedTrainer(null);
      alert('Trainer updated successfully!');
    } catch (err) {
      setError('Failed to update trainer: ' + err.message);
    }
  };

  const handleRejectTrainer = async (trainerId) => {
    if (window.confirm('Are you sure you want to reject this trainer? They will be marked as inactive.')) {
      try {
        // Instead of deleting, update the trainer to be inactive
        await updateTrainerAdmin(trainerId, { isActive: false, approved: false });
        
        // Update the local state
        setTrainers(trainers.map(trainer => 
          trainer._id === trainerId ? { ...trainer, isActive: false, approved: false } : trainer
        ));
        
        alert('Trainer rejected successfully!');
      } catch (err) {
        setError('Failed to reject trainer: ' + err.message);
      }
    }
  };

  const handleSendNotification = async () => {
    if (!notification.message.trim()) {
      alert('Please enter a notification message');
      return;
    }

    try {
      // Create a user activity for notification to trainer
      await createUserActivity({
        userId: selectedTrainer._id, // Using userId field for trainerId
        activityType: 'TrainerNotification',
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
      // Send notification to all trainers
      const promises = trainers.map(trainer => 
        createUserActivity({
          userId: trainer._id, // Using userId field for trainerId
          activityType: 'TrainerNotification',
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

  const handleApproveTrainer = async () => {
    try {
      // Convert approvedSalary to a number for the API call
      const salary = Number(approvalForm.approvedSalary);
      
      // Validate the salary
      if (isNaN(salary) || salary <= 0) {
        setError('Please enter a valid salary amount');
        return;
      }
      
      await approveTrainer(approvalForm.trainerId, salary);
      
      // Update the trainers list
      setTrainers(trainers.map(trainer => 
        trainer._id === approvalForm.trainerId 
          ? { ...trainer, approved: true, isActive: true, approvedSalary: salary } 
          : trainer
      ));
      
      setApprovalForm({ show: false, trainerId: '', approvedSalary: 0 });
      alert('Trainer approved successfully!');
    } catch (err) {
      setError('Failed to approve trainer: ' + err.message);
    }
  };

  // Helper function to get trainer status
  const getTrainerStatus = (trainer) => {
    if (trainer.isActive === false) return 'Inactive';
    if (!trainer.approved) return 'Pending Approval';
    return 'Active';
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) return <div className="loading">Loading trainers...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-content">
      <div className="trainer-management-container">
        <h2>Trainer Management</h2>
        
        {/* Trainer List */}
        <div className="trainer-list">
          <h3>All Trainers ({trainers.length})</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Specialties</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trainers.map(trainer => (
                <tr key={trainer._id} className={
                  trainer.isActive === false ? 'inactive-trainer' : 
                  !trainer.approved ? 'pending-approval' : ''
                }>
                  <td>{trainer.name}</td>
                  <td>{trainer.email}</td>
                  <td>{trainer.specialties?.join(', ') || 'N/A'}</td>
                  <td>{getTrainerStatus(trainer)}</td>
                  <td className="action-buttons">
                    <button 
                      onClick={() => handleViewDetails(trainer._id)} 
                      title="View Details"
                      className="icon-button"
                    >
                      <FaEye />
                    </button>
                    <button 
                      onClick={() => handleEditTrainer(trainer)} 
                      title="Edit Trainer"
                      className="icon-button"
                    >
                      <FaEdit />
                    </button>
                    {!trainer.approved && trainer.isActive !== false && (
                      <button 
                        onClick={() => setApprovalForm({ 
                          show: true, 
                          trainerId: trainer._id, 
                          approvedSalary: trainer.expectedSalary || 0 
                        })} 
                        title="Approve Trainer"
                        className="icon-button approve"
                      >
                        <FaCheck />
                      </button>
                    )}
                    {!trainer.approved && trainer.isActive !== false && (
                      <button 
                        onClick={() => handleRejectTrainer(trainer._id)} 
                        title="Reject Trainer"
                        className="icon-button delete"
                      >
                        <FaTimes />
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        setSelectedTrainer(trainer);
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
              setSelectedTrainer(null);
              setShowNotificationForm(true);
            }}
            className="primary-button"
          >
            Send Bulk Notification
          </button>
        </div>

        {/* Trainer Details View */}
        {selectedTrainer && !editMode && !showNotificationForm && !approvalForm.show && (
          <div className="trainer-details">
            <h3>Trainer Details</h3>
            {detailsLoading ? (
              <div className="loading">Loading details...</div>
            ) : (
              <div className="details-container">
                <div className="detail-item">
                  <strong>Name:</strong> {selectedTrainer.name}
                </div>
                <div className="detail-item">
                  <strong>Email:</strong> {selectedTrainer.email}
                </div>
                <div className="detail-item">
                  <strong>Specialties:</strong> {selectedTrainer.specialties?.join(', ') || 'N/A'}
                </div>
                <div className="detail-item">
                  <strong>Bio:</strong> {selectedTrainer.bio || 'No bio provided'}
                </div>
                <div className="detail-item">
                  <strong>Status:</strong> {getTrainerStatus(selectedTrainer)}
                </div>
                {selectedTrainer.approved && (
                  <div className="detail-item">
                    <strong>Approved Salary:</strong> {formatCurrency(selectedTrainer.approvedSalary)}
                  </div>
                )}
              </div>
            )}
            <button 
              onClick={() => setSelectedTrainer(null)}
              className="secondary-button"
            >
              Close
            </button>
          </div>
        )}

        {/* Edit Trainer Form */}
        {editMode && selectedTrainer && (
          <div className="edit-trainer-form">
            <h3>Edit Trainer: {selectedTrainer.name}</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleUpdateTrainer();
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
                <label>Specialties (comma separated):</label>
                <input
                  type="text"
                  value={Array.isArray(editData.specialties) ? editData.specialties.join(', ') : ''}
                  onChange={(e) => setEditData({
                    ...editData, 
                    specialties: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                  })}
                />
              </div>
              <div className="form-group">
                <label>Bio:</label>
                <textarea
                  value={editData.bio}
                  onChange={(e) => setEditData({...editData, bio: e.target.value})}
                  rows={4}
                />
              </div>
              {selectedTrainer.approved && (
                <div className="form-group">
                  <label>Approved Salary ($):</label>
                  <input
                    type="number"
                    value={editData.approvedSalary}
                    onChange={(e) => setEditData({...editData, approvedSalary: e.target.value})}
                    min="0"
                    step="0.01"
                  />
                </div>
              )}
              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={editData.isActive}
                    onChange={(e) => setEditData({...editData, isActive: e.target.checked})}
                  />
                  Active
                </label>
              </div>
              <div className="form-buttons">
                <button type="submit" className="primary-button">Save Changes</button>
                <button 
                  type="button" 
                  onClick={() => {
                    setEditMode(false);
                    setSelectedTrainer(null);
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
            <h3>Send {selectedTrainer ? `Notification to ${selectedTrainer.name}` : 'Bulk Notification'}</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              selectedTrainer ? handleSendNotification() : handleBulkNotification();
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
                  <option value="Schedule">Schedule</option>
                  <option value="Payment">Payment</option>
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

        {/* Approval Form */}
        {approvalForm.show && (
          <div className="approval-form">
            <h3>Approve Trainer</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleApproveTrainer();
            }}>
              <div className="form-group">
                <label>Approved Monthly Salary ($):</label>
                <input
                  type="number"
                  value={approvalForm.approvedSalary}
                  onChange={(e) => setApprovalForm({
                    ...approvalForm, 
                    approvedSalary: e.target.value
                  })}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="form-buttons">
                <button type="submit" className="primary-button">Approve Trainer</button>
                <button 
                  type="button" 
                  onClick={() => setApprovalForm({ show: false, trainerId: '', approvedSalary: 0 })}
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

export default TrainerManagement; 