// hooks/useWorkoutLogs.js
import { useState, useEffect, useCallback } from 'react';
import { 
  getWorkoutLogs, 
  getWorkoutStats, 
  deleteWorkoutLog, 
  getWorkoutLogById,
  createWorkoutLog,
  updateWorkoutLog
} from '../api';

export const useWorkoutLogs = (userId) => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch workout logs
  const fetchLogs = useCallback(async (params = {}) => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await getWorkoutLogs(userId, {
        limit: params.limit || 10,
        page: params.page || 1,
        sortBy: params.sortBy || 'date',
        sortOrder: params.sortOrder || 'desc',
        startDate: params.startDate,
        endDate: params.endDate,
        workoutType: params.workoutType
      });
      
      setLogs(response.data.logs || []);
      setLoading(false);
      return response.data;
    } catch (err) {
      console.error('Error fetching workout logs:', err);
      setError('Failed to load workout logs. Please try again later.');
      setLoading(false);
      throw err;
    }
  }, [userId]);
  
  // Fetch workout stats
  const fetchStats = useCallback(async (period = 'month', startDate, endDate) => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await getWorkoutStats(userId, period, startDate, endDate);
      setStats(response.data || null);
      setLoading(false);
      return response.data;
    } catch (err) {
      console.error('Error fetching workout stats:', err);
      setError('Failed to load workout statistics. Please try again later.');
      setLoading(false);
      throw err;
    }
  }, [userId]);
  
  // Get a single workout log
  const getLog = useCallback(async (logId) => {
    setLoading(true);
    try {
      const response = await getWorkoutLogById(logId);
      setLoading(false);
      return response.data;
    } catch (err) {
      console.error('Error fetching workout log:', err);
      setError('Failed to load workout details. Please try again later.');
      setLoading(false);
      throw err;
    }
  }, []);
  
  // Create a new workout log
  const addLog = useCallback(async (workoutData) => {
    setLoading(true);
    try {
      const response = await createWorkoutLog({
        userId,
        ...workoutData
      });
      
      // Update the logs list with the new log
      setLogs(prevLogs => [response.data.workoutLog, ...prevLogs]);
      
      // Refresh stats after adding a new log
      await fetchStats();
      
      setLoading(false);
      return response.data.workoutLog;
    } catch (err) {
      console.error('Error creating workout log:', err);
      setError('Failed to save workout. Please try again later.');
      setLoading(false);
      throw err;
    }
  }, [userId, fetchStats]);
  
  // Update an existing workout log
  const updateLog = useCallback(async (logId, workoutData) => {
    setLoading(true);
    try {
      const response = await updateWorkoutLog(logId, workoutData);
      
      // Update the logs list with the updated log
      setLogs(prevLogs => 
        prevLogs.map(log => 
          log._id === logId ? response.data.workoutLog : log
        )
      );
      
      // Refresh stats after updating a log
      await fetchStats();
      
      setLoading(false);
      return response.data.workoutLog;
    } catch (err) {
      console.error('Error updating workout log:', err);
      setError('Failed to update workout. Please try again later.');
      setLoading(false);
      throw err;
    }
  }, [fetchStats]);
  
  // Delete a workout log
  const removeLog = useCallback(async (logId) => {
    try {
      await deleteWorkoutLog(logId);
      
      // Update the logs list by removing the deleted log
      setLogs(prevLogs => prevLogs.filter(log => log._id !== logId));
      
      // Refresh stats after deletion
      await fetchStats();
      
      return true;
    } catch (err) {
      console.error('Error deleting workout log:', err);
      setError('Failed to delete workout. Please try again later.');
      throw err;
    }
  }, [fetchStats]);
  
  // Load initial data
  useEffect(() => {
    if (userId) {
      fetchLogs();
      fetchStats();
    }
  }, [userId, fetchLogs, fetchStats]);
  
  return {
    logs,
    stats,
    loading,
    error,
    fetchLogs,
    fetchStats,
    getLog,
    addLog,
    updateLog,
    removeLog
  };
}; 