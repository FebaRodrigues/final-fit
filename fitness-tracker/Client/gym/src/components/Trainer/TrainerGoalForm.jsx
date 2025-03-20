import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getGoalById, createGoal, updateGoal } from '../../api';
import MilestoneInput from '../Goals/MilestoneInput';
import { toast } from 'react-toastify';
import '../../styles/TrainerGoalForm.css';

const TrainerGoalForm = () => {
  const { user, trainer } = useAuth();
  const navigate = useNavigate();
  const { goalId } = useParams();
  const location = useLocation();
  const clientId = location.state?.clientId;
  
  // Debug log for authentication state
  console.log('TrainerGoalForm - Auth state:', { user, trainer });
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!goalId);
  const [goalData, setGoalData] = useState(null);
  
  const [formData, setFormData] = useState({
    goalType: 'weight loss',
    currentValue: '',
    targetValue: '',
    deadline: '',
    frequency: 'custom',
    notes: '',
    milestones: [],
    userId: clientId || ''
  });
  
  useEffect(() => {
    const loadGoalData = async () => {
      if (goalId) {
        try {
          setInitialLoading(true);
          const response = await getGoalById(goalId);
          const goalData = response.data.goal;
          
          if (goalData) {
            setGoalData(goalData);
            setFormData({
              goalType: goalData.goalType,
              currentValue: goalData.currentValue,
              targetValue: goalData.targetValue,
              deadline: new Date(goalData.deadline).toISOString().split('T')[0],
              frequency: goalData.frequency || 'custom',
              notes: goalData.notes || '',
              milestones: goalData.milestones || [],
              userId: goalData.userId
            });
          }
        } catch (error) {
          console.error('Error loading goal data:', error);
          toast.error('Failed to load goal data');
        } finally {
          setInitialLoading(false);
        }
      }
    };
    
    loadGoalData();
  }, [goalId]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
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
    if (!formData.userId) {
      toast.error('Client ID is required');
      return false;
    }
    
    if (!formData.goalType) {
      toast.error('Please select a goal type');
      return false;
    }
    
    if (!formData.currentValue && formData.currentValue !== 0) {
      toast.error('Please enter the current value');
      return false;
    }
    
    if (!formData.targetValue && formData.targetValue !== 0) {
      toast.error('Please enter the target value');
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
    
    if (['muscle gain', 'endurance', 'distance', 'step count', 'gym workouts'].includes(formData.goalType) && formData.currentValue >= formData.targetValue) {
      toast.error(`For ${formData.goalType}, target value should be greater than current value`);
      return false;
    }
    
    // For calorie intake, we don't enforce a specific relationship between current and target
    
    // Validate deadline is in the future
    if (new Date(formData.deadline) <= new Date()) {
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
      
      // Debug logging for submission
      console.log('TrainerGoalForm - Submit - Auth state:', { user, trainer });
      
      // Get trainer ID from localStorage directly as a fallback
      let trainerId = null;
      try {
        if (trainer && trainer.id) {
          trainerId = trainer.id;
        } else if (user && user.role === 'trainer' && user.id) {
          trainerId = user.id;
        } else {
          // Try to get from localStorage as a last resort
          const storedTrainer = localStorage.getItem('trainer');
          if (storedTrainer) {
            const trainerData = JSON.parse(storedTrainer);
            trainerId = trainerData.id || trainerData._id;
          }
        }
      } catch (err) {
        console.error('Error getting trainer ID:', err);
      }
      
      console.log('TrainerGoalForm - Resolved trainerId:', trainerId);
      
      if (!trainerId) {
        toast.error('Trainer authentication issue. Please log in again.');
        return;
      }
      
      // Enhanced form data with trainer ID and creation attribution
      const enhancedFormData = {
        ...formData,
        trainerId: trainerId, // Assign current trainer as the creator
        createdBy: 'trainer' // Mark that this goal was created by a trainer
      };
      
      console.log('TrainerGoalForm - Submitting goal with data:', enhancedFormData);
      
      if (goalId) {
        await updateGoal(goalId, enhancedFormData);
        toast.success('Goal updated successfully');
      } else {
        await createGoal(enhancedFormData);
        toast.success('Goal created successfully');
      }
      
      navigate('/trainer/goals');
    } catch (error) {
      console.error('Error saving goal:', error);
      toast.error(error.message || 'Failed to save goal');
    } finally {
      setLoading(false);
    }
  };
  
  if (initialLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">
        {goalId ? `Edit Goal for Client` : `Create New Goal for Client`}
      </h2>
      
      {goalData && (
        <div className="mb-4">
          <p className="text-gray-600">
            Client: {goalData.userId?.name || 'Unknown Client'}
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        {!goalId && !clientId && (
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="userId">
              Client ID
            </label>
            <input
              type="text"
              id="userId"
              name="userId"
              value={formData.userId}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter client ID"
            />
            <p className="text-sm text-gray-500 mt-1">
              This should be the ID of the client you're creating the goal for.
            </p>
          </div>
        )}
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="goalType">
            Goal Type
          </label>
          <select
            id="goalType"
            name="goalType"
            value={formData.goalType}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            disabled={!!goalId} // Can't change goal type when editing
          >
            <option value="weight loss">Weight Loss</option>
            <option value="muscle gain">Muscle Gain</option>
            <option value="endurance">Endurance (Time/Duration)</option>
            <option value="distance">Distance</option>
            <option value="calorie intake">Calorie Intake</option>
            <option value="step count">Step Count</option>
            <option value="gym workouts">Gym Workouts</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="frequency">
            Frequency
          </label>
          <select
            id="frequency"
            name="frequency"
            value={formData.frequency}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="custom">Custom</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">
            {formData.frequency === 'daily' && 'Goal will reset every day'}
            {formData.frequency === 'weekly' && 'Goal will reset every week'}
            {formData.frequency === 'monthly' && 'Goal will reset every month'}
            {formData.frequency === 'custom' && 'Goal will not automatically reset'}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="currentValue">
              Current {formData.goalType === 'weight loss' || formData.goalType === 'muscle gain' 
                ? 'Weight (kg/lbs)' 
                : formData.goalType === 'endurance' 
                  ? 'Duration (minutes)' 
                  : formData.goalType === 'distance' 
                    ? 'Distance (km/miles)'
                    : formData.goalType === 'calorie intake'
                      ? 'Calories (kcal)'
                      : formData.goalType === 'step count'
                        ? 'Steps'
                        : formData.goalType === 'gym workouts'
                          ? 'Workouts per week'
                          : 'Value'}
            </label>
            <input
              type="number"
              id="currentValue"
              name="currentValue"
              value={formData.currentValue}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="targetValue">
              Target {formData.goalType === 'weight loss' || formData.goalType === 'muscle gain' 
                ? 'Weight (kg/lbs)' 
                : formData.goalType === 'endurance' 
                  ? 'Duration (minutes)' 
                  : formData.goalType === 'distance' 
                    ? 'Distance (km/miles)'
                    : formData.goalType === 'calorie intake'
                      ? 'Calories (kcal)'
                      : formData.goalType === 'step count'
                        ? 'Steps'
                        : formData.goalType === 'gym workouts'
                          ? 'Workouts per week'
                          : 'Value'}
            </label>
            <input
              type="number"
              id="targetValue"
              name="targetValue"
              value={formData.targetValue}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="deadline">
            Deadline
          </label>
          <input
            type="date"
            id="deadline"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows="3"
            placeholder="Additional notes about this goal"
          ></textarea>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Milestones</h3>
            <button
              type="button"
              onClick={addMilestone}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline text-sm"
            >
              Add Milestone
            </button>
          </div>
          
          {formData.milestones.length === 0 ? (
            <p className="text-gray-500 mb-4">No milestones added yet. Add milestones to track progress.</p>
          ) : (
            formData.milestones.map((milestone, index) => (
              <MilestoneInput
                key={index}
                milestone={milestone}
                index={index}
                goalType={formData.goalType}
                onChange={handleMilestoneChange}
                onRemove={removeMilestone}
              />
            ))
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={loading}
            className={`bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Saving...' : (goalId ? 'Update Goal' : 'Create Goal')}
          </button>
          
          <button
            type="button"
            onClick={() => navigate('/trainer/goals')}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default TrainerGoalForm; 