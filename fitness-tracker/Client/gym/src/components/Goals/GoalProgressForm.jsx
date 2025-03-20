import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useGoals } from '../../hooks';
import { toast } from 'react-toastify';

const GoalProgressForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { goalId } = useParams();
  const { fetchGoalDetails, updateProgress, detailsLoading } = useGoals(user?.id);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const initialLoadRef = useRef(true);
  const [goal, setGoal] = useState(null);
  const [currentValue, setCurrentValue] = useState('');
  const [milestonesCompleted, setMilestonesCompleted] = useState({});
  
  const handleDuplicate = () => {
    if (!goal) return;
    
    // Prepare the goal data for duplication
    const newGoalData = {
      goalType: goal.goalType,
      currentValue: goal.currentValue,
      targetValue: goal.targetValue,
      deadline: new Date(goal.deadline).toISOString().split('T')[0],
      frequency: goal.frequency || 'custom',
      notes: goal.notes || '',
      milestones: goal.milestones || []
    };
    
    // Store the data in localStorage to pre-fill the new goal form
    localStorage.setItem('duplicatedGoalData', JSON.stringify(newGoalData));
    
    // Navigate to the new goal form
    navigate('/user/goals/new');
  };
  
  useEffect(() => {
    const loadGoalData = async () => {
      if (goalId && initialLoadRef.current) {
        try {
          initialLoadRef.current = false;
          const goalData = await fetchGoalDetails(goalId);
          if (goalData) {
            setGoal(goalData);
            setCurrentValue(goalData.currentValue);
            setDataLoaded(true);
          } else {
            toast.error('Goal not found');
            navigate('/user/goals');
          }
        } catch (error) {
          console.error('Error loading goal data:', error);
          toast.error('Failed to load goal data');
          navigate('/user/goals');
        }
      }
    };
    
    loadGoalData();
  }, [goalId, fetchGoalDetails, navigate]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (currentValue === '' || currentValue === null) {
      toast.error('Please enter your current value');
      return;
    }
    
    try {
      setLoading(true);
      
      await updateProgress(goalId, { currentValue: parseFloat(currentValue) });
      toast.success('Progress updated successfully');
      
      navigate('/user/goals');
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error(error.message || 'Failed to update progress');
    } finally {
      setLoading(false);
    }
  };
  
  const handleMilestoneToggle = (index) => {
    setMilestonesCompleted({
      ...milestonesCompleted,
      [index]: !milestonesCompleted[index]
    });
  };
  
  if (detailsLoading && !dataLoaded) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (!goal) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> Goal not found</span>
        </div>
        <div className="mt-4">
          <Link
            to="/user/goals"
            className="text-blue-500 hover:text-blue-700"
          >
            &larr; Back to Goals
          </Link>
        </div>
      </div>
    );
  }
  
  // Get unit based on goal type
  const getUnit = () => {
    switch (goal.goalType) {
      case 'weight loss':
      case 'muscle gain':
        return 'kg/lbs';
      case 'endurance':
        return 'minutes';
      case 'distance':
        return 'km/miles';
      default:
        return '';
    }
  };
  
  // Get label based on goal type
  const getLabel = () => {
    switch (goal.goalType) {
      case 'weight loss':
      case 'muscle gain':
        return 'Current Weight';
      case 'endurance':
        return 'Current Duration';
      case 'distance':
        return 'Current Distance';
      default:
        return 'Current Value';
    }
  };
  
  return (
    <div className="goal-progress-container">
      <h2 className="goal-progress-title">Update Goal Progress</h2>
      
      {loading || detailsLoading ? (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      ) : goal ? (
        <>
          <div className="goal-details">
            <h3>Goal Details</h3>
            <p>
              <strong>Type:</strong> {goal.goalType.replace(/-/g, ' ')}
            </p>
            <p>
              <strong>Target:</strong> {goal.targetValue} {getUnit()}
            </p>
            <p>
              <strong>Current:</strong> {goal.currentValue} {getUnit()}
            </p>
            <p>
              <strong>Deadline:</strong> {new Date(goal.deadline).toLocaleDateString()}
            </p>
            <p>
              <strong>Progress:</strong> {Math.round(goal.progress)}%
            </p>
            
            <div className="progress-container">
              <div className="progress-bar-container">
                <div 
                  className="progress-bar" 
                  style={{ width: `${goal.progress}%` }}
                ></div>
              </div>
              <div className="progress-text">
                <span>0 {getUnit()}</span>
                <span>{goal.targetValue} {getUnit()}</span>
              </div>
            </div>
          </div>
          
          <form className="progress-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="currentValue" className="form-label">
                {getLabel()}
              </label>
              <input
                type="number"
                id="currentValue"
                name="currentValue"
                className="form-control"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                required
              />
              <small className="form-text">
                Enter your current progress value. This will update your overall goal progress.
              </small>
            </div>
            
            {goal.milestones && goal.milestones.length > 0 && (
              <div className="milestones-section">
                <h3 className="milestones-title">Milestones</h3>
                {goal.milestones.map((milestone, index) => (
                  <div key={index} className="milestone-item">
                    <div className="milestone-header">
                      <h4 className="milestone-title">{milestone.title}</h4>
                      <div className={`milestone-status ${milestone.completed ? 'completed' : 'pending'}`}>
                        {milestone.completed ? 'Completed' : 'Pending'}
                      </div>
                    </div>
                    <p className="milestone-description">
                      Target: {milestone.targetValue} {getUnit()}
                    </p>
                    {milestone.notes && (
                      <p className="milestone-description">
                        Notes: {milestone.notes}
                      </p>
                    )}
                    {!milestone.completed && (
                      <div className="form-group">
                        <div className="form-check">
                          <input
                            type="checkbox"
                            id={`milestone-${index}`}
                            name={`milestone-${index}`}
                            checked={milestonesCompleted[index] || false}
                            onChange={() => handleMilestoneToggle(index)}
                            className="form-check-input"
                          />
                          <label htmlFor={`milestone-${index}`} className="form-check-label">
                            Mark as completed
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div className="form-actions">
              <Link to="/user/goals" className="btn btn-outline">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Back to Goals
              </Link>
              
              <button type="submit" className="btn btn-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                Update Progress
              </button>
            </div>
          </form>
        </>
      ) : (
        <div className="text-center">
          <p>Goal not found. Please check the URL or go back to your goals.</p>
          <Link to="/user/goals" className="btn btn-primary mt-4">
            Back to Goals
          </Link>
        </div>
      )}
    </div>
  );
};

export default GoalProgressForm; 