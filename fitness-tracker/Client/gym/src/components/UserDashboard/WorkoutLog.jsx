// src/components/UserDashboard/WorkoutLog.jsx
import React, { useContext, useEffect, useState } from 'react';
import API, { getAssignedWorkouts, markAssignedWorkoutCompleted } from '../../api';
import { AuthContext } from '../../context/AuthContext';
import '../../styles/WorkoutLog.css';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { FaLock, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import useMembershipAccess from '../../hooks/useMembershipAccess';
import MembershipAccessError from '../common/MembershipAccessError';
import { useLocation } from 'react-router-dom';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const WorkoutLog = () => {
    const { user, membership } = useContext(AuthContext);
    const { hasWorkoutAccess } = useMembershipAccess();
    const location = useLocation();
    const isEliteMember = membership?.status === 'Active' && membership.planType === 'Elite';
    const [logs, setLogs] = useState([]);
    const [assignedWorkouts, setAssignedWorkouts] = useState([]);
    const [newLog, setNewLog] = useState({
        title: 'Workout Session',
        exercises: [{ name: '', setsCompleted: '', repsCompleted: '', weight: '', restTime: 60 }],
        caloriesBurned: '',
        workoutType: 'Strength Training',
    });
    const [suggestions, setSuggestions] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [editingLog, setEditingLog] = useState(null);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [analyticsData, setAnalyticsData] = useState({
        strength: [],
        calories: [],
        duration: []
    });
    const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'create');
    const [endpointNotAvailable, setEndpointNotAvailable] = useState(false);
    const [membershipError, setMembershipError] = useState(null);

    // Workout types
    const workoutTypes = [
        'Strength Training',
        'Cardiovascular (Cardio)',
        'Endurance',
        'Flexibility & Mobility',
        'Body Transformation & Fat Loss'
    ];

    // Predefined workout plans
    const predefinedWorkouts = [
        {
            title: 'Beginner Strength Training',
            category: 'Strength Training',
            exercises: [
                { name: 'Bench Press', sets: 3, reps: 10, weight: 45, restTime: 60 },
                { name: 'Squat', sets: 3, reps: 10, weight: 45, restTime: 90 },
                { name: 'Deadlift', sets: 3, reps: 8, weight: 65, restTime: 120 }
            ],
            estimatedCalories: 250
        },
        {
            title: 'HIIT Cardio',
            category: 'Cardiovascular (Cardio)',
            exercises: [
                { name: 'Jumping Jacks', sets: 3, reps: 30, weight: 0, restTime: 30 },
                { name: 'Burpees', sets: 3, reps: 15, weight: 0, restTime: 30 },
                { name: 'Mountain Climbers', sets: 3, reps: 20, weight: 0, restTime: 30 }
            ],
            estimatedCalories: 350
        },
        {
            title: 'Yoga Flow',
            category: 'Flexibility & Mobility',
            exercises: [
                { name: 'Downward Dog', sets: 1, reps: 5, weight: 0, restTime: 10 },
                { name: 'Warrior Pose', sets: 1, reps: 5, weight: 0, restTime: 10 },
                { name: 'Child\'s Pose', sets: 1, reps: 5, weight: 0, restTime: 10 }
            ],
            estimatedCalories: 150
        },
        {
            title: 'Endurance Run',
            category: 'Endurance',
            exercises: [
                { name: 'Jogging', sets: 1, reps: 1, weight: 0, restTime: 0, duration: 30 }
            ],
            estimatedCalories: 300
        },
        {
            title: 'Fat Loss Circuit',
            category: 'Body Transformation & Fat Loss',
            exercises: [
                { name: 'Push-Ups', sets: 3, reps: 15, weight: 0, restTime: 30 },
                { name: 'Lunges', sets: 3, reps: 12, weight: 0, restTime: 30 },
                { name: 'Plank', sets: 3, reps: 1, weight: 0, restTime: 30, duration: 30 }
            ],
            estimatedCalories: 400
        }
    ];

    const exerciseList = [
        'Bench Press', 'Squat', 'Deadlift', 'Pull-Up', 'Push-Up', 'Lunges',
        'Jumping Jacks', 'Burpees', 'Mountain Climbers', 'Plank', 'Crunches',
        'Jogging', 'Cycling', 'Swimming', 'Rowing', 'Elliptical',
        'Downward Dog', 'Warrior Pose', 'Child\'s Pose', 'Cobra Pose'
    ];

    useEffect(() => {
        fetchLogs();
        if (isEliteMember && !endpointNotAvailable) {
            fetchAssignedWorkouts();
        }
    }, [user, endpointNotAvailable]);

    useEffect(() => {
        if (logs.length > 0) {
            generateAnalyticsData();
        }
    }, [logs]);

    useEffect(() => {
        if (!hasWorkoutAccess() && activeTab !== 'assigned') {
            setMembershipError({
                message: 'You need a Basic, Premium, or Elite membership to access workout tracking.',
                requiredPlans: ['Basic', 'Premium', 'Elite'],
                currentPlan: membership?.planType || 'None',
                isMembershipError: true
            });
        } else if (activeTab === 'assigned' && (!membership || membership.planType !== 'Elite')) {
            setMembershipError({
                message: 'You need an Elite membership to access trainer-assigned workouts.',
                requiredPlans: ['Elite'],
                currentPlan: membership?.planType || 'None',
                isMembershipError: true
            });
        } else {
            setMembershipError(null);
        }
    }, [hasWorkoutAccess, activeTab, membership?.planType]);

    // Fetch assigned workouts when the component mounts or when the user changes
    useEffect(() => {
        if (activeTab === 'assigned' && membership?.planType === 'Elite') {
            fetchAssignedWorkouts();
        }
    }, [user, activeTab, membership?.planType]);

    const fetchLogs = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Ensure we have a valid user ID
            if (!user.id) {
                console.error('User ID is missing in fetchLogs');
                setError('User ID is missing. Please log in again.');
                setLoading(false);
                return;
            }

            console.log('Fetching logs for user ID:', user.id);
            const response = await API.get(`/workout-logs/user/${user.id}`);
            
            // Handle the new response format
            if (response.data && response.data.workoutLogs && Array.isArray(response.data.workoutLogs)) {
                // New format: { workoutLogs: [...], pagination: {...} }
                setLogs(response.data.workoutLogs);
            } else if (Array.isArray(response.data)) {
                // Old format: direct array
                setLogs(response.data);
            } else if (response.data && response.data.logs && Array.isArray(response.data.logs)) {
                // Alternative format: { logs: [...] }
                setLogs(response.data.logs);
            } else {
                // If the API returns something unexpected, set to empty array
                console.warn('Unexpected response format for logs:', response.data);
                setLogs([]);
            }
            setError(null);
        } catch (err) {
            setError('Failed to fetch workout logs: ' + (err.response?.data?.message || err.message));
            console.error('Fetch Error:', err);
            if (err.response) {
                console.error('Error response status:', err.response.status);
                console.error('Error response data:', err.response.data);
            }
            setLogs([]); // Set to empty array on error
        } finally {
            setLoading(false);
        }
    };

    const fetchAssignedWorkouts = async () => {
        try {
            setLoading(true);
            const response = await getAssignedWorkouts();
            setAssignedWorkouts(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching assigned workouts:', err);
            // If the endpoint is not available, use sample data
            if (err.response && err.response.status === 404) {
                setEndpointNotAvailable(true);
                // Sample assigned workouts data
                const sampleAssignedWorkouts = [
                    {
                        _id: '1',
                        title: 'Upper Body Strength',
                        trainer: 'John Smith',
                        status: 'Pending',
                        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days from now
                        exercises: [
                            { name: 'Bench Press', sets: 3, reps: 10, weight: 135 },
                            { name: 'Pull-ups', sets: 3, reps: 8, weight: 0 },
                            { name: 'Shoulder Press', sets: 3, reps: 12, weight: 45 }
                        ],
                        notes: 'Focus on form rather than weight. Rest 60 seconds between sets.'
                    },
                    {
                        _id: '2',
                        title: 'Core Workout',
                        trainer: 'Sarah Johnson',
                        status: 'Completed',
                        completedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
                        exercises: [
                            { name: 'Plank', sets: 3, reps: 1, weight: 0, notes: 'Hold for 60 seconds' },
                            { name: 'Russian Twists', sets: 3, reps: 20, weight: 10 },
                            { name: 'Leg Raises', sets: 3, reps: 15, weight: 0 }
                        ],
                        notes: 'Complete this circuit with minimal rest between exercises.'
                    }
                ];
                setAssignedWorkouts(sampleAssignedWorkouts);
            } else {
                setError('Failed to load assigned workouts. Please try again later.');
            }
            setLoading(false);
        }
    };

    const generateAnalyticsData = () => {
        // Sort logs by date
        const sortedLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Prepare data for charts
        const strengthData = sortedLogs.map(log => {
            // Calculate average weight lifted across all exercises
            const totalWeight = log.exercises.reduce((sum, ex) => sum + (Number(ex.weight) || 0), 0);
            const avgWeight = log.exercises.length > 0 ? totalWeight / log.exercises.length : 0;
            return {
                date: new Date(log.date).toLocaleDateString(),
                value: avgWeight
            };
        });
        
        const caloriesData = sortedLogs.map(log => ({
            date: new Date(log.date).toLocaleDateString(),
            value: log.caloriesBurned || 0
        }));
        
        const durationData = sortedLogs.map(log => ({
            date: new Date(log.date).toLocaleDateString(),
            value: log.duration || 0
        }));
        
        setAnalyticsData({
            strength: strengthData,
            calories: caloriesData,
            duration: durationData
        });
    };

    const handleExerciseChange = (index, e) => {
        const { name, value } = e.target;
        const updatedExercises = [...newLog.exercises];
        updatedExercises[index][name] = value;

        if (name === 'name' && value.length > 0) {
            const filteredSuggestions = exerciseList.filter(ex =>
                ex.toLowerCase().startsWith(value.toLowerCase())
            );
            setSuggestions(filteredSuggestions);
        } else {
            setSuggestions([]);
        }

        setNewLog({ ...newLog, exercises: updatedExercises });
    };

    const handleSuggestionClick = (index, suggestion) => {
        const updatedExercises = [...newLog.exercises];
        updatedExercises[index].name = suggestion;
        setNewLog({ ...newLog, exercises: updatedExercises });
        setSuggestions([]);
    };

    const addExercise = () => {
        setNewLog({
            ...newLog,
            exercises: [...newLog.exercises, { name: '', setsCompleted: '', repsCompleted: '', weight: '', restTime: 60 }],
        });
    };

    const removeExercise = (index) => {
        const updatedExercises = newLog.exercises.filter((_, i) => i !== index);
        if (updatedExercises.length === 0) {
            updatedExercises.push({ name: '', setsCompleted: '', repsCompleted: '', weight: '', restTime: 60 });
        }
        setNewLog({ ...newLog, exercises: updatedExercises });
        setSuggestions([]);
    };

    const handleLogSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Ensure we have a valid user ID
            if (!user || !user.id) {
                setError('User ID is missing. Please log in again.');
                setLoading(false);
                return;
            }

            // Validate exercises
            const validExercises = newLog.exercises.filter(ex => ex.name.trim() !== '');
            if (validExercises.length === 0) {
                setError('Please add at least one exercise with a name.');
                setLoading(false);
                return;
            }

            // Use a minimal payload that should work with the server's validation
            const minimalPayload = {
                userId: user.id,
                exercises: validExercises.map(ex => ({
                    name: ex.name.trim(),
                    setsCompleted: Number(ex.setsCompleted) || 0,
                    repsCompleted: Number(ex.repsCompleted) || 0,
                    weight: Number(ex.weight) || 0
                })),
                caloriesBurned: Number(newLog.caloriesBurned) || 0
            };
            
            console.log('Submitting minimal payload:', minimalPayload);

            let response;
            if (editingLog) {
                response = await API.put(`/workout-logs/${editingLog._id}`, minimalPayload);
                console.log('Update response:', response.data);
                setEditingLog(null);
            } else {
                response = await API.post('/workout-logs', minimalPayload);
                console.log('Create response:', response.data);
            }
            
            await fetchLogs();
            
            setNewLog({
                title: 'Workout Session',
                exercises: [{ name: '', setsCompleted: '', repsCompleted: '', weight: '', restTime: 60 }],
                caloriesBurned: '',
                workoutType: 'Strength Training',
            });
            setError(null);
        } catch (err) {
            setError('Failed to submit workout log: ' + (err.response?.data?.error || err.response?.data?.message || err.message));
            console.error('Submit Error:', err);
            // Log more detailed error information
            if (err.response) {
                console.error('Error response status:', err.response.status);
                console.error('Error response data:', err.response.data);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteLog = async (logId) => {
        if (!window.confirm('Are you sure you want to delete this workout log?')) return;
        
        setLoading(true);
        try {
            await API.delete(`/workout-logs/${logId}`);
            await fetchLogs();
        } catch (err) {
            setError('Failed to delete workout log: ' + err.message);
            console.error('Delete Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEditLog = (log) => {
        setEditingLog(log);
        setNewLog({
            title: log.title || 'Workout Session',
            exercises: log.exercises.map(ex => ({
                name: ex.name,
                setsCompleted: ex.setsCompleted,
                repsCompleted: ex.repsCompleted,
                weight: ex.weight,
                restTime: ex.restTime || 60,
            })),
            caloriesBurned: log.caloriesBurned,
            workoutType: log.workoutType || 'Strength Training',
        });
        setActiveTab('create');
        window.scrollTo(0, 0);
    };

    const handlePredefinedWorkout = (workout) => {
        setNewLog({
            title: workout.title,
            exercises: workout.exercises.map(ex => ({
                name: ex.name,
                setsCompleted: ex.sets,
                repsCompleted: ex.reps,
                weight: ex.weight,
                restTime: ex.restTime,
            })),
            caloriesBurned: workout.estimatedCalories,
            workoutType: workout.category,
        });
        setActiveTab('create');
        window.scrollTo(0, 0);
    };

    // Function to mark an assigned workout as completed
    const markWorkoutAsCompleted = async (workoutId) => {
        if (!hasWorkoutAccess()) {
            setMembershipError({
                message: 'You need a Basic, Premium, or Elite membership to track workouts.',
                requiredPlans: ['Basic', 'Premium', 'Elite'],
                currentPlan: membership?.planType || 'None',
                isMembershipError: true
            });
            return;
        }
        
        try {
            await markAssignedWorkoutCompleted(workoutId);
            // Update the local state
            setAssignedWorkouts(prevWorkouts => 
                prevWorkouts.map(workout => 
                    workout._id === workoutId 
                        ? { 
                            ...workout, 
                            status: 'Completed',
                            completedDate: new Date().toISOString() 
                        } 
                        : workout
                )
            );
        } catch (err) {
            console.error('Error marking workout as completed:', err);
            // If the endpoint is not available, just update the UI
            if (err.response && err.response.status === 404) {
                setAssignedWorkouts(prevWorkouts => 
                    prevWorkouts.map(workout => 
                        workout._id === workoutId 
                            ? { 
                                ...workout, 
                                status: 'Completed',
                                completedDate: new Date().toISOString() 
                            } 
                            : workout
                    )
                );
            } else {
                setError('Failed to mark workout as completed. Please try again.');
            }
        }
    };

    const startAssignedWorkout = (workout) => {
        // Check if user has workout access before starting
        if (!hasWorkoutAccess()) {
            setMembershipError({
                message: 'You need a Basic, Premium, or Elite membership to start this workout.',
                requiredPlans: ['Basic', 'Premium', 'Elite'],
                currentPlan: membership?.planType || 'None',
                isMembershipError: true
            });
            return;
        }

        // Convert assigned workout to log format
        const newWorkoutLog = {
            title: `${workout.title} (Assigned)`,
            exercises: workout.exercises.map(ex => ({
                name: ex.name,
                setsCompleted: ex.sets,
                repsCompleted: ex.reps,
                weight: ex.weight,
                restTime: ex.restTime
            })),
            caloriesBurned: '',
            workoutType: 'Assigned Workout',
            assignedWorkoutId: workout._id
        };
        
        setNewLog(newWorkoutLog);
        setActiveTab('create');
    };

    const renderAnalytics = () => {
        if (logs.length === 0) {
            return <p>No workout data available for analytics. Start logging your workouts!</p>;
        }

        // Ensure we have data for charts
        if (analyticsData.strength.length === 0 || 
            analyticsData.calories.length === 0 || 
            analyticsData.duration.length === 0) {
            return <p>Collecting data for analytics. Log more workouts to see detailed charts.</p>;
        }

        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: {
                            size: 12
                        }
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 11
                        },
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        };

        return (
            <div className="analytics-container">
                <div className="chart-container">
                    <h4>Strength Progress (Average Weight)</h4>
                    {analyticsData.strength.length > 1 ? (
                        <Line 
                            data={{
                                labels: analyticsData.strength.map(item => item.date),
                                datasets: [{
                                    label: 'Average Weight (kg)',
                                    data: analyticsData.strength.map(item => item.value),
                                    borderColor: 'rgb(75, 192, 192)',
                                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                                    tension: 0.1
                                }]
                            }}
                            options={chartOptions}
                            height={300}
                        />
                    ) : (
                        <p>Need more workout data to generate this chart.</p>
                    )}
                </div>
                
                <div className="chart-container">
                    <h4>Calories Burned</h4>
                    {analyticsData.calories.length > 1 ? (
                        <Bar
                            data={{
                                labels: analyticsData.calories.map(item => item.date),
                                datasets: [{
                                    label: 'Calories',
                                    data: analyticsData.calories.map(item => item.value),
                                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                                    borderColor: 'rgb(255, 99, 132)',
                                    borderWidth: 1
                                }]
                            }}
                            options={chartOptions}
                            height={300}
                        />
                    ) : (
                        <p>Need more workout data to generate this chart.</p>
                    )}
                </div>
                
                <div className="chart-container">
                    <h4>Workout Duration</h4>
                    {analyticsData.duration.length > 1 ? (
                        <Line
                            data={{
                                labels: analyticsData.duration.map(item => item.date),
                                datasets: [{
                                    label: 'Duration (minutes)',
                                    data: analyticsData.duration.map(item => item.value),
                                    borderColor: 'rgb(53, 162, 235)',
                                    backgroundColor: 'rgba(53, 162, 235, 0.5)',
                                    tension: 0.1
                                }]
                            }}
                            options={chartOptions}
                            height={300}
                        />
                    ) : (
                        <p>Need more workout data to generate this chart.</p>
                    )}
                </div>
            </div>
        );
    };

    // Render assigned workouts section
    const renderAssignedWorkouts = () => {
        if (assignedWorkouts.length === 0) {
            return <p className="no-data-message">No assigned workouts available.</p>;
        }
        
        return (
            <div className="assigned-workouts-list">
                {assignedWorkouts.map(workout => (
                    <div key={workout._id} className={`assigned-workout-card ${workout.status.toLowerCase()}`}>
                        <div className="assigned-workout-header">
                            <h3>{workout.title}</h3>
                            <div className="status-badge">
                                {workout.status === 'Pending' ? (
                                    <FaExclamationCircle className="pending-icon" />
                                ) : (
                                    <FaCheckCircle className="completed-icon" />
                                )}
                                <span>{workout.status}</span>
                            </div>
                        </div>
                        
                        <div className="assigned-workout-trainer">
                            <span>Assigned by: {workout.trainer}</span>
                        </div>
                        
                        {workout.status === 'Pending' && workout.dueDate && (
                            <div className="assigned-workout-due-date">
                                <span>Due by: {new Date(workout.dueDate).toLocaleDateString()}</span>
                            </div>
                        )}
                        
                        {workout.status === 'Completed' && workout.completedDate && (
                            <div className="assigned-workout-completed-date">
                                <span>Completed on: {new Date(workout.completedDate).toLocaleDateString()}</span>
                            </div>
                        )}
                        
                        <div className="assigned-workout-exercises">
                            <h4>Exercises:</h4>
                            <ul>
                                {workout.exercises.map((exercise, index) => (
                                    <li key={index}>
                                        <strong>{exercise.name}</strong>: {exercise.sets} sets × {exercise.reps} reps
                                        {exercise.weight > 0 ? ` @ ${exercise.weight} lbs` : ''}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        {workout.notes && (
                            <div className="assigned-workout-notes">
                                <h4>Trainer Notes:</h4>
                                <p>{workout.notes}</p>
                            </div>
                        )}
                        
                        <div className="assigned-workout-actions">
                            {workout.status === 'Pending' && (
                                <>
                                    <button 
                                        className="start-workout-btn"
                                        onClick={() => startAssignedWorkout(workout)}
                                    >
                                        Start Workout
                                    </button>
                                    <button 
                                        className="mark-completed-btn"
                                        onClick={() => markWorkoutAsCompleted(workout._id)}
                                    >
                                        Mark as Completed
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // If there's a membership error, show the error component
    if (membershipError) {
        return (
            <MembershipAccessError 
                error={membershipError}
                featureName="workout tracking"
                onBack={() => setMembershipError(null)}
            />
        );
    }

    return (
        <div className="workout-log-container">
            <div className="workout-log-header">
                <h1>Workout Log</h1>
                <div className="workout-tabs">
                    <button 
                        className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
                        onClick={() => setActiveTab('create')}
                    >
                        Log Workout
                    </button>
                    <button 
                        className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab('history');
                            setShowAnalytics(false);
                        }}
                    >
                        History
                    </button>
                    <button 
                        className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab('analytics');
                            setShowAnalytics(true);
                            generateAnalyticsData();
                        }}
                    >
                        Analytics
                    </button>
                    <button 
                        className={`tab-button ${activeTab === 'assigned' ? 'active' : ''}`}
                        onClick={() => setActiveTab('assigned')}
                    >
                        Assigned Workouts
                    </button>
                </div>
            </div>

            {activeTab === 'create' && (
                <div className="workout-log-container">
                    <h2>Workout Plans & Logs</h2>
                    {loading && <p>Loading...</p>}
                    {error && <p style={{ color: 'red' }}>{error}</p>}

                    {/* Navigation Tabs - Removing duplicate tabs */}
                    <div className="workout-tabs">
                        <button 
                            className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
                            onClick={() => setActiveTab('create')}
                        >
                            {editingLog ? 'Edit Workout' : 'Create Workout'}
                        </button>
                        <button 
                            className={`tab-button ${activeTab === 'predefined' ? 'active' : ''}`}
                            onClick={() => setActiveTab('predefined')}
                        >
                            Predefined Workouts
                        </button>
                    </div>

                    {/* Create/Edit Workout Form */}
                    <div className="tab-content">
                        <h3>{editingLog ? 'Edit Workout' : 'Create Custom Workout'}</h3>
                        <form onSubmit={handleLogSubmit} className="workout-form">
                            <div className="form-group">
                                <label htmlFor="workout-title">Workout Title:</label>
                                <input
                                    id="workout-title"
                                    type="text"
                                    value={newLog.title}
                                    onChange={(e) => setNewLog({ ...newLog, title: e.target.value })}
                                    placeholder="Workout Title"
                                    required
                                    disabled={loading}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="workout-type">Workout Type:</label>
                                <select
                                    id="workout-type"
                                    value={newLog.workoutType}
                                    onChange={(e) => setNewLog({ ...newLog, workoutType: e.target.value })}
                                    disabled={loading}
                                >
                                    {workoutTypes.map((type, index) => (
                                        <option key={index} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <h4>Exercises</h4>
                            {newLog.exercises.map((exercise, index) => (
                                <div key={index} className="exercise-input">
                                    <input
                                        type="text"
                                        name="name"
                                        value={exercise.name}
                                        onChange={(e) => handleExerciseChange(index, e)}
                                        placeholder="Exercise Name"
                                        required
                                        disabled={loading}
                                    />
                                    {exercise.name && suggestions.length > 0 && (
                                        <ul className="suggestions">
                                            {suggestions.map((suggestion, i) => (
                                                <li
                                                    key={i}
                                                    onClick={() => handleSuggestionClick(index, suggestion)}
                                                >
                                                    {suggestion}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    <input
                                        type="number"
                                        name="setsCompleted"
                                        value={exercise.setsCompleted}
                                        onChange={(e) => handleExerciseChange(index, e)}
                                        placeholder="Sets"
                                        disabled={loading}
                                    />
                                    <input
                                        type="number"
                                        name="repsCompleted"
                                        value={exercise.repsCompleted}
                                        onChange={(e) => handleExerciseChange(index, e)}
                                        placeholder="Reps"
                                        disabled={loading}
                                    />
                                    <input
                                        type="number"
                                        name="weight"
                                        value={exercise.weight}
                                        onChange={(e) => handleExerciseChange(index, e)}
                                        placeholder="Weight (kg)"
                                        disabled={loading}
                                    />
                                    <input
                                        type="number"
                                        name="restTime"
                                        value={exercise.restTime}
                                        onChange={(e) => handleExerciseChange(index, e)}
                                        placeholder="Rest (sec)"
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        className="remove-btn"
                                        onClick={() => removeExercise(index)}
                                        disabled={loading || newLog.exercises.length === 1}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={addExercise} disabled={loading} className="add-exercise-btn">
                                Add Exercise
                            </button>
                            
                            <div className="form-group">
                                <label htmlFor="calories-burned">Calories Burned:</label>
                                <input
                                    id="calories-burned"
                                    type="number"
                                    value={newLog.caloriesBurned}
                                    onChange={(e) => setNewLog({ ...newLog, caloriesBurned: e.target.value })}
                                    placeholder="Calories Burned"
                                    disabled={loading}
                                    className="calories-input"
                                />
                            </div>
                            
                            <div className="form-actions">
                                <button type="submit" disabled={loading} className="submit-btn">
                                    {loading ? 'Submitting...' : (editingLog ? 'Update Workout' : 'Save Workout')}
                                </button>
                                {editingLog && (
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            setEditingLog(null);
                                            setNewLog({
                                                title: 'Workout Session',
                                                exercises: [{ name: '', setsCompleted: '', repsCompleted: '', weight: '', restTime: 60 }],
                                                caloriesBurned: '',
                                                workoutType: 'Strength Training',
                                            });
                                        }}
                                        className="cancel-btn"
                                    >
                                        Cancel Edit
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {activeTab === 'predefined' && (
                <div className="tab-content">
                    <h3>Predefined Workout Plans</h3>
                    <div className="predefined-workouts">
                        {predefinedWorkouts.map((workout, index) => (
                            <div key={index} className="workout-card">
                                <h4>{workout.title}</h4>
                                <p><strong>Category:</strong> {workout.category}</p>
                                <p><strong>Exercises:</strong> {workout.exercises.length}</p>
                                <div className="exercise-list">
                                    {workout.exercises.map((ex, i) => (
                                        <p key={i} className="exercise-item">
                                            {ex.name}: {ex.sets}x{ex.reps} {ex.weight > 0 ? `(${ex.weight}kg)` : ''}
                                        </p>
                                    ))}
                                </div>
                                <p><strong>Est. Calories:</strong> {workout.estimatedCalories}</p>
                                <button 
                                    onClick={() => handlePredefinedWorkout(workout)}
                                    className="use-workout-btn"
                                >
                                    Use This Workout
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'history' && !showAnalytics && (
                <div className="workout-history">
                    <h3>Your Workout History</h3>
                    {Array.isArray(logs) && logs.length > 0 ? (
                        <div className="workout-history">
                            {logs.map(log => (
                                <div key={log._id} className="workout-log-item">
                                    <div className="log-header">
                                        <h4>{log.title || 'Workout Session'}</h4>
                                        <span className="log-date">{new Date(log.date).toLocaleDateString()}</span>
                                    </div>
                                    <p><strong>Type:</strong> {log.workoutType || 'Not specified'}</p>
                                    <p><strong>Calories Burned:</strong> {log.caloriesBurned}</p>
                                    <div className="log-exercises">
                                        <strong>Exercises:</strong>
                                        <ul>
                                            {Array.isArray(log.exercises) && log.exercises.map((ex, i) => (
                                                <li key={i}>
                                                    {ex.name} ({ex.setsCompleted}x{ex.repsCompleted}, {ex.weight}kg)
                                                    {ex.restTime && ` - Rest: ${ex.restTime}s`}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="log-actions">
                                        <button 
                                            onClick={() => handleEditLog(log)}
                                            className="edit-btn"
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteLog(log._id)}
                                            className="delete-btn"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>No workout logs found. Start logging your workouts!</p>
                    )}
                </div>
            )}

            {activeTab === 'analytics' && showAnalytics && (
                <div className="tab-content">
                    <h3>Performance Analytics</h3>
                    {renderAnalytics()}
                </div>
            )}

            {activeTab === 'assigned' && (
                <div className="assigned-workouts-section">
                    <h2>Trainer-Assigned Workouts</h2>
                    {renderAssignedWorkouts()}
                </div>
            )}
        </div>
    );
};

export default WorkoutLog;