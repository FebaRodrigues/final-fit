//src/components/Trainer/TrainerDashboard.jsx
import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import API from "../../api";
import { useNavigate } from "react-router-dom";
import { 
  Grid, 
  Paper, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  CardActions, 
  Avatar, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Divider, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Box, 
  Chip,
  CircularProgress,
  Alert,
  IconButton
} from '@mui/material';
import { 
  Person as PersonIcon, 
  Event as EventIcon, 
  CheckCircle as CheckCircleIcon, 
  Cancel as CancelIcon, 
  Schedule as ScheduleIcon,
  ArrowForward as ArrowForwardIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  FitnessCenter as FitnessCenterIcon,
  Flag as FlagIcon
} from '@mui/icons-material';
import '../../styles/TrainerDashboard.css';
import '../../styles/ModernTrainerStyles.css';

const TrainerDashboard = () => {
  const { trainer } = useContext(AuthContext);
  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({
    totalClients: 0,
    pendingAppointments: 0,
    confirmedAppointments: 0,
    completedGoals: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    if (!trainer || (!trainer.id && !trainer._id)) {
      setError("Trainer not authenticated or missing ID");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const trainerId = trainer.id || trainer._id;
        const clientsResponse = await API.get(`/trainers/${trainerId}/clients`);
        const appointmentsResponse = await API.get(`/appointments/trainer/${trainerId}`);
        
        // Filter to only show pending and confirmed appointments
        const filteredAppointments = appointmentsResponse.data.filter(
          a => a.status === 'pending' || a.status === 'confirmed'
        );
        
        setClients(clientsResponse.data);
        setAppointments(filteredAppointments);
        
        // Update stats
        const pendingAppointments = filteredAppointments.filter(a => a.status === 'pending').length;
        const confirmedAppointments = filteredAppointments.filter(a => a.status === 'confirmed').length;
        
        setStats({
          totalClients: clientsResponse.data.length,
          pendingAppointments,
          confirmedAppointments,
          completedGoals: 0 // This would need a separate API call to get completed goals
        });
      } catch (err) {
        setError("Failed to fetch data: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [trainer, navigate]);

  useEffect(() => {
    // Update date every minute
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const handleStatusUpdate = async (appointmentId, status) => {
    try {
      await API.put(`/appointments/${appointmentId}`, { status });
      const trainerId = trainer.id || trainer._id;
      const response = await API.get(`/appointments/trainer/${trainerId}`);
      
      // Filter to only show pending and confirmed appointments
      const filteredAppointments = response.data.filter(
        a => a.status === 'pending' || a.status === 'confirmed'
      );
      
      setAppointments(filteredAppointments);
      
      // Update stats
      const pendingAppointments = filteredAppointments.filter(a => a.status === 'pending').length;
      const confirmedAppointments = filteredAppointments.filter(a => a.status === 'confirmed').length;
      
      setStats(prevStats => ({
        ...prevStats,
        pendingAppointments,
        confirmedAppointments
      }));
    } catch (err) {
      setError("Failed to update appointment status: " + err.message);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      case 'completed': return 'info';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatCurrentDate = () => {
    const options = { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    };
    return currentDate.toLocaleDateString(undefined, options);
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
    </Box>
  );
  
  if (error) return (
    <Box sx={{ p: 3 }}>
      <Alert severity="error">{error}</Alert>
    </Box>
  );

  const trainerId = trainer.id || trainer._id;

  return (
    <div className="trainer-page-container">
      <h2 className="trainer-page-title">Trainer Dashboard</h2>
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <>
          {/* Welcome Section */}
          <div className="dashboard-welcome">
            <h2>Welcome back, {trainer.name || 'Trainer'}!</h2>
            <p>Today is {formatCurrentDate()}</p>
            <p>Here's an overview of your clients and upcoming appointments.</p>
          </div>

          {/* Stats Overview */}
          <div className="trainer-grid">
            <div className="stats-card">
              <div className="stats-card-value">{stats.totalClients}</div>
              <div className="stats-card-label">Total Clients</div>
            </div>
            <div className="stats-card">
              <div className="stats-card-value">{stats.pendingAppointments}</div>
              <div className="stats-card-label">Pending Appointments</div>
            </div>
            <div className="stats-card">
              <div className="stats-card-value">{stats.confirmedAppointments}</div>
              <div className="stats-card-label">Completed Sessions</div>
            </div>
            <div className="stats-card">
              <div className="stats-card-value">{stats.completedGoals}</div>
              <div className="stats-card-label">Completed Goals</div>
            </div>
          </div>

          {/* Recent Appointments */}
          <div className="trainer-card">
            <h3>Upcoming Appointments</h3>
              {appointments.length > 0 ? (
              <table className="trainer-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.slice(0, 5).map((appointment) => (
                    <tr key={appointment._id}>
                      <td>
                        <div className="client-info">
                          <div className="client-avatar">
                            {appointment.userId.name.charAt(0)}
                          </div>
                          <span>{appointment.userId.name}</span>
                        </div>
                      </td>
                      <td>{formatDate(appointment.date)}</td>
                      <td>
                        <span className={`status-badge status-${appointment.status.toLowerCase()}`}>
                          {appointment.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {appointment.status === 'pending' && (
                            <>
                              <button 
                                className="trainer-btn trainer-btn-success action-btn"
                              onClick={() => handleStatusUpdate(appointment._id, 'confirmed')}
                            >
                              Confirm
                              </button>
                              <button 
                                className="trainer-btn trainer-btn-secondary action-btn"
                              onClick={() => handleStatusUpdate(appointment._id, 'cancelled')}
                            >
                              Cancel
                              </button>
                            </>
                          )}
                          {appointment.status === 'confirmed' && (
                            <button 
                              className="trainer-btn trainer-btn-primary action-btn"
                              onClick={() => handleStatusUpdate(appointment._id, 'completed')}
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-data-message">No upcoming appointments</p>
            )}
            <div className="card-actions">
              <button 
                className="trainer-btn trainer-btn-secondary"
                    onClick={() => navigate('/trainer/appointments')}
                  >
                    View All Appointments
              </button>
            </div>
          </div>

          {/* Recent Clients */}
          <div className="trainer-card">
            <h3>Recent Clients</h3>
            {clients.length > 0 ? (
              <div className="clients-list">
                {clients.slice(0, 5).map((client) => (
                  <div key={client._id} className="client-list-item">
                    <div className="client-info">
                      <div className="client-avatar">
                        {client.name.charAt(0)}
                      </div>
                      <div className="client-details">
                        <h4>{client.name}</h4>
                        <p>{client.email}</p>
                        {client.phone && <p className="client-phone">{client.phone}</p>}
                        {client.goals && client.goals.length > 0 && (
                          <div className="client-goals">
                            <span className="goal-label">Goal:</span> {client.goals[0].description || 'No goal set'}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="client-actions">
                      <button 
                        className="trainer-btn trainer-btn-primary"
                        onClick={() => navigate(`/trainer/clients/${client._id}`)}
                      >
                        View Profile
                      </button>
                      <button 
                        className="trainer-btn trainer-btn-secondary"
                        onClick={() => navigate(`/trainer/workout-plans/create?clientId=${client._id}`)}
                      >
                        Create Plan
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data-message">No clients yet</p>
            )}
            <div className="card-actions">
              <button 
                className="trainer-btn trainer-btn-secondary"
                onClick={() => navigate('/trainer/clients')}
              >
                View All Clients
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="trainer-card">
            <h3>Quick Actions</h3>
            <div className="quick-actions">
              <button 
                className="trainer-btn trainer-btn-primary quick-action-btn"
                onClick={() => navigate('/trainer/clients')}
              >
                <PeopleIcon />
                Manage Clients
              </button>
              <button 
                className="trainer-btn trainer-btn-primary quick-action-btn"
                onClick={() => navigate('/trainer/workout-plans')}
              >
                <FitnessCenterIcon />
                Create Workout Plan
              </button>
              <button 
                className="trainer-btn trainer-btn-primary quick-action-btn"
                onClick={() => navigate('/trainer/goals')}
              >
                <FlagIcon />
                Set Client Goals
              </button>
              <button 
                className="trainer-btn trainer-btn-primary quick-action-btn"
                onClick={() => navigate('/trainer/appointments')}
              >
                <EventIcon />
                Schedule Sessions
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TrainerDashboard;