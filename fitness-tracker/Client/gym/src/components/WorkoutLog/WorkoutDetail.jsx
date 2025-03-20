import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getWorkoutLogById, deleteWorkoutLog } from '../../api';
import { toast } from 'react-toastify';

// Workout category icons
const CATEGORY_ICONS = {
  strength: '🏋️',
  cardio: '🏃',
  flexibility: '🧘',
  hiit: '⏱️',
  custom: '✨'
};

// Feeling rating emojis
const FEELING_EMOJIS = {
  1: '😫',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😁'
};

// Completion status badges
const STATUS_BADGES = {
  completed: { class: 'bg-green-100 text-green-700', text: 'Completed' },
  partial: { class: 'bg-yellow-100 text-yellow-700', text: 'Partial' },
  planned: { class: 'bg-blue-100 text-blue-700', text: 'Planned' }
};

const WorkoutDetail = () => {
  const { logId } = useParams();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchWorkoutLog = async () => {
      try {
        setLoading(true);
        const response = await getWorkoutLogById(logId);
        setWorkout(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching workout log:', err);
        setError('Failed to load workout details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkoutLog();
  }, [logId]);
  
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this workout log?')) {
      try {
        await deleteWorkoutLog(logId);
        toast.success('Workout log deleted successfully');
        navigate('/workouts');
      } catch (err) {
        console.error('Error deleting workout log:', err);
        toast.error('Failed to delete workout log');
      }
    }
  };
  
  // Format date to a more readable format
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Format time to a more readable format
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const options = { hour: 'numeric', minute: 'numeric' };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };
  
  // Format duration in hours and minutes
  const formatDuration = (minutes) => {
    if (!minutes) return '0 min';
    if (minutes < 60) return `${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) return `${hours} hr`;
    return `${hours} hr ${remainingMinutes} min`;
  };
  
  // Get category icon
  const getCategoryIcon = (category) => {
    return CATEGORY_ICONS[category] || '🏋️';
  };
  
  // Get feeling emoji
  const getFeelingEmoji = (rating) => {
    return FEELING_EMOJIS[rating] || '😐';
  };
  
  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (error || !workout) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error || 'Workout not found'}</span>
        </div>
        <div className="mt-4">
          <Link
            to="/workouts"
            className="text-blue-500 hover:text-blue-700"
          >
            &larr; Back to Workouts
          </Link>
        </div>
      </div>
    );
  }
  
  // Get status badge
  const statusBadge = STATUS_BADGES[workout.completionStatus || 'completed'];
  
  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <Link
          to="/workouts"
          className="text-blue-500 hover:text-blue-700"
        >
          &larr; Back to Workouts
        </Link>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
          <div className="flex items-center">
            <span className="text-4xl mr-3">{getCategoryIcon(workout.workoutType)}</span>
            <div>
              <div className="flex items-center">
                <h2 className="text-2xl font-bold">{workout.title}</h2>
                <span className={`ml-3 px-3 py-1 rounded-full text-sm ${statusBadge.class}`}>
                  {statusBadge.text}
                </span>
              </div>
              <p className="text-gray-500">{formatDate(workout.date)} at {formatTime(workout.date)}</p>
            </div>
          </div>
          
          <div className="flex space-x-2 mt-4 md:mt-0">
            <Link
              to={`/workouts/edit/${workout._id}`}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Edit
            </Link>
            
            <button
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Delete
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="stat-card bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-500 mb-1">Duration</h4>
            <p className="text-xl font-bold">{formatDuration(workout.duration)}</p>
          </div>
          
          <div className="stat-card bg-green-50 p-4 rounded-lg">
            <h4 className="text-sm font-semibold text-green-500 mb-1">Calories Burned</h4>
            <p className="text-xl font-bold">{workout.caloriesBurned} kcal</p>
          </div>
          
          <div className="stat-card bg-yellow-50 p-4 rounded-lg">
            <h4 className="text-sm font-semibold text-yellow-500 mb-1">Location</h4>
            <p className="text-xl font-bold">{workout.location || 'Not specified'}</p>
          </div>
          
          <div className="stat-card bg-purple-50 p-4 rounded-lg">
            <h4 className="text-sm font-semibold text-purple-500 mb-1">Feeling</h4>
            <p className="text-xl font-bold">{getFeelingEmoji(workout.feelingRating)} {workout.feelingRating}/5</p>
          </div>
        </div>
        
        {workout.notes && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Notes</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p>{workout.notes}</p>
            </div>
          </div>
        )}
        
        <div>
          <h3 className="text-lg font-semibold mb-4">Exercises</h3>
          
          {workout.exercises.length === 0 ? (
            <p className="text-gray-500">No exercises recorded for this workout.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-4 text-left">Exercise</th>
                    <th className="py-2 px-4 text-left">Category</th>
                    <th className="py-2 px-4 text-left">Details</th>
                    <th className="py-2 px-4 text-left">Calories</th>
                    <th className="py-2 px-4 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {workout.exercises.map((exercise, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="py-2 px-4 font-medium">
                        {exercise.name}
                        {exercise.personalRecord && <span className="ml-2 text-yellow-500">🏆</span>}
                      </td>
                      <td className="py-2 px-4">
                        {exercise.category.charAt(0).toUpperCase() + exercise.category.slice(1)}
                      </td>
                      <td className="py-2 px-4">
                        {exercise.category === 'strength' ? (
                          <span>
                            {exercise.setsCompleted} sets × {exercise.repsCompleted} reps
                            {exercise.weight > 0 ? ` @ ${exercise.weight} kg/lbs` : ''}
                            {exercise.restTime ? ` (${exercise.restTime}s rest)` : ''}
                          </span>
                        ) : exercise.category === 'cardio' ? (
                          <span>
                            {exercise.distance ? `${exercise.distance} km/miles` : ''} 
                            {exercise.distance && exercise.duration ? ' • ' : ''}
                            {exercise.duration ? `${exercise.duration} min` : ''}
                          </span>
                        ) : (
                          <span>{exercise.duration ? `${exercise.duration} min` : ''}</span>
                        )}
                      </td>
                      <td className="py-2 px-4">
                        {exercise.caloriesBurned || 0} kcal
                      </td>
                      <td className="py-2 px-4">{exercise.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {workout.photoUrls && workout.photoUrls.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Photos</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {workout.photoUrls.map((url, index) => (
                <div key={index} className="rounded-lg overflow-hidden">
                  <img src={url} alt={`Workout photo ${index + 1}`} className="w-full h-48 object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutDetail; 