// src/components/Admin/AdminAnnouncements.jsx
import React, { useState, useEffect } from 'react';
import { getAnnouncementsAdmin, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../../api';
import { Form, Button, Spinner, Alert } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import '../../styles/AdminStyle.css';

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isActive: true,
    id: null
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAnnouncementsAdmin();
      console.log('Fetched announcements:', response.data);
      setAnnouncements(response.data);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError('Failed to load announcements. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (formData.id) {
        // Update existing announcement
        await updateAnnouncement(formData.id, {
          title: formData.title,
          content: formData.content,
          isActive: formData.isActive
        });
      } else {
        // Create new announcement
        await createAnnouncement({
          title: formData.title,
          content: formData.content,
          isActive: formData.isActive
        });
      }
      
      // Refresh announcements list
      await fetchAnnouncements();
      
      // Reset form
      resetForm();
    } catch (err) {
      console.error('Error saving announcement:', err);
      setError('Failed to save announcement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (announcement) => {
    setFormData({
      id: announcement._id,
      title: announcement.title,
      content: announcement.content,
      isActive: announcement.isActive || true
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await deleteAnnouncement(id);
      await fetchAnnouncements();
    } catch (err) {
      console.error('Error deleting announcement:', err);
      setError('Failed to delete announcement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      isActive: true,
      id: null
    });
    setShowForm(false);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="announcements-management">
      <h1 className="announcements-title">Announcements Management</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <div className="announcements-actions">
        <Button 
          variant="primary" 
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="create-announcement-btn"
        >
          {showForm ? 'Cancel' : <><FaPlus /> CREATE ANNOUNCEMENT</>}
        </Button>
      </div>
      
      {showForm && (
        <div className="announcement-form">
          <h3>{formData.id ? 'Edit Announcement' : 'Create New Announcement'}</h3>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Content</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Active"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
              />
            </Form.Group>
            
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" /> : 'Save'}
            </Button>
          </Form>
        </div>
      )}
      
      <div className="announcement-list">
        {loading && !showForm ? (
          <div className="text-center my-4">
            <Spinner animation="border" />
          </div>
        ) : announcements.length === 0 ? (
          <p className="text-center my-4">No announcements found.</p>
        ) : (
          announcements.map(announcement => (
            <div key={announcement._id} className="announcement-card">
              <div className="announcement-header">
                <h3>{announcement.title}</h3>
                <div className="announcement-status">
                  {announcement.isActive ? (
                    <span className="active-badge"><FaCheck /> Active</span>
                  ) : (
                    <span className="inactive-badge"><FaTimes /> Inactive</span>
                  )}
                </div>
              </div>
              
              <div className="announcement-content">
                <p>{announcement.content}</p>
              </div>
              
              <div className="announcement-footer">
                <div className="announcement-date">
                  Updated: {formatDate(announcement.updatedAt)}
                </div>
                <div className="announcement-actions">
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    onClick={() => handleEdit(announcement)}
                    className="edit-btn"
                  >
                    <FaEdit /> Edit
                  </Button>
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    onClick={() => handleDelete(announcement._id)}
                    className="delete-btn"
                  >
                    <FaTrash /> Delete
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminAnnouncements;