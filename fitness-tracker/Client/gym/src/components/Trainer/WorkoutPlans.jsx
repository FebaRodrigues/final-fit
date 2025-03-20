// src/components/Trainer/WorkoutPlans.jsx
import React, { useState, useEffect } from 'react';
import API from '../../api';
import { useAuth } from '../../context/AuthContext';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Card, 
  CardContent, 
  CardHeader, 
  CardActions,
  TextField, 
  Button, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  FormHelperText,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  FitnessCenter as FitnessCenterIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  DirectionsRun as RunIcon
} from '@mui/icons-material';
import '../../styles/WorkoutPlans.css';

const WorkoutPlans = () => {
  const { trainer } = useAuth();
  const [workoutPrograms, setWorkoutPrograms] = useState([]);
  const [newProgram, setNewProgram] = useState({
    title: '',
    description: '',
    category: 'Strength',
    exercises: [{ name: '', sets: '', reps: '', duration: '' }],
  });
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const trainerId = trainer.id || trainer._id;
        // Fetch trainer's workout programs
        const programsResponse = await API.get(`/workout-programs/${trainerId}`);
        setWorkoutPrograms(programsResponse.data);

        // Fetch trainer's clients
        const clientsResponse = await API.get(`/trainers/${trainerId}/clients`);
        setClients(clientsResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load workout plans. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    if (trainer && (trainer.id || trainer._id)) {
      fetchData();
    }
  }, [trainer]);

  const handleProgramChange = (e, index) => {
    const { name, value } = e.target;
    if (name === 'title' || name === 'description' || name === 'category') {
      setNewProgram({ ...newProgram, [name]: value });
    } else {
      const updatedExercises = [...newProgram.exercises];
      updatedExercises[index][name] = value;
      setNewProgram({ ...newProgram, exercises: updatedExercises });
    }
    
    // Clear any form errors for the field
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };

  const addExercise = () => {
    setNewProgram({
      ...newProgram,
      exercises: [...newProgram.exercises, { name: '', sets: '', reps: '', duration: '' }],
    });
  };
  
  const removeExercise = (index) => {
    const updatedExercises = [...newProgram.exercises];
    updatedExercises.splice(index, 1);
    setNewProgram({ ...newProgram, exercises: updatedExercises });
  };

  const validateForm = () => {
    const errors = {};
    
    if (!newProgram.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!newProgram.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!newProgram.category) {
      errors.category = 'Category is required';
    }
    
    if (newProgram.exercises.length === 0) {
      errors.exercises = 'At least one exercise is required';
    }
    
    newProgram.exercises.forEach((exercise, index) => {
      if (!exercise.name.trim()) {
        errors[`exercise_${index}_name`] = 'Exercise name is required';
      }
      
      // For strength exercises, sets and reps are required
      if (newProgram.category === 'Strength' || newProgram.category === 'Endurance') {
        if (!exercise.sets || exercise.sets <= 0) {
          errors[`exercise_${index}_sets`] = 'Valid number of sets is required';
        }
        if (!exercise.reps || exercise.reps <= 0) {
          errors[`exercise_${index}_reps`] = 'Valid number of reps is required';
        }
      }
      
      // For cardio exercises, duration is required
      if (newProgram.category === 'Cardio' || newProgram.category === 'Flexibility') {
        if (!exercise.duration || exercise.duration <= 0) {
          errors[`exercise_${index}_duration`] = 'Valid duration is required';
        }
      }
      
      // For HIIT exercises, both sets/reps and duration are required
      if (newProgram.category === 'HIIT') {
        if (!exercise.sets || exercise.sets <= 0) {
          errors[`exercise_${index}_sets`] = 'Valid number of sets is required';
        }
        if (!exercise.reps || exercise.reps <= 0) {
          errors[`exercise_${index}_reps`] = 'Valid number of reps is required';
        }
        if (!exercise.duration || exercise.duration <= 0) {
          errors[`exercise_${index}_duration`] = 'Valid duration is required';
        }
      }
    });
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateProgram = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      const trainerId = trainer.id || trainer._id;
      const programData = {
        ...newProgram,
        trainerId
      };
      
      const response = await API.post('/workout-programs', programData);
      
      if (selectedClient) {
        await API.post('/workout-programs/assign', {
          programId: response.data.program._id,
          userId: selectedClient,
        });
      }
      
      setWorkoutPrograms([...workoutPrograms, response.data.program]);
      setNewProgram({
        title: '',
        description: '',
        category: 'Strength',
        exercises: [{ name: '', sets: '', reps: '', duration: '' }],
      });
      setSelectedClient('');
      setSuccess('Workout program created successfully!');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (error) {
      console.error('Error creating workout program:', error);
      setError('Failed to create workout program. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category) => {
    switch(category) {
      case 'Strength': return 'primary';
      case 'Cardio': return 'secondary';
      case 'Flexibility': return 'success';
      case 'Endurance': return 'warning';
      default: return 'default';
    }
  };

  if (loading && workoutPrograms.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="workout-plans" sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Workout Plans
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Existing Workout Plans */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Your Created Plans
            </Typography>
            
            {workoutPrograms.length > 0 ? (
              <List className="workout-program-list">
                {workoutPrograms.map((program) => (
                  <Accordion key={program._id} className="workout-program-item">
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls={`panel-${program._id}-content`}
                      id={`panel-${program._id}-header`}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <FitnessCenterIcon sx={{ mr: 2, color: 'primary.main' }} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {program.title}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <Chip 
                              label={program.category} 
                              size="small" 
                              color={getCategoryColor(program.category)} 
                              sx={{ mr: 1 }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {program.exercises.length} exercises
                            </Typography>
                          </Box>
                        </Box>
                        {program.userId && (
                          <Tooltip title="Assigned to client">
                            <Chip 
                              icon={<PersonIcon />} 
                              label="Assigned" 
                              variant="outlined" 
                              size="small" 
                              color="info"
                            />
                          </Tooltip>
                        )}
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {program.description}
                      </Typography>
                      
                      <Typography variant="subtitle2" gutterBottom>
                        Exercises:
                      </Typography>
                      
                      <List dense>
                        {program.exercises.map((exercise, index) => (
                          <ListItem key={index}>
                            <ListItemText 
                              primary={exercise.name} 
                              secondary={
                                <>
                                  {exercise.sets && `${exercise.sets} sets`}
                                  {exercise.sets && exercise.reps && ' x '}
                                  {exercise.reps && `${exercise.reps} reps`}
                                  {exercise.duration && `${exercise.duration} min`}
                                </>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                      
                      {program.userId && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Assigned to:</strong> {
                              clients.find(client => client._id === program.userId)?.name || 'Client'
                            }
                          </Typography>
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <FitnessCenterIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="textSecondary">
                  No workout plans created yet.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Create New Workout Plan */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Create New Workout Plan
            </Typography>
            
            <form onSubmit={handleCreateProgram}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Program Title"
                    name="title"
                    value={newProgram.title}
                    onChange={handleProgramChange}
                    required
                    error={!!formErrors.title}
                    helperText={formErrors.title}
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    value={newProgram.description}
                    onChange={handleProgramChange}
                    multiline
                    rows={3}
                    required
                    error={!!formErrors.description}
                    helperText={formErrors.description}
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="category-label">Category</InputLabel>
                    <Select
                      labelId="category-label"
                      name="category"
                      value={newProgram.category}
                      onChange={handleProgramChange}
                      label="Category"
                    >
                      <MenuItem value="Strength">Strength</MenuItem>
                      <MenuItem value="Cardio">Cardio</MenuItem>
                      <MenuItem value="Flexibility">Flexibility</MenuItem>
                      <MenuItem value="Endurance">Endurance</MenuItem>
                    </Select>
                    <FormHelperText>
                      {newProgram.category === 'Strength' || newProgram.category === 'Endurance' 
                        ? 'For strength exercises, specify sets and reps' 
                        : 'For cardio/flexibility exercises, specify duration'}
                    </FormHelperText>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Exercises
                  </Typography>
                  
                  {newProgram.exercises.map((exercise, index) => (
                    <Card key={index} variant="outlined" sx={{ mb: 2, p: 2 }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Exercise Name"
                            name="name"
                            value={exercise.name}
                            onChange={(e) => handleProgramChange(e, index)}
                            required
                            error={!!formErrors[`exercise_${index}_name`]}
                            helperText={formErrors[`exercise_${index}_name`]}
                            variant="outlined"
                          />
                        </Grid>
                        
                        {(newProgram.category === 'Strength' || newProgram.category === 'Endurance') && (
                          <>
                            <Grid item xs={6}>
                              <TextField
                                fullWidth
                                label="Sets"
                                name="sets"
                                type="number"
                                value={exercise.sets}
                                onChange={(e) => handleProgramChange(e, index)}
                                required
                                error={!!formErrors[`exercise_${index}_sets`]}
                                helperText={formErrors[`exercise_${index}_sets`]}
                                variant="outlined"
                                InputProps={{ inputProps: { min: 1 } }}
                              />
                            </Grid>
                            
                            <Grid item xs={6}>
                              <TextField
                                fullWidth
                                label="Reps"
                                name="reps"
                                type="number"
                                value={exercise.reps}
                                onChange={(e) => handleProgramChange(e, index)}
                                required
                                error={!!formErrors[`exercise_${index}_reps`]}
                                helperText={formErrors[`exercise_${index}_reps`]}
                                variant="outlined"
                                InputProps={{ inputProps: { min: 1 } }}
                              />
                            </Grid>
                          </>
                        )}
                        
                        {(newProgram.category === 'Cardio' || newProgram.category === 'Flexibility') && (
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Duration (minutes)"
                              name="duration"
                              type="number"
                              value={exercise.duration}
                              onChange={(e) => handleProgramChange(e, index)}
                              required
                              error={!!formErrors[`exercise_${index}_duration`]}
                              helperText={formErrors[`exercise_${index}_duration`]}
                              variant="outlined"
                              InputProps={{ inputProps: { min: 1 } }}
                            />
                          </Grid>
                        )}
                        
                        {index > 0 && (
                          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                              variant="outlined"
                              color="error"
                              startIcon={<DeleteIcon />}
                              onClick={() => removeExercise(index)}
                              size="small"
                            >
                              Remove
                            </Button>
                          </Grid>
                        )}
                      </Grid>
                    </Card>
                  ))}
                  
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={addExercise}
                    fullWidth
                    sx={{ mb: 3 }}
                  >
                    Add Exercise
                  </Button>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="client-label">Assign to Client (Optional)</InputLabel>
                    <Select
                      labelId="client-label"
                      value={selectedClient}
                      onChange={(e) => setSelectedClient(e.target.value)}
                      label="Assign to Client (Optional)"
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {clients.map((client) => (
                        <MenuItem key={client._id} value={client._id}>
                          {client.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    startIcon={<AssignmentIcon />}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Create Workout Plan'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default WorkoutPlans;