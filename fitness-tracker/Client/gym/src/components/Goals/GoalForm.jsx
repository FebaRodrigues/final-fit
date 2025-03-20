import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useGoals } from '../../hooks';
import MilestoneInput from './MilestoneInput';
import { toast } from 'react-toastify';
import '../../styles/GoalForm.css';

const GoalForm = ({ viewOnly = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { goalId } = useParams();
  const { addGoal, updateGoalData, fetchGoalDetails, detailsLoading } = useGoals(user?.id);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const initialLoadRef = useRef(true);
  
  const [formData, setFormData] = useState({
    goalType: 'exercise',
    currentValue: '',
    targetValue: '',
    deadline: '',
    frequency: 'custom',
    notes: '',
    milestones: []
  });
  
  const handleDuplicate = () => {
    // Remove the goalId to create a new goal instead of updating
    const newGoalData = { ...formData };
    
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
            setFormData({
              goalType: goalData.goalType,
              currentValue: goalData.currentValue,
              targetValue: goalData.targetValue,
              deadline: new Date(goalData.deadline).toISOString().split('T')[0],
              frequency: goalData.frequency || 'custom',
              notes: goalData.notes || '',
              milestones: goalData.milestones || []
            });
            setDataLoaded(true);
          }
        } catch (error) {
          console.error('Error loading goal data:', error);
          toast.error('Failed to load goal data');
        }
      } else if (!goalId) {
        // If no goalId, we're creating a new goal
        
        // Check if there's duplicated goal data in localStorage
        const duplicatedGoalData = localStorage.getItem('duplicatedGoalData');
        if (duplicatedGoalData) {
          try {
            const parsedData = JSON.parse(duplicatedGoalData);
            setFormData(parsedData);
            // Clear the localStorage after using it
            localStorage.removeItem('duplicatedGoalData');
          } catch (error) {
            console.error('Error parsing duplicated goal data:', error);
          }
        }
        
        setDataLoaded(true);
      }
    };
    
    loadGoalData();
  }, [goalId, fetchGoalDetails]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Show warning when changing goal type of an existing goal
    if (name === 'goalType' && goalId) {
      const confirmed = window.confirm(
        "Changing the goal type may affect your progress tracking and validation rules. Are you sure you want to change it?"
      );
      
      if (!confirmed) {
        return; // Don't change if not confirmed
      }
    }
    
    setFormData({
      ...formData,
      [name]: ['currentValue', 'targetValue'].includes(name) 
        ? parseFloat(value) || '' 
        : value
    });
  };
  
  const handleMilestoneChange = (index, updatedMilestone) => {
    const updatedMilestones = [...formData.milestones];
    updatedMilestones[index] = updatedMilestone;
    setFormData({
      ...formData,
      milestones: updatedMilestones
    });
  };
  
  const addMilestone = () => {
    setFormData({
      ...formData,
      milestones: [
        ...formData.milestones, 
        { 
          title: '', 
          targetValue: '', 
          notes: '',
          completed: false
        }
      ]
    });
  };
  
  const removeMilestone = (index) => {
    const updatedMilestones = formData.milestones.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      milestones: updatedMilestones
    });
  };
  
  const validateForm = () => {
    if (!formData.goalType) {
      toast.error('Please select a goal type');
      return false;
    }
    
    if (!formData.currentValue && formData.currentValue !== 0) {
      toast.error('Please enter your current value');
      return false;
    }
    
    if (!formData.targetValue && formData.targetValue !== 0) {
      toast.error('Please enter your target value');
      return false;
    }
    
    if (!formData.deadline) {
      toast.error('Please select a deadline');
      return false;
    }
    
    // Validate based on goal type
    if (formData.goalType === 'weight loss' && formData.currentValue <= formData.targetValue) {
      toast.error('For weight loss, current value should be greater than target value');
      return false;
    }
    
    if (['weight gain', 'exercise', 'step count', 'gym workouts', 'calorie intake'].includes(formData.goalType) && formData.currentValue >= formData.targetValue) {
      toast.error(`For ${formData.goalType}, target value should be greater than current value`);
      return false;
    }
    
    // Validate deadline is in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of day for fair comparison
    const deadlineDate = new Date(formData.deadline);
    
    if (deadlineDate <= today) {
      toast.error('Deadline must be in the future');
      return false;
    }
    
    // Validate milestones
    if (formData.milestones.some(m => !m.title.trim())) {
      toast.error('All milestones must have a title');
      return false;
    }
    
    if (formData.milestones.some(m => !m.targetValue && m.targetValue !== 0)) {
      toast.error('All milestones must have a target value');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Ensure all required fields have the correct data types
      const formattedData = {
        ...formData,
        currentValue: parseFloat(formData.currentValue),
        targetValue: parseFloat(formData.targetValue),
        milestones: formData.milestones.map(m => ({
          ...m,
          targetValue: parseFloat(m.targetValue)
        }))
      };
      
      if (goalId) {
        await updateGoalData(goalId, formattedData);
        toast.success('Goal updated successfully');
      } else {
        await addGoal(formattedData);
        toast.success('Goal created successfully');
      }
      
      navigate('/user/goals');
    } catch (error) {
      console.error('Error saving goal:', error);
      toast.error(error.message || 'Failed to save goal');
    } finally {
      setLoading(false);
    }
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
  
  return (
    <div className="goal-form-container">
      <h2 className="goal-form-title">
        {goalId ? (viewOnly ? 'Goal Details' : 'Edit Goal') : 'Create New Goal'}
      </h2>
      
      {loading || detailsLoading ? (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      ) : (
        <form className="goal-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-col">
              <div className="form-group">
                <label htmlFor="goalType" className="form-label">Goal Type</label>
                <select
                  id="goalType"
                  name="goalType"
                  className="form-control form-select"
                  value={formData.goalType}
                  onChange={handleChange}
                  disabled={viewOnly}
                  required
                >
                  <option value="weight-loss">Weight Loss</option>
                  <option value="weight-gain">Weight Gain</option>
                  <option value="exercise">Exercise</option>
                  <option value="cardio">Cardio</option>
                  <option value="strength">Strength</option>
                  <option value="flexibility">Flexibility</option>
                  <option value="nutrition">Nutrition</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>
            
            <div className="form-col">
              <div className="form-group">
                <label htmlFor="frequency" className="form-label">Frequency</label>
                <select
                  id="frequency"
                  name="frequency"
                  className="form-control form-select"
                  value={formData.frequency}
                  onChange={handleChange}
                  disabled={viewOnly}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-col">
              <div className="form-group">
                <label htmlFor="currentValue" className="form-label">Current Value</label>
                <input
                  type="number"
                  id="currentValue"
                  name="currentValue"
                  className="form-control"
                  value={formData.currentValue}
                  onChange={handleChange}
                  disabled={viewOnly}
                  required
                />
              </div>
            </div>
            
            <div className="form-col">
              <div className="form-group">
                <label htmlFor="targetValue" className="form-label">Target Value</label>
                <input
                  type="number"
                  id="targetValue"
                  name="targetValue"
                  className="form-control"
                  value={formData.targetValue}
                  onChange={handleChange}
                  disabled={viewOnly}
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="deadline" className="form-label">Deadline</label>
            <input
              type="date"
              id="deadline"
              name="deadline"
              className="form-control"
              value={formData.deadline}
              onChange={handleChange}
              disabled={viewOnly}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="notes" className="form-label">Notes</label>
            <textarea
              id="notes"
              name="notes"
              className="form-control"
              value={formData.notes}
              onChange={handleChange}
              disabled={viewOnly}
              rows="3"
            ></textarea>
          </div>
          
          <div className="milestones-section">
            <h3 className="milestones-title">Milestones</h3>
            <div className="milestone-list">
              {formData.milestones.map((milestone, index) => (
                <MilestoneInput
                  key={index}
                  index={index}
                  milestone={milestone}
                  onChange={handleMilestoneChange}
                  onRemove={removeMilestone}
                  viewOnly={viewOnly}
                />
              ))}
            </div>
            
            {!viewOnly && (
              <button
                type="button"
                className="add-milestone-btn"
                onClick={addMilestone}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add Milestone
              </button>
            )}
          </div>
          
          <div className="form-actions">
            <Link to="/user/goals" className="btn btn-outline">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Back to Goals
            </Link>
            
            {viewOnly ? (
              <div>
                <Link to={`/user/goals/edit/${goalId}`} className="btn btn-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  Edit Goal
                </Link>
              </div>
            ) : (
              <button type="submit" className="btn btn-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                {goalId ? 'Update Goal' : 'Save Goal'}
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};

export default GoalForm; 