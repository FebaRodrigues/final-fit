import React, { useState, useEffect } from 'react';
import { getAnnouncements } from '../api';
import { Spinner, Alert } from 'react-bootstrap';
import { FaBullhorn, FaCalendarAlt } from 'react-icons/fa';
import '../styles/Announcements.css';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAnnouncements();
      console.log('Fetched announcements:', response.data);
      // Filter only active announcements for public view
      const activeAnnouncements = response.data.filter(announcement => announcement.isActive);
      setAnnouncements(activeAnnouncements);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError('Failed to load announcements. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="announcements-container">
      <div className="announcements-header">
        <h2><FaBullhorn /> Announcements</h2>
        <p>Stay updated with the latest news and events from our fitness center</p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : (
        <>
          {announcements.length > 0 ? (
            <div className="announcements-list">
              {announcements.map((announcement) => (
                <div key={announcement._id} className="announcement-card">
                  <div className="announcement-header">
                    <h3>{announcement.title}</h3>
                  </div>
                  <div className="announcement-content">
                    {announcement.content}
                  </div>
                  <div className="announcement-footer">
                    <span className="announcement-date">
                      <FaCalendarAlt /> {formatDate(announcement.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-announcements">
              <p>No announcements available at this time.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Announcements; 