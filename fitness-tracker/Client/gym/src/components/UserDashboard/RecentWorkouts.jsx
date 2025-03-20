import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getWorkoutLogs } from '../../api';

const RecentWorkouts = ({ userId }) => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchWorkouts = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        const response = await getWorkoutLogs(userId);
        setWorkouts(response.data.logs || []);
      } catch (error) {
        console.error('Error fetching recent workouts:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkouts();
  }, [userId]);
  
  // Sort workouts by date (most recent first)
  const sortedWorkouts = [...workouts].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  ).slice(0, 5); // Only show the 5 most recent workouts
  
  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes > 0 ? `${remainingMinutes}m` : ''}`;
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h3 className="text-xl font-bold">Recent Workouts</h3>
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Recent Workouts</h3>
        <Link to="/user/workouts" className="text-blue-500 hover:text-blue-700 text-sm">
          View All
        </Link>
      </div>
      
      {sortedWorkouts.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <p>No workouts logged yet.</p>
          <Link to="/user/workouts/log" className="text-blue-500 hover:text-blue-700 mt-2 inline-block">
            Log Your First Workout
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedWorkouts.map((workout) => (
            <Link 
              key={workout._id} 
              to={`/user/workouts/${workout._id}`}
              className="block border border-gray-200 rounded-md p-3 hover:bg-gray-50 transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-gray-800">{workout.title}</h4>
                  <p className="text-sm text-gray-600">{formatDate(workout.date)}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium bg-blue-100 text-blue-800 py-1 px-2 rounded">
                    {formatDuration(workout.duration)}
                  </span>
                  {workout.caloriesBurned > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {workout.caloriesBurned} calories
                    </p>
                  )}
                </div>
              </div>
              
              <div className="mt-2">
                <p className="text-xs text-gray-500">
                  {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {workout.exercises.slice(0, 3).map((exercise, index) => (
                    <span key={index} className="text-xs bg-gray-100 text-gray-700 py-1 px-2 rounded">
                      {exercise.name}
                    </span>
                  ))}
                  {workout.exercises.length > 3 && (
                    <span className="text-xs bg-gray-100 text-gray-700 py-1 px-2 rounded">
                      +{workout.exercises.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentWorkouts; 