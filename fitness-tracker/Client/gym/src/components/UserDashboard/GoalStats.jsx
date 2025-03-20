import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const GoalStats = ({ stats }) => {
  const {
    totalGoals = 0,
    completedGoals = 0,
    inProgressGoals = 0,
    upcomingGoals = 0,
    averageProgress = 0,
    completionRate = 0
  } = stats || {};
  
  const chartData = {
    labels: ['Completed', 'In Progress', 'Upcoming'],
    datasets: [
      {
        data: [completedGoals, inProgressGoals, upcomingGoals],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)', // green
          'rgba(59, 130, 246, 0.8)', // blue
          'rgba(249, 115, 22, 0.8)', // orange
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(249, 115, 22, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h3 className="text-xl font-bold mb-4">Goals Overview</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="w-full max-w-[250px] mx-auto">
            <Doughnut data={chartData} options={chartOptions} />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Goals</p>
            <p className="text-2xl font-bold text-gray-800">{totalGoals}</p>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-green-600">{completedGoals}</p>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Average Progress</p>
            <p className="text-2xl font-bold text-blue-600">
              {averageProgress.toFixed(1)}%
            </p>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Completion Rate</p>
            <p className="text-2xl font-bold text-orange-600">
              {completionRate.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-6 text-sm text-gray-500 text-center">
        <p>Keep pushing towards your goals! Every step counts.</p>
      </div>
    </div>
  );
};

export default GoalStats; 