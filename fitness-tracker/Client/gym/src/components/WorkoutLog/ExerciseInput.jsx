import React from 'react';

const ExerciseInput = ({ exercise, index, onChange, onRemove }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedExercise = {
      ...exercise,
      [name]: ['setsCompleted', 'repsCompleted', 'weight', 'distance', 'duration', 'difficulty'].includes(name)
        ? parseFloat(value) || 0
        : value
    };
    onChange(index, updatedExercise);
  };
  
  return (
    <div className="exercise-input bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-lg font-semibold">Exercise {index + 1}</h4>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-red-500 hover:text-red-700"
          disabled={index === 0}
        >
          {index === 0 ? '' : 'Remove'}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={`exercise-name-${index}`}>
            Exercise Name*
          </label>
          <input
            type="text"
            id={`exercise-name-${index}`}
            name="name"
            value={exercise.name}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="e.g., Bench Press, Squats"
            required
          />
        </div>
        
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={`exercise-category-${index}`}>
            Category
          </label>
          <select
            id={`exercise-category-${index}`}
            name="category"
            value={exercise.category}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          >
            <option value="">Select Category</option>
            <option value="strength">Strength</option>
            <option value="cardio">Cardio</option>
            <option value="flexibility">Flexibility</option>
            <option value="balance">Balance</option>
          </select>
        </div>
      </div>
      
      {exercise.category === 'strength' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={`exercise-sets-${index}`}>
              Sets
            </label>
            <input
              type="number"
              id={`exercise-sets-${index}`}
              name="setsCompleted"
              value={exercise.setsCompleted}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={`exercise-reps-${index}`}>
              Reps
            </label>
            <input
              type="number"
              id={`exercise-reps-${index}`}
              name="repsCompleted"
              value={exercise.repsCompleted}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={`exercise-weight-${index}`}>
              Weight (kg/lbs)
            </label>
            <input
              type="number"
              id={`exercise-weight-${index}`}
              name="weight"
              value={exercise.weight}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
        </div>
      ) : exercise.category === 'cardio' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={`exercise-distance-${index}`}>
              Distance (km/miles)
            </label>
            <input
              type="number"
              id={`exercise-distance-${index}`}
              name="distance"
              value={exercise.distance || 0}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={`exercise-duration-${index}`}>
              Duration (minutes)
            </label>
            <input
              type="number"
              id={`exercise-duration-${index}`}
              name="duration"
              value={exercise.duration || 0}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
        </div>
      ) : (
        <div className="mb-3">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={`exercise-duration-${index}`}>
            Duration (minutes)
          </label>
          <input
            type="number"
            id={`exercise-duration-${index}`}
            name="duration"
            value={exercise.duration || 0}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
      )}
      
      <div className="mb-3">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={`exercise-difficulty-${index}`}>
          Difficulty (1-10)
        </label>
        <div className="flex items-center">
          <input
            type="range"
            id={`exercise-difficulty-${index}`}
            name="difficulty"
            value={exercise.difficulty || 5}
            onChange={handleChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="ml-2">{exercise.difficulty || 5}</span>
        </div>
      </div>
      
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={`exercise-notes-${index}`}>
          Notes
        </label>
        <textarea
          id={`exercise-notes-${index}`}
          name="notes"
          value={exercise.notes || ''}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          rows="2"
          placeholder="Any specific notes about this exercise"
        ></textarea>
      </div>
    </div>
  );
};

export default ExerciseInput; 