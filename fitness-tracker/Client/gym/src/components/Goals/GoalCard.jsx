import React from 'react';
import { Link } from 'react-router-dom';

const GoalCard = ({ goal, onDelete }) => {
  // Format date to a more readable format
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Calculate days remaining or days overdue
  const getDaysRemaining = () => {
    if (!goal || !goal.deadline) return 'No deadline set';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(goal.deadline);
    deadline.setHours(0, 0, 0, 0);
    
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} remaining`;
    } else if (diffDays < 0) {
      return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} overdue`;
    } else {
      return 'Due today';
    }
  };
  
  // Safely get goal status
  const getGoalStatus = () => {
    return goal && goal.status ? goal.status : 'active';
  };
  
  // Safely get goal progress
  const getGoalProgress = () => {
    return goal && typeof goal.progress === 'number' ? goal.progress : 0;
  };
  
  // Get goal type display text
  const getGoalTypeDisplay = () => {
    switch (goal.goalType) {
      case 'weight loss':
        return 'Weight Loss';
      case 'muscle gain':
        return 'Muscle Gain';
      case 'endurance':
        return 'Endurance';
      case 'distance':
        return 'Distance';
      case 'calorie intake':
        return 'Calorie Intake';
      case 'step count':
        return 'Step Count';
      case 'gym workouts':
        return 'Gym Workouts';
      default:
        return goal.goalType;
    }
  };
  
  // Get unit based on goal type
  const getUnit = () => {
    switch (goal.goalType) {
      case 'weight loss':
      case 'muscle gain':
        return 'kg/lbs';
      case 'endurance':
        return 'min';
      case 'distance':
        return 'km/miles';
      case 'calorie intake':
        return 'kcal';
      case 'step count':
        return 'steps';
      case 'gym workouts':
        return 'workouts';
      default:
        return '';
    }
  };
  
  // Get frequency display
  const getFrequencyDisplay = () => {
    if (!goal.frequency || goal.frequency === 'custom') return '';
    
    return `(${goal.frequency})`;
  };
  
  // If goal is not properly defined, return null
  if (!goal || !goal._id) {
    return null;
  }
  
  return (
    <div className={`goal-card bg-white border rounded-lg shadow-sm overflow-hidden ${
      getGoalStatus() === 'completed' ? 'border-green-300' : 'border-gray-200'
    }`}>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
              getGoalStatus() === 'completed' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {getGoalTypeDisplay()}
            </span>
            
            {getGoalStatus() === 'completed' && (
              <span className="ml-2 inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                Completed
              </span>
            )}
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
            
            {getGoalStatus() !== 'completed' && (
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
            
            {getGoalStatus() !== 'completed' && (
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
            
            <button
              onClick={() => onDelete(goal._id)}
              className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100"
              title="Delete Goal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        <h3 className="text-md font-semibold mb-2">
          {goal.goalType === 'weight loss' 
            ? `Lose weight: ${goal.currentValue} → ${goal.targetValue} ${getUnit()}`
            : goal.goalType === 'muscle gain'
              ? `Gain weight: ${goal.currentValue} → ${goal.targetValue} ${getUnit()}`
              : goal.goalType === 'endurance'
                ? `Improve endurance: ${goal.currentValue} → ${goal.targetValue} ${getUnit()}`
                : goal.goalType === 'distance'
                  ? `Increase distance: ${goal.currentValue} → ${goal.targetValue} ${getUnit()}`
                  : goal.goalType === 'calorie intake'
                    ? `Calorie intake: ${goal.currentValue} → ${goal.targetValue} ${getUnit()} ${getFrequencyDisplay()}`
                    : goal.goalType === 'step count'
                      ? `Step count: ${goal.currentValue} → ${goal.targetValue} ${getUnit()} ${getFrequencyDisplay()}`
                      : goal.goalType === 'gym workouts'
                        ? `Gym workouts: ${goal.currentValue} → ${goal.targetValue} ${getUnit()} ${getFrequencyDisplay()}`
                        : `${goal.goalType}: ${goal.currentValue} → ${goal.targetValue}`
          }
        </h3>
        
        <div className="mb-3">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${
                getGoalStatus() === 'completed' ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${getGoalProgress()}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{getGoalProgress()}% complete</span>
            {getGoalStatus() !== 'completed' && <span>{getDaysRemaining()}</span>}
          </div>
        </div>
        
        {goal.notes && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{goal.notes}</p>
        )}
        
        <div className="flex justify-between text-xs text-gray-500">
          <span>Created: {formatDate(goal.createdAt)}</span>
          <span>Deadline: {formatDate(goal.deadline)}</span>
        </div>
        
        {goal.milestones && goal.milestones.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700">
              Milestones: {goal.milestones.filter(m => m.completed).length}/{goal.milestones.length} completed
            </p>
          </div>
        )}
      </div>
      
      {getGoalStatus() !== 'completed' && (
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-100 flex justify-end">
          <Link
            to={`/user/goals/progress/${goal._id}`}
            className="inline-flex items-center px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md focus:outline-none focus:shadow-outline"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Update Progress
          </Link>
        </div>
      )}
    </div>
  );
};

export default GoalCard; 