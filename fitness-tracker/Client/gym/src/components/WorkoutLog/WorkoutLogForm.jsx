import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWorkoutLogs } from '../../hooks';
import ExerciseInput from './ExerciseInput';
import { toast } from 'react-toastify';

const WorkoutLogForm = ({ existingLog = null }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addWorkoutLog, updateLog } = useWorkoutLogs(user?.id);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState(existingLog || {
    title: 'Workout Session',
    date: new Date().toISOString().split('T')[0],
    duration: 0,
    exercises: [{ 
      name: '', 
      category: '', 
      setsCompleted: 0, 
      repsCompleted: 0, 
      weight: 0,
      notes: ''
    }],
    feelingRating: 3,
    notes: '',
    location: 'Gym',
    caloriesBurned: 0
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'duration' || name === 'caloriesBurned' || name === 'feelingRating' 
        ? parseInt(value) 
        : value
    });
  };
  
  const handleExerciseChange = (index, updatedExercise) => {
    const updatedExercises = [...formData.exercises];
    updatedExercises[index] = updatedExercise;
    setFormData({
      ...formData,
      exercises: updatedExercises
    });
  };
  
  const addExercise = () => {
    setFormData({
      ...formData,
      exercises: [
        ...formData.exercises, 
        { 
          name: '', 
          category: '', 
          setsCompleted: 0, 
          repsCompleted: 0, 
          weight: 0,
          notes: ''
        }
      ]
    });
  };
  
  const removeExercise = (index) => {
    const updatedExercises = formData.exercises.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      exercises: updatedExercises
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.title.trim()) {
      toast.error('Please enter a workout title');
      return;
    }
    
    if (formData.exercises.length === 0) {
      toast.error('Please add at least one exercise');
      return;
    }
    
    if (formData.exercises.some(ex => !ex.name.trim())) {
      toast.error('Please enter a name for all exercises');
      return;
    }
    
    try {
      setLoading(true);
      
      if (existingLog && existingLog._id) {
        await updateLog(existingLog._id, formData);
        toast.success('Workout log updated successfully');
      } else {
        await addWorkoutLog(formData);
        toast.success('Workout logged successfully');
      }
      
      navigate('/user/workouts');
    } catch (error) {
      console.error('Error saving workout log:', error);
      toast.error(error.message || 'Failed to save workout log');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">
        {existingLog ? 'Edit Workout Log' : 'Log Your Workout'}
      </h2>
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
            Workout Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="e.g., Morning Cardio, Leg Day"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="date">
              Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="duration">
              Duration (minutes)
            </label>
            <input
              type="number"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              min="0"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="location">
              Location
            </label>
            <select
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="Gym">Gym</option>
              <option value="Home">Home</option>
              <option value="Outdoors">Outdoors</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="caloriesBurned">
              Calories Burned (estimated)
            </label>
            <input
              type="number"
              id="caloriesBurned"
              name="caloriesBurned"
              value={formData.caloriesBurned}
              onChange={handleChange}
              min="0"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            How did you feel? (1-5)
          </label>
          <div className="flex items-center">
            <input
              type="range"
              id="feelingRating"
              name="feelingRating"
              min="1"
              max="5"
              value={formData.feelingRating}
              onChange={handleChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="ml-2 text-lg font-bold">{formData.feelingRating}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Very Tired</span>
            <span>Okay</span>
            <span>Great</span>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-4">Exercises</h3>
          
          {formData.exercises.map((exercise, index) => (
            <ExerciseInput
              key={index}
              exercise={exercise}
              index={index}
              onChange={handleExerciseChange}
              onRemove={removeExercise}
            />
          ))}
          
          <button
            type="button"
            onClick={addExercise}
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Add Exercise
          </button>
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows="3"
            placeholder="How was your workout? Any achievements or challenges?"
          ></textarea>
        </div>
        
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={loading}
            className={`bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Saving...' : (existingLog ? 'Update Workout' : 'Log Workout')}
          </button>
          
          <button
            type="button"
            onClick={() => navigate('/user/workouts')}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default WorkoutLogForm; 