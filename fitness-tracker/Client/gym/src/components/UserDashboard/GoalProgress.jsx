import React from 'react';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const GoalProgress = ({ goal }) => {
  if (!goal) return null;
  
  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const calculateProgress = () => {
    const current = goal.currentValue;
    const target = goal.targetValue;
    const initial = goal.initialValue;
    
    if (target === initial) return 0;
    
    const progress = ((current - initial) / (target - initial)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };
  
  const getProgressColor = (progress) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  const chartData = {
    labels: goal.progressHistory.map(p => formatDate(p.date)),
    datasets: [
      {
        label: 'Progress',
        data: goal.progressHistory.map(p => p.value),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.3,
      },
      {
        label: 'Target',
        data: goal.progressHistory.map(() => goal.targetValue),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderDash: [5, 5],
      },
    ],
  };
  
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        min: Math.min(goal.initialValue, goal.targetValue) * 0.9,
        max: Math.max(goal.currentValue, goal.targetValue) * 1.1,
      },
    },
  };
  
  const progress = calculateProgress();
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold capitalize">{goal.goalType}</h3>
          <p className="text-sm text-gray-600">
            Target: {goal.targetValue} {goal.unit || ''}
          </p>
        </div>
        <Link 
          to={`/user/goals/progress/${goal._id}`}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
        >
          Update Progress
        </Link>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Current: {goal.currentValue}</span>
          <span>Target: {goal.targetValue}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${getProgressColor(progress)}`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="text-right text-sm text-gray-600 mt-1">
          {progress.toFixed(1)}% Complete
        </div>
      </div>
      
      <div className="h-64">
        <Line data={chartData} options={chartOptions} />
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="text-sm text-gray-600">
          <div className="flex justify-between items-center mb-1">
            <span>Started</span>
            <span>{formatDate(goal.startDate)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Deadline</span>
            <span>{formatDate(goal.deadline)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalProgress; 