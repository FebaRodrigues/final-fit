import { useState, useEffect, useCallback } from 'react';
import { 
  getGoalsByUserId, 
  getAllUserGoals,
  getGoalById, 
  createGoal, 
  updateGoal, 
  updateGoalProgress, 
  deleteGoal, 
  getGoalStats 
} from '../api';

export const useGoals = (userId, options = {}) => {
  const [goals, setGoals] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [goalDetails, setGoalDetails] = useState({});
  const [error, setError] = useState(null);
  
  // Ensure options is an object
  const safeOptions = options || {};
  
  // Define fetchGoals with useCallback to prevent infinite loops
  const fetchGoals = useCallback(async () => {
    try {
      // Only set loading to true on initial fetch, not on refreshes
      if (goals.length === 0) {
        setLoading(true);
      }
      
      // Use the appropriate function based on options
      let response;
      if (safeOptions.all) {
        // If we want all goals with filtering
        response = await getAllUserGoals(userId, safeOptions.params || {});
      } else {
        // Default to active goals
        response = await getGoalsByUserId(userId);
      }
      
      // Check if response.data has a goals property
      if (response.data && response.data.goals) {
        setGoals(response.data.goals);
      } else if (Array.isArray(response.data)) {
        // If response.data is an array, use it directly
        setGoals(response.data);
      } else {
        // If neither, set empty array
        setGoals([]);
      }
      
      setError(null);
      return response.data;
    } catch (err) {
      console.error('Error fetching goals:', err);
      setError(err.message || 'Failed to fetch goals');
      setGoals([]); // Set empty array on error
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, safeOptions.all, JSON.stringify(safeOptions.params || {}), goals.length]);
  
  useEffect(() => {
    if (userId) {
      fetchGoals();
    }
  }, [userId, fetchGoals]);
  
  // Use useCallback to memoize fetchStats to prevent infinite loops
  const fetchStats = useCallback(async () => {
    try {
      // Only set loading if stats are not already loaded
      if (!stats) {
        setLoading(true);
      }
      const response = await getGoalStats(userId);
      setStats(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching goal stats:', err);
      setError(err.message || 'Failed to fetch goal statistics');
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId, stats]);
  
  const fetchGoalDetails = async (goalId) => {
    try {
      // Check if we already have this goal's details cached
      if (goalDetails[goalId]) {
        return goalDetails[goalId];
      }
      
      setDetailsLoading(true);
      const response = await getGoalById(goalId);
      const goalData = response.data.goal;
      
      // Cache the goal details
      setGoalDetails(prev => ({
        ...prev,
        [goalId]: goalData
      }));
      
      return goalData;
    } catch (err) {
      console.error('Error fetching goal details:', err);
      setError(err.message || 'Failed to fetch goal details');
      return null;
    } finally {
      setDetailsLoading(false);
    }
  };
  
  const addGoal = async (goalData) => {
    try {
      console.log('Adding goal with data:', { ...goalData, userId });
      
      // Ensure all required fields are present
      if (!goalData.goalType) {
        throw new Error('Goal type is required');
      }
      
      if (goalData.currentValue === undefined || goalData.currentValue === null) {
        throw new Error('Current value is required');
      }
      
      if (goalData.targetValue === undefined || goalData.targetValue === null) {
        throw new Error('Target value is required');
      }
      
      if (!goalData.deadline) {
        throw new Error('Deadline is required');
      }
      
      const response = await createGoal({
        ...goalData,
        userId
      });
      
      console.log('Add goal API response:', response);
      
      // Refresh goals after adding without setting loading state
      await fetchGoals();
      
      return response.data;
    } catch (err) {
      console.error('Error adding goal:', err);
      
      // Extract the error message from the response if available
      let errorMessage = 'Failed to add goal';
      
      if (err.response && err.response.data && err.response.data.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };
  
  const updateGoalData = async (goalId, goalData) => {
    try {
      const response = await updateGoal(goalId, goalData);
      
      // Update the cached goal details
      if (response.data && response.data.goal) {
        setGoalDetails(prev => ({
          ...prev,
          [goalId]: response.data.goal
        }));
      }
      
      // Refresh goals after updating without setting loading state
      await fetchGoals();
      
      return response.data;
    } catch (err) {
      console.error('Error updating goal:', err);
      setError(err.message || 'Failed to update goal');
      throw err;
    }
  };
  
  const updateProgress = async (goalId, progressData) => {
    try {
      const response = await updateGoalProgress(goalId, progressData);
      
      // Update the cached goal details
      if (response.data && response.data.goal) {
        setGoalDetails(prev => ({
          ...prev,
          [goalId]: response.data.goal
        }));
      }
      
      // Refresh goals after updating progress without setting loading state
      await fetchGoals();
      
      return response.data;
    } catch (err) {
      console.error('Error updating goal progress:', err);
      setError(err.message || 'Failed to update goal progress');
      throw err;
    }
  };
  
  const removeGoal = async (goalId) => {
    try {
      await deleteGoal(goalId);
      
      // Remove the goal from the cached goal details
      setGoalDetails(prev => {
        const newDetails = { ...prev };
        delete newDetails[goalId];
        return newDetails;
      });
      
      // Refresh goals after deleting without setting loading state
      await fetchGoals();
      
      return { success: true };
    } catch (err) {
      console.error('Error deleting goal:', err);
      setError(err.message || 'Failed to delete goal');
      throw err;
    }
  };
  
  return { 
    goals, 
    stats, 
    loading,
    detailsLoading,
    goalDetails,
    error, 
    fetchGoals,
    fetchStats,
    fetchGoalDetails,
    addGoal,
    updateGoalData,
    updateProgress,
    removeGoal
  };
};

export default useGoals; 