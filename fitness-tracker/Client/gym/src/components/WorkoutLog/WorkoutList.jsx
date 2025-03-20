import React from 'react';
import { Link } from 'react-router-dom';

// Workout category icons
const CATEGORY_ICONS = {
  strength: '🏋️',
  cardio: '🏃',
  flexibility: '🧘',
  hiit: '⏱️',
  custom: '✨'
};

// Completion status badges
const STATUS_BADGES = {
  completed: { class: 'bg-green-100 text-green-700', text: 'Completed' },
  partial: { class: 'bg-yellow-100 text-yellow-700', text: 'Partial' },
  planned: { class: 'bg-blue-100 text-blue-700', text: 'Planned' }
};

const WorkoutList = ({ logs, onDelete }) => {
  // Ensure logs is an array
  const workoutLogs = Array.isArray(logs) ? logs : [];
  
  // Format date to a more readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
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
  
  // If no logs, show a message
  if (workoutLogs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No workout logs found.</p>
        <Link
          to="/workouts/log"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Log Your First Workout
        </Link>
      </div>
    );
  }
  
  return (
    <div className="workout-list">
      {workoutLogs.map((log) => {
        // Skip rendering if log is invalid
        if (!log || !log._id) {
          console.warn('Invalid log entry:', log);
          return null;
        }
        
        // Ensure exercises is an array
        const exercises = Array.isArray(log.exercises) ? log.exercises : [];
        
        // Get status badge
        const statusBadge = STATUS_BADGES[log.completionStatus || 'completed'];
        
        return (
          <div key={log._id} className="workout-card border rounded-lg p-4 mb-4 hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center">
              <div className="mb-2 md:mb-0 flex items-center">
                <span className="text-2xl mr-2">{getCategoryIcon(log.workoutType)}</span>
                <div>
                  <h4 className="text-lg font-semibold">{log.title || 'Untitled Workout'}</h4>
                  <p className="text-gray-500 text-sm">{formatDate(log.date)}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-sm ${statusBadge.class}`}>
                  {statusBadge.text}
                </span>
                
                <Link
                  to={`/workouts/${log._id}`}
                  className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm hover:bg-blue-200"
                >
                  View
                </Link>
                
                <Link
                  to={`/workouts/edit/${log._id}`}
                  className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm hover:bg-green-200"
                >
                  Edit
                </Link>
                
                <button
                  onClick={() => onDelete(log._id)}
                  className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
            
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="stat-pill bg-gray-100 px-3 py-1 rounded-full text-sm">
                <span className="font-medium">{exercises.length}</span> exercises
              </div>
              
              <div className="stat-pill bg-gray-100 px-3 py-1 rounded-full text-sm">
                <span className="font-medium">{formatDuration(log.duration)}</span>
              </div>
              
              <div className="stat-pill bg-gray-100 px-3 py-1 rounded-full text-sm">
                <span className="font-medium">{log.caloriesBurned || 0}</span> kcal
              </div>
              
              <div className="stat-pill bg-gray-100 px-3 py-1 rounded-full text-sm">
                <span className="font-medium">{log.location || 'N/A'}</span>
              </div>
            </div>
            
            {exercises.length > 0 && (
              <div className="mt-3">
                <div className="flex flex-wrap gap-2">
                  {exercises.slice(0, 3).map((exercise, index) => (
                    <div key={index} className="bg-gray-50 px-3 py-1 rounded text-sm">
                      <span className="font-medium">{exercise.name}</span>
                      {exercise.category === 'strength' && (
                        <span className="text-gray-500">
                          {' '}{exercise.setsCompleted || 0}×{exercise.repsCompleted || 0}
                          {exercise.weight > 0 && ` @ ${exercise.weight}kg`}
                          {exercise.personalRecord && ' 🏆'}
                        </span>
                      )}
                      {exercise.category === 'cardio' && exercise.duration > 0 && (
                        <span className="text-gray-500"> {exercise.duration} min</span>
                      )}
                    </div>
                  ))}
                  {exercises.length > 3 && (
                    <div className="bg-gray-50 px-3 py-1 rounded text-sm">
                      +{exercises.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {log.notes && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 italic">"{log.notes.substring(0, 100)}{log.notes.length > 100 ? '...' : ''}"</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default WorkoutList; 