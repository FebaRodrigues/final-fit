import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaUserTie } from 'react-icons/fa';

const GoalsList = ({ goals = [] }) => {
  const getProgressColor = (progress) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const calculateDaysLeft = (deadline) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Separate trainer-assigned goals from user-created goals
  const trainerGoals = goals.filter(goal => goal.trainerId && goal.createdBy === 'trainer');
  const userGoals = goals.filter(goal => !goal.trainerId || goal.createdBy !== 'trainer');
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Active Goals</h3>
        <Link 
          to="/user/goals/new" 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
        >
          Add Goal
        </Link>
      </div>
      
      {goals.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <p>No active goals.</p>
          <p className="text-sm mt-2">
            Set your first fitness goal to start tracking your progress!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Trainer-Assigned Goals Section */}
          {trainerGoals.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-3 flex items-center">
                <FaUserTie className="mr-2 text-blue-500" />
                Trainer-Assigned Goals
              </h4>
              <div className="space-y-4">
                {trainerGoals.map((goal) => (
                  <div 
                    key={goal._id} 
                    className="border border-blue-200 rounded-lg p-4 hover:bg-blue-50 transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-800 capitalize flex items-center">
                          {goal.goalType}
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Assigned by {goal.trainerId?.name || 'Your Trainer'}
                          </span>
                        </h4>
                        <p className="text-sm text-gray-600">
                          Target: {goal.targetValue} {goal.unit || ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium bg-blue-100 text-blue-800 py-1 px-2 rounded">
                          {calculateDaysLeft(goal.deadline)} days left
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          Due {formatDate(goal.deadline)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                      <div 
                        className={`h-2.5 rounded-full ${getProgressColor(goal.progress)}`}
                        style={{ width: `${Math.min(goal.progress, 100)}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">
                        Progress: {goal.progress.toFixed(1)}%
                      </span>
                      <div className="space-x-2">
                        <Link 
                          to={`/user/goals/progress/${goal._id}`}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          Update
                        </Link>
                        <Link 
                          to={`/user/goals/${goal._id}`}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                    
                    {goal.notes && (
                      <p className="text-sm text-gray-500 mt-2 border-t border-gray-100 pt-2">
                        {goal.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User-Created Goals Section */}
          {userGoals.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-3">Your Goals</h4>
              <div className="space-y-4">
                {userGoals.map((goal) => (
                  <div 
                    key={goal._id} 
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-800 capitalize">
                          {goal.goalType}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Target: {goal.targetValue} {goal.unit || ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium bg-blue-100 text-blue-800 py-1 px-2 rounded">
                          {calculateDaysLeft(goal.deadline)} days left
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          Due {formatDate(goal.deadline)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                      <div 
                        className={`h-2.5 rounded-full ${getProgressColor(goal.progress)}`}
                        style={{ width: `${Math.min(goal.progress, 100)}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">
                        Progress: {goal.progress.toFixed(1)}%
                      </span>
                      <div className="space-x-2">
                        <Link 
                          to={`/user/goals/progress/${goal._id}`}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          Update
                        </Link>
                        <Link 
                          to={`/user/goals/edit/${goal._id}`}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                    
                    {goal.notes && (
                      <p className="text-sm text-gray-500 mt-2 border-t border-gray-100 pt-2">
                        {goal.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GoalsList; 