import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

const GoalStats = ({ stats }) => {
  // Prepare data for goal types chart
  const goalTypeData = {
    labels: ['Weight Loss', 'Muscle Gain', 'Endurance', 'Distance', 'Calorie Intake', 'Step Count', 'Gym Workouts'],
    datasets: [
      {
        data: [
          stats.byType.weightLoss || 0,
          stats.byType.muscleGain || 0,
          stats.byType.endurance || 0,
          stats.byType.distance || 0,
          stats.byType.calorieIntake || 0,
          stats.byType.stepCount || 0,
          stats.byType.gymWorkouts || 0
        ],
        backgroundColor: [
          '#FF6384', // Pink
          '#36A2EB', // Blue
          '#FFCE56', // Yellow
          '#4BC0C0', // Teal
          '#9966FF', // Purple
          '#FF9F40', // Orange
          '#8AC926', // Green
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Prepare data for goal status chart
  const goalStatusData = {
    labels: ['Active', 'Completed', 'Failed'],
    datasets: [
      {
        data: [
          stats.byStatus.active || 0,
          stats.byStatus.completed || 0,
          stats.byStatus.failed || 0
        ],
        backgroundColor: [
          '#36A2EB', // Blue
          '#4BC0C0', // Teal
          '#FF6384', // Pink
        ],
        borderWidth: 1,
      },
    ],
  };
  
  return (
    <div className="goal-stats">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-500 mb-1">Total Goals</h4>
          <p className="text-2xl font-bold">{stats.totalGoals || 0}</p>
        </div>
        
        <div className="stat-card bg-green-50 p-4 rounded-lg">
          <h4 className="text-sm font-semibold text-green-500 mb-1">Completed Goals</h4>
          <p className="text-2xl font-bold">{stats.byStatus.completed || 0}</p>
        </div>
        
        <div className="stat-card bg-yellow-50 p-4 rounded-lg">
          <h4 className="text-sm font-semibold text-yellow-500 mb-1">Active Goals</h4>
          <p className="text-2xl font-bold">{stats.byStatus.active || 0}</p>
        </div>
        
        <div className="stat-card bg-purple-50 p-4 rounded-lg">
          <h4 className="text-sm font-semibold text-purple-500 mb-1">Completion Rate</h4>
          <p className="text-2xl font-bold">{Math.round(stats.completionRate || 0)}%</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="chart-container">
          <h4 className="text-lg font-semibold mb-2">Goals by Type</h4>
          <div className="h-64">
            {stats.totalGoals > 0 ? (
              <Doughnut data={goalTypeData} options={{ maintainAspectRatio: false }} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No goal data available</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="chart-container">
          <h4 className="text-lg font-semibold mb-2">Goals by Status</h4>
          <div className="h-64">
            {stats.totalGoals > 0 ? (
              <Doughnut data={goalStatusData} options={{ maintainAspectRatio: false }} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No goal data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {stats.byStatus.active > 0 && (
        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-2">Active Goals Progress</h4>
          <div className="flex items-center">
            <div className="w-full bg-gray-200 rounded-full h-4 mr-2">
              <div 
                className="h-4 rounded-full bg-blue-500"
                style={{ width: `${stats.avgProgress || 0}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium">{Math.round(stats.avgProgress || 0)}%</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Average progress across all your active goals
          </p>
        </div>
      )}
    </div>
  );
};

export default GoalStats;

 