import { useState, useEffect } from 'react';
import { getWorkoutLogs, getWorkoutStats, createWorkoutLog, updateWorkoutLog, deleteWorkoutLog } from '../api';

export const useWorkoutLogs = (userId, options = {}) => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchWorkoutLogs = async () => {
      try {
        setLoading(true);
        const response = await getWorkoutLogs(userId, options);
        
        // Handle different response formats
        if (Array.isArray(response.data)) {
          setLogs(response.data);
        } else if (response.data && response.data.workoutLogs && Array.isArray(response.data.workoutLogs)) {
          setLogs(response.data.workoutLogs);
        } else if (response.data && response.data.logs && Array.isArray(response.data.logs)) {
          setLogs(response.data.logs);
        } else {
          console.warn('Unexpected response format for logs:', response.data);
          setLogs([]);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching workout logs:', err);
        setError(err.message || 'Failed to fetch workout logs');
        setLogs([]); // Set to empty array on error
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchWorkoutLogs();
    }
  }, [userId, options]);
  
  const fetchStats = async (period = 'week') => {
    try {
      setLoading(true);
      const response = await getWorkoutStats(userId, period);
      setStats(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching workout stats:', err);
      setError(err.message || 'Failed to fetch workout statistics');
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const addWorkoutLog = async (workoutData) => {
    try {
      const response = await createWorkoutLog({
        userId,
        ...workoutData
      });
      
      // Refresh logs after adding
      const updatedLogs = await getWorkoutLogs(userId, options);
      
      // Handle different response formats
      if (Array.isArray(updatedLogs.data)) {
        setLogs(updatedLogs.data);
      } else if (updatedLogs.data && updatedLogs.data.workoutLogs && Array.isArray(updatedLogs.data.workoutLogs)) {
        setLogs(updatedLogs.data.workoutLogs);
      } else if (updatedLogs.data && updatedLogs.data.logs && Array.isArray(updatedLogs.data.logs)) {
        setLogs(updatedLogs.data.logs);
      } else {
        console.warn('Unexpected response format for logs:', updatedLogs.data);
        // Keep existing logs if response format is unexpected
      }
      
      return response.data;
    } catch (err) {
      console.error('Error adding workout log:', err);
      setError(err.message || 'Failed to add workout log');
      throw err;
    }
  };
  
  const updateLog = async (logId, workoutData) => {
    try {
      const response = await updateWorkoutLog(logId, workoutData);
      
      // Refresh logs after updating
      const updatedLogs = await getWorkoutLogs(userId, options);
      
      // Handle different response formats
      if (Array.isArray(updatedLogs.data)) {
        setLogs(updatedLogs.data);
      } else if (updatedLogs.data && updatedLogs.data.workoutLogs && Array.isArray(updatedLogs.data.workoutLogs)) {
        setLogs(updatedLogs.data.workoutLogs);
      } else if (updatedLogs.data && updatedLogs.data.logs && Array.isArray(updatedLogs.data.logs)) {
        setLogs(updatedLogs.data.logs);
      } else {
        console.warn('Unexpected response format for logs:', updatedLogs.data);
        // Keep existing logs if response format is unexpected
      }
      
      return response.data;
    } catch (err) {
      console.error('Error updating workout log:', err);
      setError(err.message || 'Failed to update workout log');
      throw err;
    }
  };
  
  const removeLog = async (logId) => {
    try {
      await deleteWorkoutLog(logId);
      
      // Refresh logs after deleting
      const updatedLogs = await getWorkoutLogs(userId, options);
      
      // Handle different response formats
      if (Array.isArray(updatedLogs.data)) {
        setLogs(updatedLogs.data);
      } else if (updatedLogs.data && updatedLogs.data.workoutLogs && Array.isArray(updatedLogs.data.workoutLogs)) {
        setLogs(updatedLogs.data.workoutLogs);
      } else if (updatedLogs.data && updatedLogs.data.logs && Array.isArray(updatedLogs.data.logs)) {
        setLogs(updatedLogs.data.logs);
      } else {
        console.warn('Unexpected response format for logs:', updatedLogs.data);
        // Remove the deleted log from the current logs
        setLogs(logs.filter(log => log._id !== logId));
      }
    } catch (err) {
      console.error('Error deleting workout log:', err);
      setError(err.message || 'Failed to delete workout log');
      throw err;
    }
  };
  
  return { 
    logs, 
    stats, 
    loading, 
    error, 
    fetchStats,
    addWorkoutLog,
    updateLog,
    removeLog
  };
};

export default useWorkoutLogs; 