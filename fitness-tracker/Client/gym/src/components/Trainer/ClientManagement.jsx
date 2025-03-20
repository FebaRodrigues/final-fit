import React, { useContext, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import API from "../../api";
import { useNavigate } from "react-router-dom";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Divider, 
  Card, 
  CardContent, 
  CardHeader, 
  CircularProgress, 
  Alert, 
  Chip, 
  LinearProgress,
  Tabs,
  Tab,
  Button,
  IconButton
} from '@mui/material';
import { 
  Person as PersonIcon, 
  FitnessCenter as FitnessCenterIcon, 
  Flag as FlagIcon, 
  Timeline as TimelineIcon, 
  Info as InfoIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  CheckCircle as CheckCircleIcon,
  DirectionsRun as RunIcon
} from '@mui/icons-material';
import '../../styles/ClientManagement.css';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ClientManagement = () => {
  const { trainer } = useAuth();
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientProgress, setClientProgress] = useState(null);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!trainer || (!trainer.id && !trainer._id)) {
      setError("Trainer not authenticated or missing ID");
      setLoading(false);
      return;
    }

    const fetchClients = async () => {
      setLoading(true);
      try {
        const trainerId = trainer.id || trainer._id;
        const response = await API.get(`/trainers/${trainerId}/clients`);
        setClients(response.data);
      } catch (err) {
        setError("Failed to fetch clients: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [trainer]);

  const handleClientSelect = async (clientId) => {
    setLoading(true);
    try {
      // Find the selected client from the clients array
      const client = clients.find(c => c._id === clientId);
      setSelectedClient(client);

      // Try fetching workout logs first
      let workoutData = [];
      try {
        console.log("Fetching workout logs for client:", clientId);
        const workoutLogsResponse = await API.get(`/workout-logs/user/${clientId}`);
        console.log("Workout logs response:", workoutLogsResponse.data);
        
        if (workoutLogsResponse.data && Array.isArray(workoutLogsResponse.data)) {
          workoutData = workoutLogsResponse.data;
        } else if (workoutLogsResponse.data && Array.isArray(workoutLogsResponse.data.workoutLogs)) {
          workoutData = workoutLogsResponse.data.workoutLogs;
        }
      } catch (workoutError) {
        console.error("Error fetching workout logs:", workoutError);
      }

      // If no workout logs found, try regular workouts endpoint
      if (workoutData.length === 0) {
        try {
          console.log("Fetching workouts for client:", clientId);
      const workoutResponse = await API.get(`/workouts/user/${clientId}`);
          console.log("Workout response:", workoutResponse.data);
          
          if (workoutResponse.data && Array.isArray(workoutResponse.data)) {
            workoutData = workoutResponse.data;
          }
        } catch (fallbackError) {
          console.error("Error fetching workouts (fallback):", fallbackError);
        }
      }

      // Set workout data, ensuring it's an array
      setWorkoutLogs(Array.isArray(workoutData) ? workoutData : []);
      console.log("Final workout data set:", Array.isArray(workoutData) ? workoutData : []);

      // Fetch client's goals
      try {
        console.log("Fetching goals for client:", clientId);
      const goalsResponse = await API.get(`/goals/user/${clientId}`);
        console.log("Goals response:", goalsResponse.data);
        
        // Handle different response formats
        if (goalsResponse.data && Array.isArray(goalsResponse.data)) {
      setGoals(goalsResponse.data);
        } else if (goalsResponse.data && goalsResponse.data.goals && Array.isArray(goalsResponse.data.goals)) {
          setGoals(goalsResponse.data.goals);
        } else {
          setGoals([]);
        }
      } catch (goalsError) {
        console.error("Error fetching goals:", goalsError);
        setGoals([]);
      }

      // Fetch client's progress data
      try {
        console.log("Fetching progress data for client:", clientId);
      const progressResponse = await API.get(`/trainers/client-progress/${clientId}`);
        console.log("Progress response:", progressResponse.data);
      setClientProgress(progressResponse.data);
      } catch (progressError) {
        console.error("Error fetching client progress:", progressError);
        setClientProgress(null);
      }

    } catch (err) {
      console.error("Error in handleClientSelect:", err);
      setError("Failed to fetch client data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data for weight progress
  const prepareWeightChartData = () => {
    if (!clientProgress || !clientProgress.weightLogs || clientProgress.weightLogs.length === 0) {
      return {
        labels: [],
        datasets: [
          {
            label: 'Weight (kg)',
            data: [],
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.1,
            fill: true
          }
        ]
      };
    }

    // Sort logs by date
    const sortedLogs = [...clientProgress.weightLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return {
      labels: sortedLogs.map(log => new Date(log.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Weight (kg)',
          data: sortedLogs.map(log => log.weight),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
          fill: true
        }
      ]
    };
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
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

  return (
    <Box className="client-management" sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Client Management
      </Typography>

      <Grid container spacing={3}>
        {/* Client List Section */}
        <Grid item xs={12} md={4} lg={3}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Your Clients
            </Typography>
            
        {clients.length > 0 ? (
              <List className="client-list">
            {clients.map((client) => (
                  <React.Fragment key={client._id}>
                    <ListItem 
                      button 
                      selected={selectedClient && selectedClient._id === client._id}
                onClick={() => handleClientSelect(client._id)}
                      sx={{ 
                        borderRadius: 1,
                        mb: 1,
                        '&.Mui-selected': {
                          backgroundColor: 'primary.light',
                          color: 'primary.contrastText',
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: selectedClient && selectedClient._id === client._id ? 'primary.main' : 'grey.400' }}>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={client.name} 
                        secondary={client.email}
                        primaryTypographyProps={{
                          fontWeight: selectedClient && selectedClient._id === client._id ? 'bold' : 'normal'
                        }}
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body1" color="textSecondary" sx={{ p: 2 }}>
                No clients assigned yet.
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Client Details Section */}
        {selectedClient ? (
          <Grid item xs={12} md={8} lg={9}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, mr: 2 }}>
                  <PersonIcon fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h5">{selectedClient.name}</Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center' }}>
                    <EmailIcon fontSize="small" sx={{ mr: 0.5 }} />
                    {selectedClient.email}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={activeTab} onChange={handleTabChange} aria-label="client details tabs">
                  <Tab icon={<InfoIcon />} label="Info" />
                  <Tab icon={<FitnessCenterIcon />} label="Workouts" />
                  <Tab icon={<FlagIcon />} label="Goals" />
                  <Tab icon={<TimelineIcon />} label="Progress" />
                </Tabs>
              </Box>

              {/* Info Tab */}
              {activeTab === 0 && (
                <Box sx={{ p: 2 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Card elevation={2}>
                        <CardHeader title="Basic Information" />
                        <CardContent>
                          <Typography variant="body1" gutterBottom>
                            <strong>Age:</strong> {selectedClient.age || 'Not provided'}
                          </Typography>
                          <Typography variant="body1" gutterBottom>
                            <strong>Gender:</strong> {selectedClient.gender || 'Not provided'}
                          </Typography>
                          <Typography variant="body1" gutterBottom>
                            <strong>Height:</strong> {selectedClient.height ? `${selectedClient.height} cm` : 'Not provided'}
                          </Typography>
                          <Typography variant="body1" gutterBottom>
                            <strong>Weight:</strong> {selectedClient.weight ? `${selectedClient.weight} kg` : 'Not provided'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Card elevation={2}>
                        <CardHeader title="Weight Progress" />
                        <CardContent>
              {clientProgress && clientProgress.weightLogs && clientProgress.weightLogs.length > 0 ? (
                            <Box className="chart-container" sx={{ height: 250 }}>
                              <Line 
                                data={prepareWeightChartData()} 
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: {
                                      position: 'top',
                                    },
                                    title: {
                                      display: false,
                                    },
                                  },
                                }}
                              />
                            </Box>
                          ) : (
                            <Typography variant="body1" color="textSecondary">
                              No weight data available
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Workouts Tab */}
              {activeTab === 1 && (
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Recent Workouts
                  </Typography>
                  
                  {workoutLogs && workoutLogs.length > 0 ? (
                    <Grid container spacing={2}>
                {workoutLogs.slice(0, 5).map((log) => (
                        <Grid item xs={12} key={log._id}>
                          <Card elevation={2} className="workout-card">
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                                    <FitnessCenterIcon />
                                  </Avatar>
                                  <Box>
                                    <Typography variant="h6">
                                      {log.title || 'Workout Session'}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <CalendarIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                                      <Typography variant="body2" color="textSecondary">
                                        {formatDate(log.date)}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Box>
                                <Chip 
                                  icon={<TimeIcon />} 
                                  label={`${log.duration} min`} 
                                  color="primary" 
                                  variant="outlined" 
                                />
                              </Box>
                              
                              <Typography variant="subtitle1" gutterBottom>
                                Exercises:
                              </Typography>
                              
                              {log.exercises && log.exercises.length > 0 ? (
                                <List dense>
                      {log.exercises.map((exercise, index) => (
                                    <ListItem key={index}>
                                      <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: 'primary.light' }}>
                                          <RunIcon />
                                        </Avatar>
                                      </ListItemAvatar>
                                      <ListItemText 
                                        primary={exercise.name} 
                                        secondary={
                                          <>
                                            {exercise.sets && `${exercise.sets} sets`}
                                            {exercise.sets && exercise.reps && ' x '}
                                            {exercise.reps && `${exercise.reps} reps`}
                                            {!exercise.sets && !exercise.reps && exercise.duration && `${exercise.duration} min`}
                                          </>
                                        }
                                      />
                                    </ListItem>
                                  ))}
                                </List>
                              ) : (
                                <Typography variant="body2" color="textSecondary">
                                  No exercise details available
                                </Typography>
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Typography variant="body1" color="textSecondary">
                      No workout logs available
                    </Typography>
                  )}
                </Box>
              )}

              {/* Goals Tab */}
              {activeTab === 2 && (
                <Box sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Client Goals
                    </Typography>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      startIcon={<FlagIcon />}
                      onClick={() => navigate(`/trainer/goals/create?clientId=${selectedClient._id}`)}
                    >
                      Create New Goal
                    </Button>
                  </Box>
                  
            {goals.length > 0 ? (
                    <Grid container spacing={2}>
                {goals.map((goal) => (
                        <Grid item xs={12} sm={6} md={4} key={goal._id}>
                          <Card elevation={2} className="goal-card">
                            <CardContent>
                              <Typography variant="h6" gutterBottom>
                                {goal.title || goal.goalType}
                              </Typography>
                              
                              <Typography variant="body2" color="textSecondary" paragraph>
                                {goal.description}
                              </Typography>
                              
                              <Box sx={{ mb: 1 }}>
                                <Chip 
                                  label={goal.goalType || goal.type} 
                                  color="secondary" 
                                  size="small" 
                                  sx={{ mr: 1 }}
                                />
                              </Box>
                              
                              <Typography variant="body2" gutterBottom>
                                <strong>Target:</strong> {goal.targetValue} {goal.unit}
                              </Typography>
                              
                              <Typography variant="body2" gutterBottom>
                                <strong>Current:</strong> {goal.currentValue} {goal.unit}
                              </Typography>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                                <Box sx={{ flexGrow: 1, mr: 1 }}>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100)} 
                                    color={Math.round((goal.currentValue / goal.targetValue) * 100) >= 100 ? "success" : "primary"}
                                    sx={{ height: 10, borderRadius: 5 }}
                                  />
                                </Box>
                                <Typography variant="body2" color="textSecondary">
                                  {Math.round((goal.currentValue / goal.targetValue) * 100)}%
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                <Button 
                                  size="small" 
                                  variant="outlined" 
                                  onClick={() => navigate(`/trainer/goals/edit/${goal._id}`)}
                                >
                                  Update
                                </Button>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" color="textSecondary" paragraph>
                        No goals set for this client yet.
                      </Typography>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        startIcon={<FlagIcon />}
                        onClick={() => navigate(`/trainer/goals/create?clientId=${selectedClient._id}`)}
                      >
                        Create First Goal
                      </Button>
                    </Box>
                  )}
                </Box>
              )}

              {/* Progress Tab */}
              {activeTab === 3 && (
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Progress Overview
                  </Typography>
                  
                  {clientProgress ? (
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <Card elevation={2}>
                          <CardHeader title="Weight Progress" />
                          <CardContent>
                            {clientProgress.weightLogs && clientProgress.weightLogs.length > 0 ? (
                              <Box className="chart-container" sx={{ height: 300 }}>
                                <Line 
                                  data={prepareWeightChartData()} 
                                  options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                      legend: {
                                        position: 'top',
                                      },
                                      title: {
                                        display: false,
                                      },
                                    },
                                  }}
                                />
                              </Box>
                            ) : (
                              <Typography variant="body1" color="textSecondary">
                                No weight data available
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      {/* Additional progress metrics could be added here */}
                    </Grid>
                  ) : (
                    <Typography variant="body1" color="textSecondary">
                      No progress data available
                    </Typography>
                  )}
                </Box>
              )}
            </Paper>
          </Grid>
        ) : (
          <Grid item xs={12} md={8} lg={9}>
            <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 400 }}>
              <PersonIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Select a client to view details
              </Typography>
              <Typography variant="body2" color="textSecondary" align="center">
                Click on a client from the list to view their workouts, goals, and progress.
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default ClientManagement; 