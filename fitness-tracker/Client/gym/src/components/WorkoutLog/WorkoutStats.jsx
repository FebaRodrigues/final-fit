import React, { useState } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

const WorkoutStats = ({ stats }) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Prepare data for exercise types pie chart
  const exerciseTypeData = {
    labels: Object.keys(stats.exerciseTypes || {}).map(type => 
      type.charAt(0).toUpperCase() + type.slice(1)
    ),
    datasets: [
      {
        data: Object.values(stats.exerciseTypes || {}),
        backgroundColor: [
          '#4BC0C0', // Teal
          '#FF6384', // Pink
          '#FFCE56', // Yellow
          '#36A2EB', // Blue
          '#9966FF', // Purple
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Prepare data for calories by day chart
  const caloriesChartData = {
    labels: stats.caloriesByDay?.map(day => day.date) || [],
    datasets: [
      {
        label: 'Calories Burned',
        data: stats.caloriesByDay?.map(day => day.calories) || [],
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
        tension: 0.4,
      },
    ],
  };
  
  // Prepare data for duration by day chart
  const durationChartData = {
    labels: stats.durationByDay?.map(day => day.date) || [],
    datasets: [
      {
        label: 'Workout Duration (min)',
        data: stats.durationByDay?.map(day => day.duration) || [],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
        tension: 0.4,
      },
    ],
  };
  
  // Prepare data for progress by exercise chart (for strength training)
  const strengthProgressData = {
    labels: Object.keys(stats.progressByExercise || {}).slice(0, 5),
    datasets: [
      {
        label: 'Starting Weight',
        data: Object.values(stats.progressByExercise || {}).slice(0, 5).map(ex => 
          ex.weights[0] || 0
        ),
        backgroundColor: 'rgba(255, 206, 86, 0.2)',
        borderColor: 'rgba(255, 206, 86, 1)',
        borderWidth: 1,
      },
      {
        label: 'Current Weight',
        data: Object.values(stats.progressByExercise || {}).slice(0, 5).map(ex => 
          ex.weights[ex.weights.length - 1] || 0
        ),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  // Format duration in hours and minutes
  const formatDuration = (minutes) => {
    if (!minutes) return '0 min';
    if (minutes < 60) return `${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) return `${hours} hr`;
    return `${hours} hr ${remainingMinutes} min`;
  };
  
  return (
    <div className="workout-stats">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card bg-blue-50 p-4 rounded-lg shadow-sm">
          <h4 className="text-sm font-semibold text-blue-500 mb-1">Total Workouts</h4>
          <p className="text-2xl font-bold">{stats.totalWorkouts || 0}</p>
        </div>
        
        <div className="stat-card bg-green-50 p-4 rounded-lg shadow-sm">
          <h4 className="text-sm font-semibold text-green-500 mb-1">Total Duration</h4>
          <p className="text-2xl font-bold">{formatDuration(stats.totalDuration || 0)}</p>
        </div>
        
        <div className="stat-card bg-yellow-50 p-4 rounded-lg shadow-sm">
          <h4 className="text-sm font-semibold text-yellow-500 mb-1">Calories Burned</h4>
          <p className="text-2xl font-bold">{stats.totalCalories || 0} kcal</p>
        </div>
        
        <div className="stat-card bg-purple-50 p-4 rounded-lg shadow-sm">
          <h4 className="text-sm font-semibold text-purple-500 mb-1">Current Streak</h4>
          <p className="text-2xl font-bold">{stats.streak || 0} days</p>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b">
          <nav className="flex -mb-px">
            <button
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'progress'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('progress')}
            >
              Progress
            </button>
            <button
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'records'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('records')}
            >
              Personal Records
            </button>
          </nav>
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="chart-container">
              <h4 className="text-lg font-semibold mb-2">Exercise Types</h4>
              <div className="h-64">
                {Object.keys(stats.exerciseTypes || {}).length > 0 ? (
                  <Pie data={exerciseTypeData} options={{ maintainAspectRatio: false }} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No exercise data available</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="stats-details">
              <h4 className="text-lg font-semibold mb-2">Workout Details</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Avg. Workout Duration</p>
                    <p className="font-semibold">{formatDuration(stats.avgDuration || 0)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Avg. Calories per Workout</p>
                    <p className="font-semibold">
                      {stats.totalWorkouts 
                        ? Math.round(stats.totalCalories / stats.totalWorkouts) 
                        : 0} kcal
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Most Common Workout Type</p>
                    <p className="font-semibold">
                      {Object.entries(stats.exerciseTypes || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Workouts per Week</p>
                    <p className="font-semibold">
                      {stats.totalWorkouts && stats.period === 'week' 
                        ? stats.totalWorkouts 
                        : stats.period === 'month' 
                          ? (stats.totalWorkouts / 4).toFixed(1) 
                          : (stats.totalWorkouts / 52).toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>
              
              {stats.streak > 0 && (
                <div className="mt-4 bg-purple-50 p-4 rounded-lg">
                  <p className="font-semibold text-purple-700">
                    🔥 You're on a {stats.streak} day streak! Keep it up!
                  </p>
                </div>
              )}
              
              {/* Workout Type Breakdown */}
              <div className="mt-4">
                <h4 className="text-md font-semibold mb-2">Workout Type Breakdown</h4>
                <div className="space-y-2">
                  {Object.entries(stats.workoutsByType || {}).map(([type, data]) => (
                    <div key={type} className="bg-gray-50 p-3 rounded">
                      <div className="flex justify-between items-center">
                        <span className="font-medium capitalize">{type}</span>
                        <span className="text-sm text-gray-500">{data.count} workouts</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="mr-3">Duration: {formatDuration(data.totalDuration)}</span>
                        <span>Calories: {data.totalCalories} kcal</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold mb-2">Calories Burned Over Time</h4>
              <div className="h-64">
                {stats.caloriesByDay?.length > 0 ? (
                  <Line 
                    data={caloriesChartData} 
                    options={{ 
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Calories'
                          }
                        },
                        x: {
                          title: {
                            display: true,
                            text: 'Date'
                          }
                        }
                      }
                    }} 
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No calorie data available</p>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-2">Workout Duration Over Time</h4>
              <div className="h-64">
                {stats.durationByDay?.length > 0 ? (
                  <Line 
                    data={durationChartData} 
                    options={{ 
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Minutes'
                          }
                        },
                        x: {
                          title: {
                            display: true,
                            text: 'Date'
                          }
                        }
                      }
                    }} 
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No duration data available</p>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-2">Strength Progress</h4>
              <div className="h-64">
                {Object.keys(stats.progressByExercise || {}).length > 0 ? (
                  <Bar 
                    data={strengthProgressData} 
                    options={{ 
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Weight'
                          }
                        }
                      }
                    }} 
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No strength progress data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Personal Records Tab */}
        {activeTab === 'records' && (
          <div>
            <h4 className="text-lg font-semibold mb-2">Personal Records</h4>
            
            {stats.personalRecords?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Exercise
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Weight
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reps
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sets
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats.personalRecords.map((record, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {record.exerciseName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.weight} kg
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.reps}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.sets}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-gray-50 p-8 rounded-lg text-center">
                <p className="text-gray-500">No personal records available yet. Mark your best lifts as personal records when logging workouts!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutStats; 