import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getWorkoutLogs } from '../../api';

const WorkoutCalendar = ({ userId }) => {
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
        console.error('Error fetching workouts for calendar:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkouts();
  }, [userId]);
  
  // Get current date information
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Get days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  // Create array of day numbers for the month
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  // Create array for empty cells before first day of month
  const emptyCells = Array.from({ length: firstDayOfMonth }, (_, i) => null);
  
  // Combine empty cells and days
  const calendarCells = [...emptyCells, ...days];
  
  // Format date to match workout date format (YYYY-MM-DD)
  const formatDate = (day) => {
    const month = currentMonth + 1;
    return `${currentYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };
  
  // Check if a workout exists for a given day
  const getWorkoutForDay = (day) => {
    if (!workouts || !day) return null;
    
    const formattedDate = formatDate(day);
    return workouts.find(workout => workout.date.split('T')[0] === formattedDate);
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h3 className="text-xl font-bold mb-4">Workout Calendar</h3>
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h3 className="text-xl font-bold mb-4">Workout Calendar</h3>
      
      <div className="text-center mb-4">
        <h4 className="text-lg font-semibold">
          {new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })} {currentYear}
        </h4>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-semibold text-sm py-1">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {calendarCells.map((day, index) => {
          const workout = getWorkoutForDay(day);
          const isToday = day === currentDate.getDate();
          
          return (
            <div 
              key={index} 
              className={`
                text-center p-2 h-14 relative
                ${!day ? 'bg-gray-100' : 'border border-gray-200'}
                ${isToday ? 'bg-blue-100' : ''}
                ${workout ? 'cursor-pointer hover:bg-gray-100' : ''}
              `}
            >
              {day && (
                <>
                  <span className={`text-sm ${isToday ? 'font-bold' : ''}`}>{day}</span>
                  
                  {workout && (
                    <Link to={`/user/workouts/${workout._id}`}>
                      <div className="absolute bottom-0 left-0 right-0 bg-green-500 text-white text-xs p-1 truncate">
                        {workout.title}
                      </div>
                    </Link>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 text-center">
        <Link to="/user/workouts" className="text-blue-500 hover:text-blue-700 text-sm">
          View All Workouts
        </Link>
      </div>
    </div>
  );
};

export default WorkoutCalendar; 