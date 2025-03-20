import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createWorkoutLog, getWorkoutLogById, updateWorkoutLog } from '../../api';
import { toast } from 'react-toastify';

// Predefined workout categories
const WORKOUT_CATEGORIES = [
  { id: 'strength', name: 'Strength Training', icon: '🏋️' },
  { id: 'cardio', name: 'Cardio', icon: '🏃' },
  { id: 'flexibility', name: 'Flexibility & Yoga', icon: '🧘' },
  { id: 'hiit', name: 'HIIT & Circuits', icon: '⏱️' },
  { id: 'custom', name: 'Custom Workout', icon: '✨' }
];

// Predefined exercises by category
const EXERCISES_BY_CATEGORY = {
  strength: [
    'Bench Press', 'Squat', 'Deadlift', 'Shoulder Press', 'Pull-Up', 
    'Barbell Row', 'Leg Press', 'Bicep Curl', 'Tricep Extension', 'Lat Pulldown',
    'Dumbbell Press', 'Lunges', 'Leg Extension', 'Leg Curl', 'Calf Raise',
    'Face Pull', 'Dips', 'Push-Up', 'Chest Fly', 'Lateral Raise'
  ],
  cardio: [
    'Running', 'Cycling', 'Swimming', 'Elliptical', 'Rowing', 
    'Stair Climber', 'Jump Rope', 'Hiking', 'Walking', 'Dancing',
    'Treadmill', 'Stationary Bike', 'Cross Trainer', 'Jogging', 'Sprinting',
    'Boxing', 'Kickboxing', 'Aerobics', 'Zumba', 'Circuit Training'
  ],
  flexibility: [
    'Downward Dog', 'Warrior Pose', 'Child\'s Pose', 'Cobra Pose', 'Triangle Pose',
    'Hamstring Stretch', 'Quad Stretch', 'Hip Flexor Stretch', 'Shoulder Stretch', 'Cat-Cow Stretch',
    'Forward Fold', 'Pigeon Pose', 'Bridge Pose', 'Butterfly Stretch', 'Seated Twist',
    'Standing Side Bend', 'Neck Stretch', 'Wrist Stretch', 'Ankle Rotation', 'Calf Stretch'
  ],
  hiit: [
    'Burpees', 'Mountain Climbers', 'Jump Squats', 'High Knees', 'Jumping Jacks',
    'Box Jumps', 'Kettlebell Swings', 'Battle Ropes', 'Plank Jacks', 'Sprints',
    'Squat Thrusts', 'Lunge Jumps', 'Push-up to Row', 'Tuck Jumps', 'Medicine Ball Slams',
    'Speed Skaters', 'Lateral Bounds', 'Plank to Push-up', 'Bicycle Crunches', 'Russian Twists'
  ],
  custom: []
};

// Import the workout templates from the dashboard
const WORKOUT_TEMPLATES = [
  { 
    id: 'beginner-strength', 
    name: 'Beginner Strength', 
    category: 'strength',
    exercises: [
      { name: 'Bench Press', sets: 3, reps: 10 },
      { name: 'Squat', sets: 3, reps: 10 },
      { name: 'Deadlift', sets: 3, reps: 8 },
      { name: 'Shoulder Press', sets: 3, reps: 10 }
    ],
    description: 'Perfect for beginners to build foundational strength'
  },
  { 
    id: 'cardio-blast', 
    name: 'Cardio Blast', 
    category: 'cardio',
    exercises: [
      { name: 'Running', duration: 20, distance: 3, unit: 'km' },
      { name: 'Cycling', duration: 15, distance: 5, unit: 'km' },
      { name: 'Jump Rope', duration: 10 }
    ],
    description: 'High-energy cardio workout to burn calories'
  },
  { 
    id: 'yoga-flow', 
    name: 'Yoga Flow', 
    category: 'flexibility',
    exercises: [
      { name: 'Downward Dog', duration: 5 },
      { name: 'Warrior Pose', duration: 5 },
      { name: 'Child\'s Pose', duration: 5 }
    ],
    description: 'Flowing yoga sequence for flexibility and relaxation'
  },
  { 
    id: 'hiit-circuit', 
    name: 'HIIT Circuit', 
    category: 'hiit',
    exercises: [
      { name: 'Burpees', sets: 3, reps: 15 },
      { name: 'Mountain Climbers', sets: 3, reps: 20 },
      { name: 'Jump Squats', sets: 3, reps: 15 },
      { name: 'High Knees', sets: 3, reps: 30 }
    ],
    description: 'Intense circuit training to maximize calorie burn'
  },
  { 
    id: 'hiit-cardio', 
    name: 'HIIT Cardio Blast', 
    category: 'hiit',
    exercises: [
      { name: 'Burpees', sets: 3, reps: 15 },
      { name: 'Mountain Climbers', sets: 3, reps: 20 },
      { name: 'Jump Squats', sets: 3, reps: 15 },
      { name: 'High Knees', sets: 3, reps: 30 },
      { name: 'Jumping Jacks', sets: 3, reps: 30 }
    ],
    description: 'High-intensity interval training to burn calories and improve cardiovascular fitness'
  },
  { 
    id: 'yoga-flow', 
    name: 'Yoga Flow', 
    category: 'flexibility',
    exercises: [
      { name: 'Downward Dog', duration: 60 },
      { name: 'Warrior Pose', duration: 60 },
      { name: 'Triangle Pose', duration: 60 },
      { name: 'Child\'s Pose', duration: 60 },
      { name: 'Cobra Pose', duration: 60 }
    ],
    description: 'Improve flexibility and mindfulness with this yoga flow sequence'
  },
  { 
    id: 'cardio-endurance', 
    name: 'Cardio Endurance', 
    category: 'cardio',
    exercises: [
      { name: 'Running', duration: 20, distance: 3 },
      { name: 'Cycling', duration: 15, distance: 5 },
      { name: 'Rowing', duration: 10 },
      { name: 'Jump Rope', duration: 5 }
    ],
    description: 'Build cardiovascular endurance with this mixed cardio workout'
  }
];

const WorkoutForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isEditing = !!id;
  
  // State for form data
  const [formData, setFormData] = useState({
    title: '',
    workoutType: 'strength',
    exercises: [],
    duration: 0,
    caloriesBurned: 0,
    feelingRating: 3,
    notes: '',
    location: 'gym',
    isCustomWorkout: false,
    completionStatus: 'completed'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  
  // Load workout data if editing
  useEffect(() => {
    if (isEditing) {
      const fetchWorkout = async () => {
        try {
          setLoading(true);
          const response = await getWorkoutLogById(id);
          
          // Format the data for the form
          setFormData({
            title: response.data.title || '',
            workoutType: response.data.workoutType || 'strength',
            exercises: response.data.exercises || [],
            duration: response.data.duration || 0,
            caloriesBurned: response.data.caloriesBurned || 0,
            feelingRating: response.data.feelingRating || 3,
            notes: response.data.notes || '',
            location: response.data.location || 'gym',
            isCustomWorkout: response.data.isCustomWorkout || false,
            completionStatus: response.data.completionStatus || 'completed'
          });
          
          setLoading(false);
        } catch (err) {
          setError('Failed to load workout data');
          setLoading(false);
          console.error(err);
        }
      };
      
      fetchWorkout();
    } else if (location.state?.template) {
      // If a template was passed from another page
      const template = location.state.template;
      applyTemplate(template);
    }
  }, [id, isEditing, location.state]);
  
  // Apply a workout template
  const applyTemplate = (template) => {
    setSelectedTemplate(template);
    
    // Map template exercises to form format
    const mappedExercises = template.exercises.map(ex => ({
      name: ex.name,
      category: template.category,
      setsCompleted: ex.sets || 0,
      repsCompleted: ex.reps || 0,
      weight: ex.weight || 0,
      duration: ex.duration || 0,
      distance: ex.distance || 0,
      caloriesBurned: ex.caloriesBurned || 0,
      notes: '',
      difficulty: 5,
      restTime: ex.restTime || 60,
      personalRecord: false
    }));
    
    setFormData({
      ...formData,
      title: template.name,
      workoutType: template.category,
      exercises: mappedExercises,
      isCustomWorkout: false
    });
    
    setShowTemplates(false);
  };
  
  // Add a new exercise to the workout
  const addExercise = () => {
    const newExercise = {
      name: EXERCISES_BY_CATEGORY[formData.workoutType][0] || '',
      category: formData.workoutType,
      setsCompleted: formData.workoutType === 'strength' || formData.workoutType === 'hiit' ? 3 : 0,
      repsCompleted: formData.workoutType === 'strength' || formData.workoutType === 'hiit' ? 10 : 0,
      weight: formData.workoutType === 'strength' ? 0 : 0,
      duration: formData.workoutType === 'cardio' || formData.workoutType === 'flexibility' ? 10 : 0,
      distance: formData.workoutType === 'cardio' ? 0 : 0,
      caloriesBurned: 0,
      notes: '',
      difficulty: 5,
      restTime: 60,
      personalRecord: false
    };
    
    setFormData({
      ...formData,
      exercises: [...formData.exercises, newExercise]
    });
  };
  
  // Remove an exercise from the workout
  const removeExercise = (index) => {
    const updatedExercises = [...formData.exercises];
    updatedExercises.splice(index, 1);
    
    setFormData({
      ...formData,
      exercises: updatedExercises
    });
  };
  
  // Update an exercise's data
  const updateExercise = (index, field, value) => {
    const updatedExercises = [...formData.exercises];
    updatedExercises[index][field] = value;
    
    // Auto-calculate calories if possible
    if ((field === 'duration' || field === 'weight' || field === 'repsCompleted') && 
        updatedExercises[index].category === 'strength') {
      // Simple formula for strength training: weight * reps * 0.1
      const weight = updatedExercises[index].weight || 0;
      const reps = updatedExercises[index].repsCompleted || 0;
      const sets = updatedExercises[index].setsCompleted || 0;
      
      if (weight > 0 && reps > 0 && sets > 0) {
        updatedExercises[index].caloriesBurned = Math.round(weight * reps * sets * 0.1);
      }
    } else if (field === 'duration' && updatedExercises[index].category === 'cardio') {
      // Simple formula for cardio: duration * 10 (calories per minute)
      const duration = updatedExercises[index].duration || 0;
      
      if (duration > 0) {
        updatedExercises[index].caloriesBurned = Math.round(duration * 10);
      }
    }
    
    // Calculate total calories burned
    const totalCalories = updatedExercises.reduce(
      (sum, ex) => sum + (ex.caloriesBurned || 0), 0
    );
    
    setFormData({
      ...formData,
      exercises: updatedExercises,
      caloriesBurned: totalCalories
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.exercises.length === 0) {
      toast.error('Please add at least one exercise to your workout');
      return;
    }
    
    try {
      setLoading(true);
      
      const workoutData = {
        userId: user.id,
        ...formData
      };
      
      let response;
      
      if (isEditing) {
        response = await updateWorkoutLog(id, workoutData);
        toast.success('Workout updated successfully!');
      } else {
        response = await createWorkoutLog(workoutData);
        toast.success('Workout logged successfully!');
      }
      
      setLoading(false);
      navigate('/workouts');
    } catch (err) {
      setError('Failed to save workout');
      setLoading(false);
      toast.error('Error saving workout: ' + (err.response?.data?.error || err.message));
      console.error(err);
    }
  };
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'workoutType') {
      // Reset exercises when changing workout type
      setFormData({
        ...formData,
        [name]: value,
        exercises: []
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // Calculate total duration
  const calculateTotalDuration = () => {
    return formData.exercises.reduce((total, ex) => {
      return total + (ex.duration || 0);
    }, 0);
  };
  
  // Update total duration when exercises change
  useEffect(() => {
    const totalDuration = calculateTotalDuration();
    if (totalDuration > 0) {
      setFormData(prev => ({
        ...prev,
        duration: totalDuration
      }));
    }
  }, [formData.exercises]);
  
  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }
  
  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">
        {isEditing ? 'Edit Workout' : 'Log New Workout'}
      </h2>
      
      {/* Workout Type Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Workout Type</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {WORKOUT_CATEGORIES.map(category => (
            <button
              key={category.id}
              type="button"
              className={`p-4 rounded-lg flex flex-col items-center justify-center transition-all ${
                formData.workoutType === category.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              onClick={() => handleChange({ target: { name: 'workoutType', value: category.id } })}
            >
              <span className="text-2xl mb-2">{category.icon}</span>
              <span className="text-sm font-medium">{category.name}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Workout Templates */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">Workout Details</h3>
          <button
            type="button"
            className="text-blue-500 hover:text-blue-700"
            onClick={() => setShowTemplates(!showTemplates)}
          >
            {showTemplates ? 'Hide Templates' : 'Use Template'}
          </button>
        </div>
        
        {showTemplates && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h4 className="font-medium mb-2">Select a Template</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {WORKOUT_TEMPLATES.filter(t => t.category === formData.workoutType).map(template => (
                <button
                  key={template.id}
                  type="button"
                  className="p-3 border rounded-lg text-left hover:bg-gray-100"
                  onClick={() => applyTemplate(template)}
                >
                  <div className="font-medium">{template.name}</div>
                  <div className="text-sm text-gray-500">
                    {template.exercises.length} exercises
                  </div>
                </button>
              ))}
              {WORKOUT_TEMPLATES.filter(t => t.category === formData.workoutType).length === 0 && (
                <p className="text-gray-500">No templates available for this workout type</p>
              )}
            </div>
          </div>
        )}
        
        {/* Workout Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Workout Title
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            placeholder="e.g., Morning Strength Training"
            required
          />
        </div>
      </div>
      
      {/* Exercises */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">Exercises</h3>
          <button
            type="button"
            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
            onClick={addExercise}
          >
            Add Exercise
          </button>
        </div>
        
        {formData.exercises.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No exercises added yet. Add an exercise or select a template.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {formData.exercises.map((exercise, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Exercise {index + 1}</h4>
                  <button
                    type="button"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => removeExercise(index)}
                  >
                    Remove
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Exercise Name */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Exercise Name
                    </label>
                    <select
                      value={exercise.name}
                      onChange={(e) => updateExercise(index, 'name', e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      {EXERCISES_BY_CATEGORY[formData.workoutType].map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                      <option value="custom">Custom...</option>
                    </select>
                    
                    {exercise.name === 'custom' && (
                      <input
                        type="text"
                        value={exercise.customName || ''}
                        onChange={(e) => updateExercise(index, 'customName', e.target.value)}
                        className="w-full p-2 border rounded mt-2"
                        placeholder="Enter custom exercise name"
                      />
                    )}
                  </div>
                  
                  {/* Sets & Reps for Strength & HIIT */}
                  {(formData.workoutType === 'strength' || formData.workoutType === 'hiit') && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Sets
                        </label>
                        <input
                          type="number"
                          value={exercise.setsCompleted}
                          onChange={(e) => updateExercise(index, 'setsCompleted', parseInt(e.target.value) || 0)}
                          className="w-full p-2 border rounded"
                          min="0"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Reps
                        </label>
                        <input
                          type="number"
                          value={exercise.repsCompleted}
                          onChange={(e) => updateExercise(index, 'repsCompleted', parseInt(e.target.value) || 0)}
                          className="w-full p-2 border rounded"
                          min="0"
                        />
                      </div>
                    </>
                  )}
                  
                  {/* Weight for Strength */}
                  {formData.workoutType === 'strength' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Weight (kg/lbs)
                      </label>
                      <input
                        type="number"
                        value={exercise.weight}
                        onChange={(e) => updateExercise(index, 'weight', parseFloat(e.target.value) || 0)}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  )}
                  
                  {/* Duration for Cardio & Flexibility */}
                  {(formData.workoutType === 'cardio' || formData.workoutType === 'flexibility') && (
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        value={exercise.duration}
                        onChange={(e) => updateExercise(index, 'duration', parseInt(e.target.value) || 0)}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  )}
                  
                  {/* Distance for Cardio */}
                  {formData.workoutType === 'cardio' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Distance (km/miles)
                      </label>
                      <input
                        type="number"
                        value={exercise.distance}
                        onChange={(e) => updateExercise(index, 'distance', parseFloat(e.target.value) || 0)}
                        className="w-full p-2 border rounded"
                        min="0"
                        step="0.1"
                      />
                    </div>
                  )}
                  
                  {/* Calories Burned */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Calories Burned
                    </label>
                    <input
                      type="number"
                      value={exercise.caloriesBurned}
                      onChange={(e) => updateExercise(index, 'caloriesBurned', parseInt(e.target.value) || 0)}
                      className="w-full p-2 border rounded"
                      min="0"
                    />
                  </div>
                  
                  {/* Personal Record Checkbox */}
                  {formData.workoutType === 'strength' && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`pr-${index}`}
                        checked={exercise.personalRecord}
                        onChange={(e) => updateExercise(index, 'personalRecord', e.target.checked)}
                        className="mr-2"
                      />
                      <label htmlFor={`pr-${index}`} className="text-sm font-medium">
                        Personal Record
                      </label>
                    </div>
                  )}
                  
                  {/* Notes */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      Notes
                    </label>
                    <textarea
                      value={exercise.notes}
                      onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                      className="w-full p-2 border rounded"
                      rows="2"
                      placeholder="Any notes about this exercise..."
                    ></textarea>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Workout Details */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Workout Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Total Duration */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Total Duration (minutes)
            </label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              min="0"
            />
          </div>
          
          {/* Total Calories */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Total Calories Burned
            </label>
            <input
              type="number"
              name="caloriesBurned"
              value={formData.caloriesBurned}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              min="0"
            />
          </div>
          
          {/* Location */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Location
            </label>
            <select
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="gym">Gym</option>
              <option value="home">Home</option>
              <option value="outdoors">Outdoors</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          {/* Feeling Rating */}
          <div>
            <label className="block text-sm font-medium mb-1">
              How did you feel?
            </label>
            <div className="flex space-x-3">
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  type="button"
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    formData.feelingRating === rating
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100'
                  }`}
                  onClick={() => handleChange({ target: { name: 'feelingRating', value: rating } })}
                >
                  {rating}
                </button>
              ))}
            </div>
          </div>
          
          {/* Completion Status */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Completion Status
            </label>
            <select
              name="completionStatus"
              value={formData.completionStatus}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="completed">Completed</option>
              <option value="partial">Partially Completed</option>
              <option value="planned">Planned</option>
            </select>
          </div>
          
          {/* Notes */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Workout Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              rows="3"
              placeholder="How was your workout? Any achievements or challenges?"
            ></textarea>
          </div>
        </div>
      </div>
      
      {/* Submit Button */}
      <div className="flex justify-between">
        <button
          type="button"
          className="px-4 py-2 border rounded hover:bg-gray-100"
          onClick={() => navigate('/workouts')}
        >
          Cancel
        </button>
        
        <button
          type="button"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Saving...' : isEditing ? 'Update Workout' : 'Log Workout'}
        </button>
      </div>
    </div>
  );
};

export default WorkoutForm; 