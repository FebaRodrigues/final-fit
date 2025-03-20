import React from 'react';

const WorkoutStreak = ({ streak = 0 }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h3 className="text-xl font-bold mb-2">Current Streak</h3>
      
      <div className="flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl font-bold text-orange-500 mb-2">
            {streak}
          </div>
          <div className="text-gray-600">
            {streak === 1 ? 'Day' : 'Days'}
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <div className="flex justify-center space-x-1">
          {[...Array(7)].map((_, index) => (
            <div 
              key={index} 
              className={`w-4 h-4 rounded-full ${
                index < (streak % 7) ? 'bg-orange-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {streak > 0 
            ? "Keep going! Don't break your streak." 
            : "Start working out to build your streak!"}
        </p>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="text-sm text-gray-600">
          <div className="flex justify-between items-center mb-1">
            <span>7 Day Streak</span>
            <span className="font-semibold">{Math.floor(streak / 7)} times</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Longest Streak</span>
            <span className="font-semibold">{Math.max(streak, 0)} days</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutStreak; 