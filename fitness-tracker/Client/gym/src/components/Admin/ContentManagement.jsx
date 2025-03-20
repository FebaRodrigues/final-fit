import React, { useState, useEffect } from 'react';
import { 
  getWorkoutProgramsAdmin,
  createWorkoutProgram,
  updateWorkoutProgram,
  deleteWorkoutProgram
} from '../../api';
import { FaEdit, FaTrash, FaEye, FaCheck, FaTimes, FaPlus } from 'react-icons/fa';
import "../../styles/AdminStyle.css";

const ContentManagement = () => {
  const [activeTab, setActiveTab] = useState('workouts');
  const [workoutPrograms, setWorkoutPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [workoutFormData, setWorkoutFormData] = useState({
    title: '',
    description: '',
    difficulty: 'Beginner',
    category: 'Strength',
    duration: 30,
    exercises: [{ name: '', sets: 3, reps: 10, rest: 60 }]
  });
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);

  useEffect(() => {
    fetchContent();
  }, [activeTab]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      if (activeTab === 'workouts') {
        const response = await getWorkoutProgramsAdmin();
        setWorkoutPrograms(response.data);
      }
    } catch (err) {
      setError(`Failed to fetch ${activeTab}: ` + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewWorkoutProgram = (program) => {
    setSelectedProgram(program);
    setEditMode(false);
  };

  const handleEditWorkoutProgram = (program) => {
    setEditMode(true);
    setSelectedProgram(program);
    setWorkoutFormData({
      title: program.title,
      description: program.description || '',
      difficulty: program.difficulty || 'Beginner',
      category: program.category || 'Strength',
      duration: program.duration || 30,
      exercises: program.exercises || [{ name: '', sets: 3, reps: 10, rest: 60 }]
    });
  };

  const handleUpdateWorkoutProgram = async (e) => {
    e.preventDefault();
    try {
      await updateWorkoutProgram(selectedProgram._id, workoutFormData);
      console.log('Workout program updated:', selectedProgram._id);
      
      // Refresh the workout programs list to ensure we have the latest data
      const refreshResponse = await getWorkoutProgramsAdmin();
      setWorkoutPrograms(refreshResponse.data);
      
      setEditMode(false);
      setSelectedProgram(null);
      alert('Workout program updated successfully!');
    } catch (err) {
      setError('Failed to update workout program: ' + err.message);
    }
  };

  const handleDeleteWorkoutProgram = async (programId) => {
    if (window.confirm('Are you sure you want to delete this workout program? This action cannot be undone.')) {
      try {
        await deleteWorkoutProgram(programId);
        console.log('Workout program deleted:', programId);
        
        // Refresh the workout programs list to ensure we have the latest data
        const refreshResponse = await getWorkoutProgramsAdmin();
        setWorkoutPrograms(refreshResponse.data);
        
        alert('Workout program deleted successfully!');
      } catch (err) {
        setError('Failed to delete workout program: ' + err.message);
      }
    }
  };

  const handleCreateWorkoutProgram = async (e) => {
    e.preventDefault();
    try {
      const response = await createWorkoutProgram(workoutFormData);
      console.log('Workout program created:', response.data);
      
      // Refresh the workout programs list to ensure we have the latest data
      const refreshResponse = await getWorkoutProgramsAdmin();
      setWorkoutPrograms(refreshResponse.data);
      
      setShowWorkoutForm(false);
      setWorkoutFormData({
        title: '',
        description: '',
        difficulty: 'Beginner',
        category: 'Strength',
        duration: 30,
        exercises: [{ name: '', sets: 3, reps: 10, rest: 60 }]
      });
      alert('Workout program created successfully!');
    } catch (err) {
      setError('Failed to create workout program: ' + err.message);
    }
  };

  const handleExerciseChange = (index, field, value) => {
    const updatedExercises = [...workoutFormData.exercises];
    updatedExercises[index][field] = value;
    setWorkoutFormData({ ...workoutFormData, exercises: updatedExercises });
  };

  const handleAddExercise = () => {
    setWorkoutFormData({
      ...workoutFormData,
      exercises: [...workoutFormData.exercises, { name: '', sets: 3, reps: 10, rest: 60 }]
    });
  };

  const handleRemoveExercise = (index) => {
    if (workoutFormData.exercises.length > 1) {
      const updatedExercises = [...workoutFormData.exercises];
      updatedExercises.splice(index, 1);
      setWorkoutFormData({ ...workoutFormData, exercises: updatedExercises });
    }
  };

  if (loading) return <div className="loading">Loading content...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-content">
      <div className="content-management-container">
        <h2>Content Management</h2>
        
        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'workouts' ? 'active' : ''}`}
            onClick={() => setActiveTab('workouts')}
          >
            Workout Programs
          </button>
        </div>
        
        {/* Error Message */}
        {error && <div className="error-message">{error}</div>}
        
        {/* Content based on active tab */}
        <div className="tab-content">
          {/* Workout Programs Tab */}
          {activeTab === 'workouts' && (
            <div>
              <h3>Workout Programs ({workoutPrograms.length})</h3>
              <button 
                className="create-button"
                onClick={() => {
                  setShowWorkoutForm(true);
                  setEditMode(false);
                  setSelectedProgram(null);
                  setWorkoutFormData({
                    title: '',
                    description: '',
                    difficulty: 'Beginner',
                    category: 'Strength',
                    duration: 30,
                    exercises: [{ name: '', sets: 3, reps: 10, rest: 60 }]
                  });
                }}
              >
                <FaPlus /> Create New Workout Program
              </button>
              
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Difficulty</th>
                    <th>Duration</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workoutPrograms.map(program => (
                    <tr key={program._id}>
                      <td>{program.title}</td>
                      <td>{program.category}</td>
                      <td>{program.difficulty}</td>
                      <td>{program.duration} min</td>
                      <td className="action-buttons">
                        <button 
                          onClick={() => handleViewWorkoutProgram(program)}
                          className="icon-button"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        <button 
                          onClick={() => handleEditWorkoutProgram(program)}
                          className="icon-button"
                          title="Edit Program"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          onClick={() => handleDeleteWorkoutProgram(program._id)}
                          className="icon-button delete"
                          title="Delete Program"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Workout Program Details View */}
          {selectedProgram && !editMode && !showWorkoutForm && (
            <div className="program-details">
              <h3>Workout Program Details</h3>
              <div className="details-container">
                <div className="detail-item">
                  <strong>Title:</strong> {selectedProgram.title}
                </div>
                <div className="detail-item">
                  <strong>Description:</strong> {selectedProgram.description}
                </div>
                <div className="detail-item">
                  <strong>Category:</strong> {selectedProgram.category}
                </div>
                <div className="detail-item">
                  <strong>Difficulty:</strong> {selectedProgram.difficulty}
                </div>
                <div className="detail-item">
                  <strong>Duration:</strong> {selectedProgram.duration} minutes
                </div>
                <div className="detail-item">
                  <strong>Exercises:</strong>
                  <ul className="exercises-list">
                    {selectedProgram.exercises.map((exercise, index) => (
                      <li key={index}>
                        <strong>{exercise.name}</strong> - {exercise.sets} sets x {exercise.reps} reps ({exercise.rest}s rest)
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <button 
                onClick={() => setSelectedProgram(null)}
                className="secondary-button"
              >
                Close
              </button>
            </div>
          )}
          
          {/* Workout Program Form */}
          {showWorkoutForm && (
            <div className="program-form">
              <h3>{editMode ? 'Edit Workout Program' : 'Create Workout Program'}</h3>
              <form onSubmit={editMode ? handleUpdateWorkoutProgram : handleCreateWorkoutProgram}>
                <div className="form-group">
                  <label>Title:</label>
                  <input
                    type="text"
                    value={workoutFormData.title}
                    onChange={(e) => setWorkoutFormData({...workoutFormData, title: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description:</label>
                  <textarea
                    value={workoutFormData.description}
                    onChange={(e) => setWorkoutFormData({...workoutFormData, description: e.target.value})}
                    required
                    rows={4}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Category:</label>
                    <select
                      value={workoutFormData.category}
                      onChange={(e) => setWorkoutFormData({...workoutFormData, category: e.target.value})}
                    >
                      <option value="Strength">Strength</option>
                      <option value="Cardio">Cardio</option>
                      <option value="Flexibility">Flexibility</option>
                      <option value="HIIT">HIIT</option>
                      <option value="Full Body">Full Body</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Difficulty:</label>
                    <select
                      value={workoutFormData.difficulty}
                      onChange={(e) => setWorkoutFormData({...workoutFormData, difficulty: e.target.value})}
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Duration (minutes):</label>
                    <input
                      type="number"
                      value={workoutFormData.duration}
                      onChange={(e) => setWorkoutFormData({...workoutFormData, duration: parseInt(e.target.value)})}
                      min="1"
                      required
                    />
                  </div>
                </div>
                
                <h4>Exercises</h4>
                {workoutFormData.exercises.map((exercise, index) => (
                  <div key={index} className="exercise-form">
                    <div className="form-row">
                      <div className="form-group exercise-name">
                        <label>Exercise Name:</label>
                        <input
                          type="text"
                          value={exercise.name}
                          onChange={(e) => handleExerciseChange(index, 'name', e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Sets:</label>
                        <input
                          type="number"
                          value={exercise.sets}
                          onChange={(e) => handleExerciseChange(index, 'sets', parseInt(e.target.value))}
                          min="1"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Reps:</label>
                        <input
                          type="number"
                          value={exercise.reps}
                          onChange={(e) => handleExerciseChange(index, 'reps', parseInt(e.target.value))}
                          min="1"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Rest (seconds):</label>
                        <input
                          type="number"
                          value={exercise.rest}
                          onChange={(e) => handleExerciseChange(index, 'rest', parseInt(e.target.value))}
                          min="0"
                          required
                        />
                      </div>
                      <button 
                        type="button" 
                        className="remove-button"
                        onClick={() => handleRemoveExercise(index)}
                        disabled={workoutFormData.exercises.length <= 1}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                
                <button 
                  type="button" 
                  className="add-button"
                  onClick={handleAddExercise}
                >
                  Add Exercise
                </button>
                
                <div className="form-buttons">
                  <button type="submit" className="primary-button">
                    {editMode ? 'Update Program' : 'Create Program'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowWorkoutForm(false);
                      setEditMode(false);
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
    </div>
  );
};

export default ContentManagement; 