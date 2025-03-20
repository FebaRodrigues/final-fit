import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getWorkoutLogs, getWorkoutStats, deleteWorkoutLog, getLibraryWorkoutPrograms } from '../../api';
import WorkoutStats from './WorkoutStats';
import WorkoutList from './WorkoutList';
import { toast } from 'react-toastify';

// Predefined workout categories
const WORKOUT_CATEGORIES = [
  { id: 'strength', name: 'Strength Training', icon: '🏋️', description: 'Build muscle and strength with weights' },
  { id: 'cardio', name: 'Cardio', icon: '🏃', description: 'Improve heart health and endurance' },
  { id: 'flexibility', name: 'Flexibility & Yoga', icon: '🧘', description: 'Enhance flexibility and mindfulness' },
  { id: 'hiit', name: 'HIIT & Circuits', icon: '⏱️', description: 'High intensity interval training' },
  { id: 'custom', name: 'Custom Workouts', icon: '✨', description: 'Create your own custom workout routines' }
];

// Predefined workout templates
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
      { name: 'Running', duration: 15 },
      { name: 'Cycling', duration: 15 },
      { name: 'Jump Rope', duration: 10 }
    ],
    description: 'High-energy cardio workout to burn calories'
  },
  { 
    id: 'yoga-flow', 
    name: 'Yoga Flow', 
    category: 'flexibility',
    exercises: [
      { name: 'Downward Dog', duration: 60 },
      { name: 'Warrior Pose', duration: 60 },
      { name: 'Child\'s Pose', duration: 60 }
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
    id: 'upper-body-strength', 
    name: 'Upper Body Strength', 
    category: 'strength',
    exercises: [
      { name: 'Pull-Up', sets: 3, reps: 8 },
      { name: 'Dumbbell Press', sets: 3, reps: 12 },
      { name: 'Bicep Curl', sets: 3, reps: 12 },
      { name: 'Tricep Extension', sets: 3, reps: 12 },
      { name: 'Lateral Raise', sets: 3, reps: 15 }
    ],
    description: 'Focus on upper body strength and muscle development'
  },
  { 
    id: 'lower-body-strength', 
    name: 'Lower Body Strength', 
    category: 'strength',
    exercises: [
      { name: 'Squat', sets: 4, reps: 10 },
      { name: 'Lunges', sets: 3, reps: 12 },
      { name: 'Leg Press', sets: 3, reps: 12 },
      { name: 'Calf Raise', sets: 3, reps: 15 },
      { name: 'Leg Extension', sets: 3, reps: 12 }
    ],
    description: 'Focus on lower body strength and muscle development'
  },
  { 
    id: 'full-body-hiit', 
    name: 'Full Body HIIT', 
    category: 'hiit',
    exercises: [
      { name: 'Burpees', sets: 3, reps: 15 },
      { name: 'Push-up to Row', sets: 3, reps: 12 },
      { name: 'Kettlebell Swings', sets: 3, reps: 15 },
      { name: 'Squat Thrusts', sets: 3, reps: 15 },
      { name: 'Mountain Climbers', sets: 3, reps: 20 }
    ],
    description: 'Full body high-intensity interval training for maximum results'
  },
  { 
    id: 'endurance-cardio', 
    name: 'Endurance Cardio', 
    category: 'cardio',
    exercises: [
      { name: 'Running', duration: 30, distance: 5 },
      { name: 'Cycling', duration: 20, distance: 8 },
      { name: 'Rowing', duration: 15 }
    ],
    description: 'Build cardiovascular endurance with longer duration exercises'
  }
];

const WorkoutDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [period, setPeriod] = useState('month');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [workoutStats, setWorkoutStats] = useState(null);
  const [libraryPrograms, setLibraryPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch workout logs and stats
  useEffect(() => {
    const fetchWorkoutData = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        // Fetch workout logs
        const logsResponse = await getWorkoutLogs(user.id, {
          limit: 10,
          sortBy: 'date',
          sortOrder: 'desc'
        });
        
        // Fetch workout stats
        const statsResponse = await getWorkoutStats(user.id, period);
        
        // Fetch library workout programs
        const programsResponse = await getLibraryWorkoutPrograms();
        
        setWorkoutLogs(logsResponse.data.logs || []);
        setWorkoutStats(statsResponse.data || null);
        setLibraryPrograms(programsResponse.data || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching workout data:', err);
        setError('Failed to load workout data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchWorkoutData();
  }, [user?.id, period]);
  
  const handleDeleteWorkout = async (logId) => {
    if (window.confirm('Are you sure you want to delete this workout log?')) {
      try {
        await deleteWorkoutLog(logId);
        
        // Update the workout logs list
        setWorkoutLogs(prevLogs => prevLogs.filter(log => log._id !== logId));
        
        // Refresh stats after deletion
        const statsResponse = await getWorkoutStats(user.id, period);
        setWorkoutStats(statsResponse.data || null);
        
        toast.success('Workout log deleted successfully');
      } catch (err) {
        console.error('Error deleting workout log:', err);
        toast.error('Failed to delete workout log');
      }
    }
  };
  
  const handleStartTemplate = (template) => {
    navigate('/workouts/log', { state: { template } });
  };
  
  // Filter templates by category if one is selected
  const filteredTemplates = selectedCategory 
    ? [...WORKOUT_TEMPLATES.filter(template => template.category === selectedCategory),
       ...libraryPrograms.filter(program => program.category.toLowerCase() === selectedCategory)]
    : [...WORKOUT_TEMPLATES, ...libraryPrograms];
  
  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Workout Dashboard</h2>
        <div className="flex space-x-2">
          <Link
            to="/workouts/log"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Log New Workout
          </Link>
          <Link
            to="/workouts/programs"
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            My Programs
          </Link>
        </div>
      </div>
      
      {/* Workout Categories */}
      <div className="mb-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Workout Categories</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {WORKOUT_CATEGORIES.map(category => (
              <div 
                key={category.id}
                className={`cursor-pointer p-4 rounded-lg border-2 ${
                  selectedCategory === category.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
              >
                <div className="flex items-center mb-2">
                  <span className="text-3xl mr-2">{category.icon}</span>
                  <h4 className="text-lg font-semibold">{category.name}</h4>
                </div>
                <p className="text-gray-600 text-sm">{category.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Workout Templates */}
      <div className="mb-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">
              {selectedCategory 
                ? `${WORKOUT_CATEGORIES.find(c => c.id === selectedCategory)?.name} Workouts` 
                : 'Workout Templates'}
            </h3>
            {selectedCategory && (
              <button 
                onClick={() => setSelectedCategory(null)}
                className="text-blue-500 hover:text-blue-700 text-sm"
              >
                Show All
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredTemplates.map((template, index) => (
              <div 
                key={template.id || index}
                className="block p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => handleStartTemplate(template)}
              >
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">
                    {WORKOUT_CATEGORIES.find(c => c.id === (template.category?.toLowerCase() || template.category))?.icon}
                  </span>
                  <h4 className="font-semibold">{template.name || template.title}</h4>
                </div>
                <p className="text-gray-600 text-sm mb-2">{template.description}</p>
                <div className="text-xs text-gray-500">
                  {template.exercises?.length || 0} exercises
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Workout Statistics */}
      <div className="mb-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Workout Statistics</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setPeriod('week')}
                className={`px-3 py-1 rounded ${period === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Week
              </button>
              <button
                onClick={() => setPeriod('month')}
                className={`px-3 py-1 rounded ${period === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Month
              </button>
              <button
                onClick={() => setPeriod('year')}
                className={`px-3 py-1 rounded ${period === 'year' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Year
              </button>
              <button
                onClick={() => setPeriod('all')}
                className={`px-3 py-1 rounded ${period === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                All Time
              </button>
            </div>
          </div>
          
          {workoutStats ? (
            <WorkoutStats stats={workoutStats} />
          ) : (
            <p className="text-gray-500">No workout statistics available for this period.</p>
          )}
        </div>
      </div>
      
      {/* Recent Workouts */}
      <div className="mb-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Recent Workouts</h3>
            <Link
              to="/workouts/history"
              className="text-blue-500 hover:text-blue-700 text-sm"
            >
              View All
            </Link>
          </div>
          
          {workoutLogs && workoutLogs.length > 0 ? (
            <WorkoutList logs={workoutLogs} onDelete={handleDeleteWorkout} />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No workout logs found.</p>
              <Link
                to="/workouts/log"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Log Your First Workout
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkoutDashboard; 