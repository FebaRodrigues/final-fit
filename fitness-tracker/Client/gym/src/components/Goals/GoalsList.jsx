import React from 'react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { FaUserTie } from 'react-icons/fa';

const GoalsList = ({ goals, onDelete }) => {
  if (!goals || goals.length === 0) {
    return <p className="text-gray-500">No goals found.</p>;
  }

  return (
    <div className="space-y-4">
      {goals.map(goal => (
        <div 
          key={goal._id} 
          className={`goal-card ${goal.trainerId && goal.createdBy === 'trainer' ? 'border-blue-300' : ''}`}
        >
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                    goal.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {goal.goalType.replace(/-/g, ' ')}
                  </span>
                  
                  {goal.status === 'completed' && (
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                      Completed
                    </span>
                  )}
                  
                  {goal.trainerId && goal.createdBy === 'trainer' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                      <FaUserTie className="text-blue-600" />
                      {goal.trainerId?.name ? `By ${goal.trainerId.name}` : 'Trainer Assigned'}
                    </span>
                  )}
                </div>
                
                <h3 className="text-md font-semibold">
                  {goal.goalType.replace(/-/g, ' ')}: {goal.currentValue} → {goal.targetValue}
                </h3>
              </div>
              
              <div className="flex space-x-1">
                <Link
                  to={`/user/goals/${goal._id}`}
                  className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
                  title="View Goal"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                </Link>
                
                {goal.status !== 'completed' && (
                  <Link
                    to={`/user/goals/edit/${goal._id}`}
                    className="p-1.5 bg-yellow-50 text-yellow-600 rounded-md hover:bg-yellow-100"
                    title="Edit Goal"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </Link>
                )}
                
                {goal.status !== 'completed' && (
                  <Link
                    to={`/user/goals/progress/${goal._id}`}
                    className="p-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100"
                    title="Update Progress"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </Link>
                )}
                
                {/* Only allow deleting user-created goals, not trainer-assigned ones */}
                {(!goal.trainerId || goal.createdBy !== 'trainer') && (
                  <button
                    onClick={() => onDelete(goal._id)}
                    className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100"
                    title="Delete Goal"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          
            <div className="mb-3">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${getProgressColor(goal.progress)}`}
                  style={{ width: `${goal.progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{goal.progress}% complete</span>
                {goal.status !== 'completed' && (
                  <span>
                    {getDaysRemaining(goal.deadline)}
                  </span>
                )}
              </div>
            </div>
            
            {goal.notes && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{goal.notes}</p>
            )}
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>Created: {format(new Date(goal.createdAt), 'MMM d, yyyy')}</span>
              <span>Deadline: {format(new Date(goal.deadline), 'MMM d, yyyy')}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const getProgressColor = (progress) => {
  if (progress >= 100) return 'bg-green-500';
  if (progress >= 75) return 'bg-blue-500';
  if (progress >= 50) return 'bg-yellow-500';
  if (progress >= 25) return 'bg-orange-500';
  return 'bg-red-500';
};

// Calculate days remaining or days overdue
const getDaysRemaining = (deadline) => {
  if (!deadline) return 'No deadline';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  
  const diffTime = deadlineDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} left`;
  } else if (diffDays < 0) {
    return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} overdue`;
  } else {
    return 'Due today';
  }
};

export default GoalsList; 