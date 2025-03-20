import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { 
  Container, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Button, 
  Chip, 
  Box, 
  Alert, 
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon, 
  Cancel as CancelIcon 
} from '@mui/icons-material';
import API from '../../api';

const TrainerAppointments = () => {
  const { trainer } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchAppointments();
  }, [trainer]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!trainer) return;
      
      const trainerId = trainer.id || trainer._id;
      const response = await API.get(`/appointments/trainer/${trainerId}`);
      
      // Filter to only show pending and confirmed appointments
      const filteredAppointments = response.data.filter(
        a => a.status === 'pending' || a.status === 'confirmed'
      );
      
      setAppointments(filteredAppointments);
    } catch (err) {
      setError("Failed to load appointments: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentId, status) => {
    try {
      await API.put(`/appointments/${appointmentId}`, { status });
      
      // After updating, refresh the appointments list
      fetchAppointments();
    } catch (err) {
      setError("Failed to update appointment status: " + err.message);
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Filter appointments based on the selected tab
  const filteredAppointments = tabValue === 0 
    ? appointments 
    : tabValue === 1 
      ? appointments.filter(a => a.status === 'pending')
      : appointments.filter(a => a.status === 'confirmed');

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Appointments Management
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="appointment tabs">
          <Tab label="All" />
          <Tab label="Pending" />
          <Tab label="Confirmed" />
        </Tabs>
      </Box>
      
      {filteredAppointments.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Client</TableCell>
                <TableCell>Date & Time</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAppointments.map((appointment) => (
                <TableRow key={appointment._id}>
                  <TableCell>
                    {appointment.userId.name}
                    <Typography variant="body2" color="textSecondary">
                      {appointment.userId.email}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatDate(appointment.date)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)} 
                      color={getStatusColor(appointment.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {appointment.status === 'pending' ? (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleStatusUpdate(appointment._id, 'confirmed')}
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          startIcon={<CancelIcon />}
                          onClick={() => handleStatusUpdate(appointment._id, 'cancelled')}
                        >
                          Cancel
                        </Button>
                      </Box>
                    ) : (
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        startIcon={<CancelIcon />}
                        onClick={() => handleStatusUpdate(appointment._id, 'cancelled')}
                      >
                        Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="textSecondary">
            No {tabValue === 0 ? '' : tabValue === 1 ? 'pending' : 'confirmed'} appointments found.
          </Typography>
        </Paper>
      )}
      
      <Box sx={{ mt: 3, textAlign: 'right' }}>
        <Button 
          variant="contained" 
          color="primary"
          onClick={fetchAppointments}
        >
          Refresh
        </Button>
      </Box>
    </Container>
  );
};

export default TrainerAppointments; 