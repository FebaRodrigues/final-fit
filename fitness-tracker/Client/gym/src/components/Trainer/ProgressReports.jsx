import React, { useContext, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import API from "../../api";
import { getAllTrainers, getUserAppointments, bookAppointment, getClientProgressReports, createProgressReport, sendNotification } from "../../api";
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
  CardActions,
  Button, 
  TextField, 
  ToggleButton, 
  ToggleButtonGroup, 
  CircularProgress, 
  Alert, 
  Chip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip as MuiTooltip,
  Snackbar
} from '@mui/material';
import { 
  Person as PersonIcon, 
  Assessment as AssessmentIcon, 
  FitnessCenter as FitnessCenterIcon, 
  MonitorWeight as WeightIcon, 
  LocalFireDepartment as FireIcon, 
  EmojiEvents as TrophyIcon, 
  Repeat as RepeatIcon, 
  Send as SendIcon, 
  CalendarToday as CalendarIcon,
  ExpandMore as ExpandMoreIcon,
  AccessTime as TimeIcon,
  History as HistoryIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import '../../styles/ProgressReports.css';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ProgressReports = () => {
  const { trainer } = useAuth();
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [reportPeriod, setReportPeriod] = useState("month"); // week, month, 3months
  const [reportNotes, setReportNotes] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportSent, setReportSent] = useState(false);
  const [previousReports, setPreviousReports] = useState([]);
  const [expandedReport, setExpandedReport] = useState(null);

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

  const fetchClientData = async (clientId) => {
    setLoading(true);
    setReportSent(false);
    try {
      // Find the selected client from the clients array
      const client = clients.find(c => c._id === clientId);
      setSelectedClient(client);

      // Fetch client's progress data for the selected period
      try {
      const response = await API.get(`/trainers/client-progress/${clientId}?period=${reportPeriod}`);
        console.log("Client progress data:", response.data);
      setClientData(response.data);
      } catch (progressError) {
        console.error("Error fetching client progress:", progressError);
        setError(`Failed to fetch client progress data: ${progressError.message}`);
        setClientData(null);
      }

      // Fetch previous reports for this client
      try {
      const reportsResponse = await getClientProgressReports(clientId);
        console.log("Previous reports:", reportsResponse.data);
      setPreviousReports(reportsResponse.data);
      } catch (reportsError) {
        console.error("Error fetching previous reports:", reportsError);
        setPreviousReports([]);
      }

      // Reset form fields
      setReportNotes("");
      setRecommendations("");
    } catch (err) {
      console.error("Error in fetchClientData:", err);
      setError("Failed to fetch client data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = (clientId) => {
    fetchClientData(clientId);
  };

  const handlePeriodChange = (event, newPeriod) => {
    if (newPeriod !== null) {
      setReportPeriod(newPeriod);
    if (selectedClient) {
      fetchClientData(selectedClient._id);
    }
    }
  };

  const handleReportAccordionChange = (reportId) => (event, isExpanded) => {
    setExpandedReport(isExpanded ? reportId : null);
  };

  const generateReport = async () => {
    if (!selectedClient || !clientData) return;

    try {
      setLoading(true);
      const trainerId = trainer.id || trainer._id;
      
      const reportData = {
        trainerId,
        clientId: selectedClient._id,
        period: reportPeriod,
        notes: reportNotes,
        recommendations,
        progressData: {
          weightProgress: clientData.weightLogs || [],
          workoutProgress: clientData.workoutLogs || [],
          goalProgress: clientData.goalProgress || []
        },
        metrics: {
          workoutsCompleted: clientData.metrics.workoutsCompleted || 0,
          averageDuration: clientData.metrics.averageDuration || 0,
          caloriesBurned: clientData.metrics.caloriesBurned || 0,
          goalsAchieved: clientData.metrics.goalsAchieved || 0,
          consistency: clientData.metrics.consistency || 0
        }
      };
      
      await createProgressReport(reportData);
      
      // Send notification to client
      await sendNotification({
        userId: selectedClient._id,
        message: `Your trainer ${trainer.name} has sent you a new progress report.`,
        type: 'progress_report'
      });
      
      setReportSent(true);
      
      // Refresh previous reports
      const reportsResponse = await getClientProgressReports(selectedClient._id);
      setPreviousReports(reportsResponse.data);
      
      // Reset form fields
      setReportNotes("");
      setRecommendations("");
      
      // Auto-close success message after 5 seconds
      setTimeout(() => {
        setReportSent(false);
      }, 5000);
    } catch (err) {
      setError("Failed to generate report: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Prepare weight progress chart data
  const prepareWeightChartData = () => {
    if (!clientData || !clientData.weightLogs || clientData.weightLogs.length === 0) {
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
    const sortedLogs = [...clientData.weightLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
    
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

  // Prepare workout progress chart data
  const prepareWorkoutChartData = () => {
    if (!clientData || !clientData.workoutLogs || clientData.workoutLogs.length === 0) {
      return {
        labels: [],
        datasets: [
          {
            label: 'Duration (minutes)',
            data: [],
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            tension: 0.1,
            fill: true
          }
        ]
      };
    }

    // Sort logs by date
    const sortedLogs = [...clientData.workoutLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return {
      labels: sortedLogs.map(log => new Date(log.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Duration (minutes)',
          data: sortedLogs.map(log => log.duration),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1,
          fill: true
        }
      ]
    };
  };

  const getPeriodLabel = (period) => {
    switch(period) {
      case 'week': return 'Weekly';
      case 'month': return 'Monthly';
      case '3months': return 'Quarterly';
      default: return period;
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading && !selectedClient) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="progress-reports" sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Progress Reports
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Client List */}
        <Grid item xs={12} md={4} lg={3}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Select Client
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
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <PersonIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="textSecondary">
                  No clients assigned yet.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Report Generation */}
        <Grid item xs={12} md={8} lg={9}>
          {!selectedClient ? (
            <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 400 }}>
              <AssessmentIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Select a client to generate a progress report
              </Typography>
              <Typography variant="body2" color="textSecondary" align="center">
                Choose a client from the list to view their progress data and create a personalized report.
              </Typography>
            </Paper>
          ) : (
            <>
              <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <PersonIcon />
                    </Avatar>
                    <Typography variant="h6">
                      {selectedClient.name}'s Progress Report
                    </Typography>
                  </Box>
                  <ToggleButtonGroup
                    value={reportPeriod}
                    exclusive
                    onChange={handlePeriodChange}
                    aria-label="report period"
                    size="small"
                  >
                    <ToggleButton value="week" aria-label="weekly">
                Weekly
                    </ToggleButton>
                    <ToggleButton value="month" aria-label="monthly">
                Monthly
                    </ToggleButton>
                    <ToggleButton value="3months" aria-label="quarterly">
                Quarterly
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                    <CircularProgress />
                  </Box>
                ) : !clientData ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <AssessmentIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      No progress data available
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      This client doesn't have any recorded progress data for the selected period.
                    </Typography>
                  </Box>
                ) : (
                  <>
                    {/* Progress Charts */}
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                      <Grid item xs={12} md={6}>
                        <Card elevation={2}>
                          <CardHeader 
                            title="Weight Progress" 
                            avatar={<Avatar sx={{ bgcolor: 'info.light' }}><WeightIcon /></Avatar>}
                          />
                          <CardContent>
                            <Box sx={{ height: 250 }}>
                              <Line 
                                data={prepareWeightChartData()} 
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: {
                                      position: 'top',
                                    },
                                  },
                                }}
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Card elevation={2}>
                          <CardHeader 
                            title="Workout Progress" 
                            avatar={<Avatar sx={{ bgcolor: 'secondary.light' }}><FitnessCenterIcon /></Avatar>}
                          />
                          <CardContent>
                            <Box sx={{ height: 250 }}>
                              <Line 
                                data={prepareWorkoutChartData()} 
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: {
                                      position: 'top',
                                    },
                                  },
                                }}
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                    
                    {/* Performance Metrics */}
                    <Typography variant="h6" gutterBottom>
                      Performance Metrics
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={6} sm={4} md={2.4}>
                        <Card elevation={2} className="metric-card">
                          <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1 }}>
                              <FitnessCenterIcon />
                            </Avatar>
                            <Typography variant="h4" color="primary.main">
                              {clientData.metrics.workoutsCompleted || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Workouts Completed
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={4} md={2.4}>
                        <Card elevation={2} className="metric-card">
                          <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Avatar sx={{ bgcolor: 'secondary.main', mx: 'auto', mb: 1 }}>
                              <TimeIcon />
                            </Avatar>
                            <Typography variant="h4" color="secondary.main">
                              {clientData.metrics.averageDuration || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Avg. Duration (min)
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={4} md={2.4}>
                        <Card elevation={2} className="metric-card">
                          <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Avatar sx={{ bgcolor: 'error.main', mx: 'auto', mb: 1 }}>
                              <FireIcon />
                            </Avatar>
                            <Typography variant="h4" color="error.main">
                              {clientData.metrics.caloriesBurned || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Calories Burned
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={4} md={2.4}>
                        <Card elevation={2} className="metric-card">
                          <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 1 }}>
                              <TrophyIcon />
                            </Avatar>
                            <Typography variant="h4" color="success.main">
                              {clientData.metrics.goalsAchieved || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Goals Achieved
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={4} md={2.4}>
                        <Card elevation={2} className="metric-card">
                          <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 1 }}>
                              <RepeatIcon />
                            </Avatar>
                            <Typography variant="h4" color="warning.main">
                              {clientData.metrics.consistency || 0}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Consistency
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                    
                    {/* Report Form */}
                    <Card elevation={2} sx={{ mb: 3 }}>
                      <CardHeader title="Trainer Notes & Recommendations" />
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Progress Notes"
                              multiline
                              rows={4}
                    value={reportNotes}
                    onChange={(e) => setReportNotes(e.target.value)}
                    placeholder="Enter your observations about the client's progress..."
                              variant="outlined"
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Recommendations"
                              multiline
                    rows={4}
                    value={recommendations}
                    onChange={(e) => setRecommendations(e.target.value)}
                    placeholder="Enter your recommendations for improvement..."
                              variant="outlined"
                            />
                          </Grid>
                        </Grid>
                      </CardContent>
                      <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<SendIcon />}
                  onClick={generateReport}
                          disabled={!reportNotes || !recommendations || loading}
                        >
                          {loading ? <CircularProgress size={24} /> : 'Generate & Send Report'}
                        </Button>
                      </CardActions>
                    </Card>
                    
                    {/* Success Message */}
                    <Snackbar
                      open={reportSent}
                      autoHideDuration={5000}
                      onClose={() => setReportSent(false)}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    >
                      <Alert onClose={() => setReportSent(false)} severity="success" sx={{ width: '100%' }}>
                        Report sent successfully!
                      </Alert>
                    </Snackbar>
                  </>
                )}
              </Paper>
              
              {/* Previous Reports */}
          {previousReports.length > 0 && (
                <Paper elevation={3} sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <HistoryIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="h6">
                      Previous Reports
                    </Typography>
                  </Box>
                  
                {previousReports.map((report) => (
                    <Accordion 
                      key={report._id}
                      expanded={expandedReport === report._id}
                      onChange={handleReportAccordionChange(report._id)}
                      className="report-accordion"
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls={`panel-${report._id}-content`}
                        id={`panel-${report._id}-header`}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <DescriptionIcon sx={{ mr: 2, color: 'primary.main' }} />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {formatDate(report.createdAt)} - {getPeriodLabel(report.period)} Report
                            </Typography>
                          </Box>
                          <Chip 
                            icon={<CalendarIcon />} 
                            label={getPeriodLabel(report.period)} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>
                              Notes:
                            </Typography>
                            <Typography variant="body2" paragraph>
                              {report.notes}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>
                              Recommendations:
                            </Typography>
                            <Typography variant="body2" paragraph>
                              {report.recommendations}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <Button 
                                variant="outlined" 
                                size="small"
                                startIcon={<AssessmentIcon />}
                              >
                                View Full Report
                              </Button>
                            </Box>
                          </Grid>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Paper>
              )}
            </>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProgressReports; 