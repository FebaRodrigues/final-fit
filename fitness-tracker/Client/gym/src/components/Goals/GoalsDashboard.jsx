import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useGoals } from '../../hooks';
import GoalsList from './GoalsList';
import GoalStats from './GoalStats';
import { toast } from 'react-toastify';
import '../../styles/GoalsDashboard.css';
import '../../styles/GoalStats.css';
import '../../styles/GoalCard.css';
import '../../styles/UserGoalForm.css';

const GoalsDashboard = () => {
  const { user } = useAuth();
  const { goals, stats, loading, error, fetchStats, fetchGoals, removeGoal } = useGoals(user?.id);
  const [activeGoals, setActiveGoals] = useState([]);
  const [completedGoals, setCompletedGoals] = useState([]);
  const statsInitialized = useRef(false);
  
  useEffect(() => {
    if (user?.id && !statsInitialized.current) {
      fetchStats();
      statsInitialized.current = true;
    }
  }, [user?.id, fetchStats]);
  
  useEffect(() => {
    if (goals && Array.isArray(goals)) {
      setActiveGoals(goals.filter(goal => goal.status === 'active'));
      setCompletedGoals(goals.filter(goal => goal.status === 'completed'));
    } else {
      setActiveGoals([]);
      setCompletedGoals([]);
    }
  }, [goals]);
  
  const handleDeleteGoal = async (goalId) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        await removeGoal(goalId);
        toast.success('Goal deleted successfully');
      } catch (err) {
        toast.error('Failed to delete goal');
      }
    }
  };
  
  if (loading && goals.length === 0 && !stats) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-2xl font-bold">Your Fitness Goals</h2>
        <Link
          to="/user/goals/new"
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Create New Goal
        </Link>
      </div>
      
      {stats && (
        <div className="mb-4">
          <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
            <h3 className="text-lg font-bold mb-3">Goal Statistics</h3>
            <GoalStats stats={stats} />
          </div>
        </div>
      )}
      
      <div className="mb-4">
        <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold">Active Goals</h3>
            <Link
              to="/user/goals/new"
              className="text-blue-500 hover:text-blue-700 text-sm font-medium flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Goal
            </Link>
          </div>
          
          {activeGoals.length > 0 ? (
            <GoalsList goals={activeGoals} onDelete={handleDeleteGoal} />
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4">No active goals found.</p>
              <Link
                to="/user/goals/new"
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline"
              >
                Create Your First Goal
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {completedGoals.length > 0 && (
        <div className="mb-4">
          <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
            <h3 className="text-lg font-bold mb-3">Completed Goals</h3>
            <GoalsList goals={completedGoals} onDelete={handleDeleteGoal} />
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsDashboard;