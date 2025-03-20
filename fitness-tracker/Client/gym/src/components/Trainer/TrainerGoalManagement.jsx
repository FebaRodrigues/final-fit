import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAllUserGoals, getTrainerClients, deleteGoal } from '../../api';
import { toast } from 'react-toastify';
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
  Button, 
  IconButton, 
  Chip, 
  LinearProgress, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tooltip
} from '@mui/material';
import { 
  Person as PersonIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Add as AddIcon, 
  Flag as FlagIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  DirectionsRun as RunIcon,
  FitnessCenter as FitnessCenterIcon,
  MonitorWeight as WeightIcon,
  LocalDining as DiningIcon,
  DirectionsWalk as WalkIcon,
  Timer as TimerIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import '../../styles/TrainerGoalManagement.css';

const TrainerGoalManagement = () => {
  const { trainer } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientGoals, setClientGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState(null);
  
  // Fetch trainer's clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const response = await getTrainerClients();
        setClients(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching clients:', err);
        setError('Failed to fetch clients');
        setLoading(false);
      }
    };
    
    if (trainer && (trainer.id || trainer._id)) {
      fetchClients();
    }
  }, [trainer]);
  
  // Fetch selected client's goals
  useEffect(() => {
    const fetchClientGoals = async () => {
      if (!selectedClient) return;
      
      try {
        setLoading(true);
        const response = await getAllUserGoals(selectedClient._id);
        setClientGoals(response.data.goals || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching client goals:', err);
        setError('Failed to fetch client goals');
        setLoading(false);
      }
    };
    
    fetchClientGoals();
  }, [selectedClient]);
  
  const handleClientSelect = (client) => {
    setSelectedClient(client);
  };
  
  const handleCreateGoal = () => {
    if (!selectedClient) {
      toast.error('Please select a client first');
      return;
    }
    
    navigate('/trainer/goals/new', { state: { clientId: selectedClient._id } });
  };
  
  const handleEditGoal = (goalId) => {
    navigate(`/trainer/goals/edit/${goalId}`);
  };
  
  const openDeleteDialog = (goalId) => {
    setGoalToDelete(goalId);
    setDeleteDialogOpen(true);
  };
  
  const closeDeleteDialog = () => {
    setGoalToDelete(null);
    setDeleteDialogOpen(false);
  };
  
  const handleDeleteGoal = async () => {
    if (!goalToDelete) return;
    
    try {
      await deleteGoal(goalToDelete);
      toast.success('Goal deleted successfully');
      
      // Refresh goals
      const response = await getAllUserGoals(selectedClient._id);
      setClientGoals(response.data.goals || []);
      closeDeleteDialog();
    } catch (err) {
      console.error('Error deleting goal:', err);
      toast.error('Failed to delete goal');
      closeDeleteDialog();
    }
  };
  
  const getGoalTypeIcon = (goalType) => {
    switch(goalType.toLowerCase()) {
      case 'weight loss':
      case 'muscle gain':
        return <WeightIcon />;
      case 'endurance':
        return <TimerIcon />;
      case 'distance':
        return <RunIcon />;
      case 'calorie intake':
        return <DiningIcon />;
      case 'step count':
        return <WalkIcon />;
      case 'gym workouts':
        return <FitnessCenterIcon />;
      default:
        return <FlagIcon />;
    }
  };
  
  const getGoalStatusColor = (status) => {
    switch(status) {
      case 'active': return 'primary';
      case 'completed': return 'success';
      case 'failed': return 'error';
      default: return 'default';
    }
  };
  
  const getGoalUnit = (goalType) => {
    switch(goalType.toLowerCase()) {
      case 'weight loss':
      case 'muscle gain':
        return 'kg/lbs';
      case 'endurance':
        return 'min';
      case 'distance':
        return 'km/miles';
      case 'calorie intake':
        return 'kcal';
      case 'step count':
        return 'steps';
      case 'gym workouts':
        return 'workouts';
      default:
        return '';
    }
  };

  if (loading && !selectedClient) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box className="trainer-goal-management" sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Client Goal Management
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
              Your Clients
            </Typography>
            
            {clients.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <PersonIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="textSecondary">
                  No clients found.
                </Typography>
              </Box>
            ) : (
              <List className="client-list">
                {clients.map(client => (
                  <React.Fragment key={client._id}>
                    <ListItem 
                      button 
                      selected={selectedClient?._id === client._id}
                      onClick={() => handleClientSelect(client)}
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
                        <Avatar sx={{ bgcolor: selectedClient?._id === client._id ? 'primary.main' : 'grey.400' }}>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={client.name} 
                        secondary={client.email}
                        primaryTypographyProps={{
                          fontWeight: selectedClient?._id === client._id ? 'bold' : 'normal'
                        }}
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
        
        {/* Goals List */}
        <Grid item xs={12} md={8} lg={9}>
          <Paper elevation={3} sx={{ p: 2 }}>
            {!selectedClient ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <FlagIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  Select a client to view their goals
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Choose a client from the list to view and manage their fitness goals.
                </Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <PersonIcon />
                    </Avatar>
                    <Typography variant="h6">
                      {selectedClient.name}'s Goals
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleCreateGoal}
                  >
                    Create New Goal
                  </Button>
                </Box>
                
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                    <CircularProgress />
                  </Box>
                ) : clientGoals.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <FlagIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      No goals found for this client
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={handleCreateGoal}
                      sx={{ mt: 2 }}
                    >
                      Create Their First Goal
                    </Button>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table sx={{ minWidth: 650 }} aria-label="goals table">
                      <TableHead>
                        <TableRow>
                          <TableCell>Goal Type</TableCell>
                          <TableCell>Progress</TableCell>
                          <TableCell>Deadline</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {clientGoals.map(goal => (
                          <TableRow 
                            key={goal._id}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            className="goal-row"
                          >
                            <TableCell component="th" scope="row">
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ bgcolor: 'primary.light', mr: 2 }}>
                                  {getGoalTypeIcon(goal.goalType)}
                                </Avatar>
                                <Box>
                                  <Typography variant="body1" fontWeight="medium">
                                    {goal.goalType.charAt(0).toUpperCase() + goal.goalType.slice(1)}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {goal.currentValue} → {goal.targetValue} {getGoalUnit(goal.goalType)}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 200 }}>
                                <Box sx={{ width: '100%', mr: 1 }}>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={goal.progress || 0} 
                                    color={goal.status === 'completed' ? 'success' : 'primary'}
                                    sx={{ height: 10, borderRadius: 5 }}
                                  />
                                </Box>
                                <Box sx={{ minWidth: 35 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    {goal.progress || 0}%
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <CalendarIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 'small' }} />
                                <Box>
                                  <Typography variant="body2">
                                    {new Date(goal.deadline).toLocaleDateString()}
                                  </Typography>
                                  {goal.frequency !== 'custom' && (
                                    <Typography variant="caption" color="text.secondary">
                                      ({goal.frequency})
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={goal.status.charAt(0).toUpperCase() + goal.status.slice(1)} 
                                color={getGoalStatusColor(goal.status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Tooltip title="Edit Goal">
                                <IconButton 
                                  color="primary" 
                                  onClick={() => handleEditGoal(goal._id)}
                                  size="small"
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Goal">
                                <IconButton 
                                  color="error" 
                                  onClick={() => openDeleteDialog(goal._id)}
                                  size="small"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Delete Goal?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this goal? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteGoal} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TrainerGoalManagement; 