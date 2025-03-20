import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import API from "../../api";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

const PerformanceAnalytics = () => {
  const { trainer } = useAuth();
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [timeRange, setTimeRange] = useState("month"); // week, month, year
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!trainer || (!trainer.id && !trainer._id)) {
      setError("Trainer not authenticated or missing ID");
      setLoading(false);
      return;
    }

    const fetchClients = async () => {
      setLoading(true);
      try {
        const trainerId = trainer.id || trainer._id;
        const response = await API.get(`/trainers/${trainerId}/clients`);
        setClients(response.data);
      } catch (err) {
        setError("Failed to fetch clients: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [trainer]);

  const fetchClientAnalytics = async (clientId) => {
    setLoading(true);
    try {
      // Find the selected client from the clients array
      const client = clients.find(c => c._id === clientId);
      setSelectedClient(client);

      // Try to fetch workouts directly first to ensure we have data
      try {
        console.log("Fetching workouts for client:", clientId);
        const workoutsResponse = await API.get(`/workouts/user/${clientId}`);
        console.log("Client workouts:", workoutsResponse.data);
      } catch (workoutError) {
        console.error("Error fetching workouts:", workoutError);
      }

      // Try to fetch goals directly to ensure we have data
      try {
        console.log("Fetching goals for client:", clientId);
        const goalsResponse = await API.get(`/goals/user/${clientId}`);
        console.log("Client goals:", goalsResponse.data);
      } catch (goalsError) {
        console.error("Error fetching goals:", goalsError);
      }

      // Fetch analytics data for the selected client and time range
      try {
        console.log(`Fetching analytics for client: ${clientId} with timeRange: ${timeRange}`);
        const response = await API.get(`/analytics/client/${clientId}?timeRange=${timeRange}`);
        console.log("Analytics data received:", response.data);
        
        if (response.data && Object.keys(response.data).length > 0) {
          // Ensure all required properties exist with default values if missing
          const processedData = {
            workoutFrequency: response.data.workoutFrequency || {
              'Sunday': 0, 'Monday': 0, 'Tuesday': 0, 'Wednesday': 0, 
              'Thursday': 0, 'Friday': 0, 'Saturday': 0
            },
            workoutDurations: response.data.workoutDurations || [],
            exerciseDistribution: response.data.exerciseDistribution || {},
            goalProgress: response.data.goalProgress || [],
            totalWorkouts: response.data.totalWorkouts || 0,
            averageDuration: response.data.averageDuration || 0,
            totalCaloriesBurned: response.data.totalCaloriesBurned || 0,
            completedGoals: response.data.completedGoals || 0,
            consistency: response.data.consistency || 0
          };
          
          setAnalyticsData(processedData);
          setError(null);
        } else {
          console.warn("Empty analytics data received");
          setError("No analytics data available for this client");
          // Provide fallback empty data structure
          setAnalyticsData({
            workoutFrequency: {
              'Sunday': 0, 'Monday': 0, 'Tuesday': 0, 'Wednesday': 0, 
              'Thursday': 0, 'Friday': 0, 'Saturday': 0
            },
            workoutDurations: [],
            exerciseDistribution: {},
            goalProgress: [],
            totalWorkouts: 0,
            averageDuration: 0,
            totalCaloriesBurned: 0,
            completedGoals: 0,
            consistency: 0
          });
        }
      } catch (analyticsError) {
        console.error("Error fetching analytics data:", analyticsError);
        setError("Failed to fetch analytics data: " + analyticsError.message);
        // Provide fallback empty data structure
        setAnalyticsData({
          workoutFrequency: {
            'Sunday': 0, 'Monday': 0, 'Tuesday': 0, 'Wednesday': 0, 
            'Thursday': 0, 'Friday': 0, 'Saturday': 0
          },
          workoutDurations: [],
          exerciseDistribution: {},
          goalProgress: [],
          totalWorkouts: 0,
          averageDuration: 0,
          totalCaloriesBurned: 0,
          completedGoals: 0,
          consistency: 0
        });
      }
    } catch (err) {
      console.error("Error in fetchClientAnalytics:", err);
      setError("Failed to process client data: " + err.message);
      setAnalyticsData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = (clientId) => {
    fetchClientAnalytics(clientId);
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    if (selectedClient) {
      fetchClientAnalytics(selectedClient._id);
    }
  };

  // Prepare workout frequency chart data
  const prepareWorkoutFrequencyData = () => {
    if (!analyticsData || !analyticsData.workoutFrequency) {
      return {
        labels: [],
        datasets: [
          {
            label: 'Workouts',
            data: [],
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
          }
        ]
      };
    }

    const { workoutFrequency } = analyticsData;
    
    return {
      labels: Object.keys(workoutFrequency),
      datasets: [
        {
          label: 'Workouts',
          data: Object.values(workoutFrequency),
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
        }
      ]
    };
  };

  // Prepare workout duration chart data
  const prepareWorkoutDurationData = () => {
    if (!analyticsData || !analyticsData.workoutDurations || analyticsData.workoutDurations.length === 0) {
      return {
        labels: [],
        datasets: [
          {
            label: 'Duration (minutes)',
            data: [],
            borderColor: 'rgb(255, 99, 132)',
            tension: 0.1
          }
        ]
      };
    }

    // Sort by date
    const sortedData = [...analyticsData.workoutDurations].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return {
      labels: sortedData.map(item => new Date(item.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Duration (minutes)',
          data: sortedData.map(item => item.duration),
          borderColor: 'rgb(255, 99, 132)',
          tension: 0.1
        }
      ]
    };
  };

  // Prepare exercise distribution chart data
  const prepareExerciseDistributionData = () => {
    if (!analyticsData || !analyticsData.exerciseDistribution) {
      return {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: [
              'rgba(255, 99, 132, 0.5)',
              'rgba(54, 162, 235, 0.5)',
              'rgba(255, 206, 86, 0.5)',
              'rgba(75, 192, 192, 0.5)',
              'rgba(153, 102, 255, 0.5)',
            ],
          }
        ]
      };
    }

    const { exerciseDistribution } = analyticsData;
    
    return {
      labels: Object.keys(exerciseDistribution),
      datasets: [
        {
          data: Object.values(exerciseDistribution),
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)',
            'rgba(255, 159, 64, 0.5)',
            'rgba(199, 199, 199, 0.5)',
            'rgba(83, 102, 255, 0.5)',
            'rgba(78, 252, 152, 0.5)',
            'rgba(255, 99, 255, 0.5)',
          ],
        }
      ]
    };
  };

  // Prepare goal progress chart data
  const prepareGoalProgressData = () => {
    if (!analyticsData || !analyticsData.goalProgress || analyticsData.goalProgress.length === 0) {
      return {
        labels: [],
        datasets: [
          {
            label: 'Current',
            data: [],
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
          },
          {
            label: 'Target',
            data: [],
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
          }
        ]
      };
    }

    const { goalProgress } = analyticsData;
    
    return {
      labels: goalProgress.map(goal => goal.title),
      datasets: [
        {
          label: 'Current',
          data: goalProgress.map(goal => goal.currentValue),
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
        },
        {
          label: 'Target',
          data: goalProgress.map(goal => goal.targetValue),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        }
      ]
    };
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="performance-analytics-container">
      <h2>Performance Analytics</h2>

      <div className="client-selection">
        <h3>Select Client</h3>
        {clients.length > 0 ? (
          <div className="client-list">
            {clients.map((client) => (
              <div 
                key={client._id} 
                className={`client-item ${selectedClient && selectedClient._id === client._id ? 'selected' : ''}`}
                onClick={() => handleClientSelect(client._id)}
              >
                <h4>{client.name}</h4>
                <p>{client.email}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No clients assigned yet.</p>
        )}
      </div>

      {selectedClient && (
        <div className="analytics-dashboard">
          <div className="dashboard-header">
            <h3>Analytics for {selectedClient.name}</h3>
            <div className="time-range-selector">
              <button 
                className={timeRange === "week" ? "active" : ""}
                onClick={() => handleTimeRangeChange("week")}
              >
                Week
              </button>
              <button 
                className={timeRange === "month" ? "active" : ""}
                onClick={() => handleTimeRangeChange("month")}
              >
                Month
              </button>
              <button 
                className={timeRange === "year" ? "active" : ""}
                onClick={() => handleTimeRangeChange("year")}
              >
                Year
              </button>
            </div>
          </div>

          {analyticsData ? (
            <div className="analytics-grid">
              <div className="analytics-card">
                <h4>Workout Frequency</h4>
                <div className="chart-container">
                  <Bar data={prepareWorkoutFrequencyData()} />
                </div>
              </div>

              <div className="analytics-card">
                <h4>Workout Duration</h4>
                <div className="chart-container">
                  <Line data={prepareWorkoutDurationData()} />
                </div>
              </div>

              <div className="analytics-card">
                <h4>Exercise Distribution</h4>
                <div className="chart-container">
                  <Pie data={prepareExerciseDistributionData()} />
                </div>
              </div>

              <div className="analytics-card">
                <h4>Goal Progress</h4>
                <div className="chart-container">
                  <Bar data={prepareGoalProgressData()} />
                </div>
              </div>

              <div className="analytics-card full-width">
                <h4>Performance Summary</h4>
                <div className="summary-stats">
                  <div className="stat-item">
                    <h5>Total Workouts</h5>
                    <p className="stat-value">{analyticsData.totalWorkouts || 0}</p>
                  </div>
                  <div className="stat-item">
                    <h5>Avg. Duration</h5>
                    <p className="stat-value">{analyticsData.averageDuration || 0} min</p>
                  </div>
                  <div className="stat-item">
                    <h5>Calories Burned</h5>
                    <p className="stat-value">{analyticsData.totalCaloriesBurned || 0}</p>
                  </div>
                  <div className="stat-item">
                    <h5>Completed Goals</h5>
                    <p className="stat-value">{analyticsData.completedGoals || 0}</p>
                  </div>
                  <div className="stat-item">
                    <h5>Consistency</h5>
                    <p className="stat-value">{analyticsData.consistency || 0}%</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p>No analytics data available for this client.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PerformanceAnalytics; 