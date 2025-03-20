// src/components/UserDashboard/UserGoalForm.jsx
import React, { useContext, useEffect, useState } from 'react';
import API from '../../api';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
// import '../../styles/UserGoalForm.css'; // Add styling

const UserGoalForm = ({ viewOnly = false }) => {
    const { user } = useContext(AuthContext);
    const [goals, setGoals] = useState([]);
    const [pastGoals, setPastGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newGoal, setNewGoal] = useState({
        goalType: 'weight loss',
        currentValue: '',
        targetValue: '',
        deadline: '',
        notes: '',
        milestones: [],
    });
    const [newMilestone, setNewMilestone] = useState({ title: '', targetValue: '' });
    const [editingGoal, setEditingGoal] = useState(null);
    const [progressUpdate, setProgressUpdate] = useState({ currentValue: '', milestoneId: '' });
    const [linkedWorkout, setLinkedWorkout] = useState('');
    const [workoutPrograms, setWorkoutPrograms] = useState([]);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Try multiple endpoints for goals to handle potential API changes
                let activeGoals = [];
                let allGoals = [];
                
                try {
                    // First try the original endpoint
                    const activeGoalsRes = await API.get(`/goals/${user.id}?status=active`);
                    activeGoals = activeGoalsRes.data.goals || [];
                } catch (activeError) {
                    console.error('Error fetching active goals from first endpoint:', activeError);
                    
                    // Try alternative endpoint
                    try {
                        const altActiveGoalsRes = await API.get(`/goals/user/${user.id}?status=active`);
                        activeGoals = altActiveGoalsRes.data.goals || [];
                    } catch (altActiveError) {
                        console.error('Error fetching active goals from alternative endpoint:', altActiveError);
                        // If both fail, set empty array
                        activeGoals = [];
                    }
                }
                
                try {
                    // First try the original endpoint
                    const allGoalsRes = await API.get(`/goals/all/${user.id}`);
                    allGoals = allGoalsRes.data.goals || [];
                } catch (allError) {
                    console.error('Error fetching all goals from first endpoint:', allError);
                    
                    // Try alternative endpoint
                    try {
                        const altAllGoalsRes = await API.get(`/goals/user/${user.id}`);
                        allGoals = altAllGoalsRes.data.goals || [];
                    } catch (altAllError) {
                        console.error('Error fetching all goals from alternative endpoint:', altAllError);
                        // If both fail, set empty array
                        allGoals = [];
                    }
                }
                
                // Try to fetch workout programs
                try {
                    const workoutsRes = await API.get(`/workout-programs/${user.id}`);
                    setWorkoutPrograms(workoutsRes.data || []);
                } catch (workoutError) {
                    console.error('Error fetching workout programs:', workoutError);
                    setWorkoutPrograms([]);
                }
                
                setGoals(activeGoals);
                setPastGoals(allGoals.filter(g => g && g.status !== 'active'));
            } catch (error) {
                console.error('Failed to fetch goals or workouts:', error);
                setError('Failed to fetch goals or workouts.');
                // Set empty arrays to prevent null reference errors
                setGoals([]);
                setPastGoals([]);
                setWorkoutPrograms([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewGoal({ ...newGoal, [name]: value });
    };

    const addMilestone = () => {
        if (newMilestone.title && newMilestone.targetValue) {
            setNewGoal({
                ...newGoal,
                milestones: [...newGoal.milestones, { ...newMilestone }],
            });
            setNewMilestone({ title: '', targetValue: '' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await API.post('/goals', newGoal);
            setGoals([...goals, response.data.goal]);
            setNewGoal({ goalType: 'weight loss', currentValue: '', targetValue: '', deadline: '', notes: '', milestones: [] });
        } catch (error) {
            setError('Failed to set goal.');
        }
    };

    const handleEdit = (goal) => {
        setEditingGoal(goal);
        setNewGoal({ ...goal, deadline: goal.deadline.slice(0, 10) }); // Format for input
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await API.put(`/goals/${editingGoal._id}`, newGoal);
            setGoals(goals.map(g => g._id === editingGoal._id ? response.data.goal : g));
            setEditingGoal(null);
            setNewGoal({ goalType: 'weight loss', currentValue: '', targetValue: '', deadline: '', notes: '', milestones: [] });
        } catch (error) {
            setError('Failed to update goal.');
        }
    };

    const handleDelete = async (goalId) => {
        try {
            await API.delete(`/goals/${goalId}`);
            setGoals(goals.filter(g => g._id !== goalId));
        } catch (error) {
            setError('Failed to delete goal.');
        }
    };

    const handleProgressUpdate = async (goalId) => {
        try {
            const response = await API.put(`/goals/progress/${goalId}`, progressUpdate);
            setGoals(goals.map(g => g._id === goalId ? response.data.goal : g));
            setProgressUpdate({ currentValue: '', milestoneId: '' });
        } catch (error) {
            setError('Failed to update progress.');
        }
    };

    const handleLinkWorkout = async (goalId) => {
        try {
            const response = await API.post('/goals/link-workout', { goalId, workoutId: linkedWorkout });
            setGoals(goals.map(g => g._id === goalId ? response.data.goal : g));
            setLinkedWorkout('');
        } catch (error) {
            setError('Failed to link workout.');
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">{editingGoal ? 'Edit Goal' : viewOnly ? 'View Goal' : 'Create New Goal'}</h2>

            {/* Create New Goal */}
            <section>
                <h3>Set a New Goal</h3>
                <form onSubmit={editingGoal ? handleUpdate : handleSubmit}>
                    <select name="goalType" value={newGoal.goalType} onChange={handleInputChange}>
                        <option value="weight loss">Weight Loss</option>
                        <option value="muscle gain">Muscle Gain</option>
                        <option value="endurance">Endurance</option>
                        <option value="distance">Distance</option>
                    </select>
                    <input
                        type="number"
                        name="currentValue"
                        value={newGoal.currentValue}
                        onChange={handleInputChange}
                        placeholder="Current Value"
                        required
                    />
                    <input
                        type="number"
                        name="targetValue"
                        value={newGoal.targetValue}
                        onChange={handleInputChange}
                        placeholder="Target Value"
                        required
                    />
                    <input
                        type="date"
                        name="deadline"
                        value={newGoal.deadline}
                        onChange={handleInputChange}
                        required
                    />
                    <textarea
                        name="notes"
                        value={newGoal.notes}
                        onChange={handleInputChange}
                        placeholder="Notes"
                    />
                    <div>
                        <h4>Add Milestone</h4>
                        <input
                            type="text"
                            value={newMilestone.title}
                            onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                            placeholder="Milestone Title"
                        />
                        <input
                            type="number"
                            value={newMilestone.targetValue}
                            onChange={(e) => setNewMilestone({ ...newMilestone, targetValue: e.target.value })}
                            placeholder="Target Value"
                        />
                        <button type="button" onClick={addMilestone}>Add</button>
                        <ul>
                            {newGoal.milestones.map((m, idx) => (
                                <li key={idx}>{m.title}: {m.targetValue}</li>
                            ))}
                        </ul>
                    </div>
                    <button type="submit">{editingGoal ? 'Update Goal' : 'Save Goal'}</button>
                    {editingGoal && <button type="button" onClick={() => setEditingGoal(null)}>Cancel</button>}
                </form>
            </section>

            {/* Current Goals */}
            <section>
                <h3>Current Goals</h3>
                {goals.length > 0 ? (
                    <ul>
                        {goals.map(goal => (
                            <li key={goal._id}>
                                <p><strong>{goal.goalType}</strong>: {goal.currentValue} → {goal.targetValue} ({goal.progress}%)</p>
                                <progress value={goal.progress} max="100" />
                                <p>Deadline: {new Date(goal.deadline).toLocaleDateString()}</p>
                                <p>Notes: {goal.notes || 'None'}</p>
                                <p>Milestones:</p>
                                <ul>
                                    {goal.milestones.map(m => (
                                        <li key={m._id}>
                                            {m.title}: {m.targetValue} - {m.completed ? 'Completed' : 'Pending'}
                                        </li>
                                    ))}
                                </ul>
                                <p>Workouts: {goal.workouts.map(w => w.title).join(', ') || 'None'}</p>
                                <div>
                                    <input
                                        type="number"
                                        value={progressUpdate.currentValue}
                                        onChange={(e) => setProgressUpdate({ ...progressUpdate, currentValue: e.target.value })}
                                        placeholder="Update Current Value"
                                    />
                                    <select
                                        value={progressUpdate.milestoneId}
                                        onChange={(e) => setProgressUpdate({ ...progressUpdate, milestoneId: e.target.value })}
                                    >
                                        <option value="">Select Milestone</option>
                                        {goal.milestones.filter(m => !m.completed).map(m => (
                                            <option key={m._id} value={m._id}>{m.title}</option>
                                        ))}
                                    </select>
                                    <button onClick={() => handleProgressUpdate(goal._id)}>Update Progress</button>
                                </div>
                                <div>
                                    <select
                                        value={linkedWorkout}
                                        onChange={(e) => setLinkedWorkout(e.target.value)}
                                    >
                                        <option value="">Link Workout</option>
                                        {workoutPrograms.map(w => (
                                            <option key={w._id} value={w._id}>{w.title}</option>
                                        ))}
                                    </select>
                                    <button onClick={() => handleLinkWorkout(goal._id)}>Link</button>
                                </div>
                                <button onClick={() => handleEdit(goal)}>Edit</button>
                                <button onClick={() => handleDelete(goal._id)}>Delete</button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No active goals.</p>
                )}
            </section>

            {/* Past Goals */}
            <section>
                <h3>Past Goals</h3>
                {pastGoals.length > 0 ? (
                    <ul>
                        {pastGoals.map(goal => (
                            <li key={goal._id}>
                                <p><strong>{goal.goalType}</strong>: {goal.currentValue} → {goal.targetValue} - {goal.status}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No past goals.</p>
                )}
            </section>
        </div>
    );
};

export default UserGoalForm;