// controllers/workoutLogController.js
const WorkoutLog = require('../models/WorkoutLog');
const User = require('../models/User');
const Goal = require('../models/Goal');

// Create a new workout log
exports.createWorkoutLog = async (req, res) => {
    const { 
        userId, 
        workoutId, 
        title,
        exercises, 
        caloriesBurned, 
        duration,
        feelingRating,
        notes,
        location,
        weather,
        photoUrls,
        isPublic,
        workoutType,
        isCustomWorkout,
        completionStatus
    } = req.body;

    try {
        // Validate required fields
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }
        if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
            return res.status(400).json({ error: 'At least one exercise is required' });
        }

        // Calculate total calories if not provided
        let totalCalories = caloriesBurned || 0;
        if (!totalCalories && exercises.some(ex => ex.caloriesBurned)) {
            totalCalories = exercises.reduce((sum, ex) => sum + (ex.caloriesBurned || 0), 0);
        }

        // Construct log data
        const logData = {
            userId,
            title: title || 'Workout Session',
            exercises: exercises.map(ex => ({
                name: ex.name,
                category: ex.category || 'strength',
                setsCompleted: ex.setsCompleted || 0,
                repsCompleted: ex.repsCompleted || 0,
                weight: ex.weight || 0,
                distance: ex.distance,
                duration: ex.duration,
                caloriesBurned: ex.caloriesBurned || 0,
                notes: ex.notes,
                difficulty: ex.difficulty,
                restTime: ex.restTime,
                personalRecord: ex.personalRecord || false
            })),
            caloriesBurned: totalCalories,
            duration: duration || 0,
            feelingRating,
            notes,
            location,
            weather,
            photoUrls: photoUrls || [],
            isPublic: isPublic || false,
            workoutType: workoutType || 'strength',
            isCustomWorkout: isCustomWorkout || false,
            completionStatus: completionStatus || 'completed'
        };

        // Only include workoutId if provided and non-empty
        if (workoutId && workoutId.trim() !== '') {
            logData.workoutId = workoutId;
        }

        const log = new WorkoutLog(logData);
        await log.save();

        // Update any related goals
        await updateGoalsProgress(userId);

        res.status(201).json({
            message: 'Workout log created successfully',
            workoutLog: log
        });
    } catch (error) {
        console.error('Error creating workout log:', error);
        res.status(400).json({ error: error.message });
    }
};

// Get all workout logs for a user
exports.getWorkoutLogs = async (req, res) => {
    const { userId } = req.params;
    const { 
        startDate, 
        endDate, 
        limit = 10, 
        page = 1,
        sortBy = 'date',
        sortOrder = 'desc'
    } = req.query;
    
    try {
        const query = { userId };
        
        // Add date range filter if provided
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }
        
        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        
        // Execute query with pagination and sorting
        const logs = await WorkoutLog.find(query)
            .populate('workoutId', 'title description')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));
            
        // Get total count for pagination
        const total = await WorkoutLog.countDocuments(query);
        
        res.status(200).json({
            workoutLogs: logs,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching workout logs:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get a specific workout log by ID
exports.getWorkoutLogById = async (req, res) => {
    const { logId } = req.params;
    
    try {
        const log = await WorkoutLog.findById(logId)
            .populate('workoutId', 'title description')
            .populate('userId', 'name profileImage');
            
        if (!log) {
            return res.status(404).json({ error: 'Workout log not found' });
        }
        
        res.status(200).json(log);
    } catch (error) {
        console.error('Error fetching workout log:', error);
        res.status(500).json({ error: error.message });
    }
};

// Update a workout log
exports.updateWorkoutLog = async (req, res) => {
    const { logId } = req.params;
    const updateData = req.body;
    
    try {
        // Ensure the user can't update userId
        if (updateData.userId) {
            delete updateData.userId;
        }
        
        const log = await WorkoutLog.findByIdAndUpdate(
            logId,
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!log) {
            return res.status(404).json({ error: 'Workout log not found' });
        }
        
        // Update any related goals
        await updateGoalsProgress(log.userId);
        
        res.status(200).json({
            message: 'Workout log updated successfully',
            workoutLog: log
        });
    } catch (error) {
        console.error('Error updating workout log:', error);
        res.status(400).json({ error: error.message });
    }
};

// Delete a workout log
exports.deleteWorkoutLog = async (req, res) => {
    const { logId } = req.params;
    
    try {
        const log = await WorkoutLog.findById(logId);
        
        if (!log) {
            return res.status(404).json({ error: 'Workout log not found' });
        }
        
        const userId = log.userId;
        
        await WorkoutLog.findByIdAndDelete(logId);
        
        // Update any related goals
        await updateGoalsProgress(userId);
        
        res.status(200).json({ message: 'Workout log deleted successfully' });
    } catch (error) {
        console.error('Error deleting workout log:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get workout statistics for a user
exports.getWorkoutStats = async (req, res) => {
    const { userId } = req.params;
    const { period = 'month', startDate, endDate } = req.query;
    
    try {
        // Define date range based on period
        const today = new Date();
        let start, end;
        
        if (startDate && endDate) {
            // Use custom date range if provided
            start = new Date(startDate);
            end = new Date(endDate);
        } else {
            // Calculate date range based on period
            end = new Date(today);
            
            if (period === 'week') {
                start = new Date(today);
                start.setDate(today.getDate() - 7);
            } else if (period === 'month') {
                start = new Date(today);
                start.setMonth(today.getMonth() - 1);
            } else if (period === 'year') {
                start = new Date(today);
                start.setFullYear(today.getFullYear() - 1);
            } else if (period === 'all') {
                start = new Date(0); // Beginning of time
            } else {
                return res.status(400).json({ error: 'Invalid period specified' });
            }
        }
        
        // Get all workout logs within the date range
        const workoutLogs = await WorkoutLog.find({
            userId,
            date: { $gte: start, $lte: end }
        }).sort({ date: 1 });
        
        if (!workoutLogs.length) {
            return res.status(200).json({
                totalWorkouts: 0,
                totalDuration: 0,
                totalCalories: 0,
                exerciseTypes: {},
                avgDuration: 0,
                streak: 0,
                period,
                workoutsByType: {},
                progressByExercise: {},
                caloriesByDay: [],
                durationByDay: [],
                personalRecords: []
            });
        }
        
        // Calculate basic stats
        const totalWorkouts = workoutLogs.length;
        const totalDuration = workoutLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
        const totalCalories = workoutLogs.reduce((sum, log) => sum + (log.caloriesBurned || 0), 0);
        const avgDuration = totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0;
        
        // Calculate exercise types distribution
        const exerciseTypes = {};
        workoutLogs.forEach(log => {
            const type = log.workoutType || 'strength';
            exerciseTypes[type] = (exerciseTypes[type] || 0) + 1;
        });
        
        // Calculate workouts by type with detailed stats
        const workoutsByType = {};
        workoutLogs.forEach(log => {
            const type = log.workoutType || 'strength';
            if (!workoutsByType[type]) {
                workoutsByType[type] = {
                    count: 0,
                    totalDuration: 0,
                    totalCalories: 0,
                    exercises: {}
                };
            }
            
            workoutsByType[type].count += 1;
            workoutsByType[type].totalDuration += (log.duration || 0);
            workoutsByType[type].totalCalories += (log.caloriesBurned || 0);
            
            // Track exercises for each type
            log.exercises.forEach(exercise => {
                const exName = exercise.name;
                if (!workoutsByType[type].exercises[exName]) {
                    workoutsByType[type].exercises[exName] = 0;
                }
                workoutsByType[type].exercises[exName] += 1;
            });
        });
        
        // Calculate progress by exercise (for strength training)
        const progressByExercise = {};
        workoutLogs.forEach(log => {
            log.exercises.forEach(exercise => {
                if (exercise.category === 'strength' && exercise.weight > 0) {
                    const exName = exercise.name;
                    if (!progressByExercise[exName]) {
                        progressByExercise[exName] = {
                            weights: [],
                            dates: []
                        };
                    }
                    progressByExercise[exName].weights.push(exercise.weight);
                    progressByExercise[exName].dates.push(log.date);
                }
            });
        });
        
        // Format data for charts - calories by day
        const caloriesByDay = [];
        const durationByDay = [];
        const dateMap = new Map();
        
        workoutLogs.forEach(log => {
            const dateStr = log.date.toISOString().split('T')[0];
            if (!dateMap.has(dateStr)) {
                dateMap.set(dateStr, {
                    calories: 0,
                    duration: 0
                });
            }
            
            const dayData = dateMap.get(dateStr);
            dayData.calories += (log.caloriesBurned || 0);
            dayData.duration += (log.duration || 0);
        });
        
        dateMap.forEach((value, key) => {
            caloriesByDay.push({
                date: key,
                calories: value.calories
            });
            
            durationByDay.push({
                date: key,
                duration: value.duration
            });
        });
        
        // Get personal records
        const personalRecords = [];
        workoutLogs.forEach(log => {
            log.exercises.forEach(exercise => {
                if (exercise.personalRecord) {
                    personalRecords.push({
                        date: log.date,
                        exerciseName: exercise.name,
                        weight: exercise.weight,
                        reps: exercise.repsCompleted,
                        sets: exercise.setsCompleted
                    });
                }
            });
        });
        
        // Calculate streak
        const streak = calculateStreak(workoutLogs);
        
        res.status(200).json({
            totalWorkouts,
            totalDuration,
            totalCalories,
            exerciseTypes,
            avgDuration,
            streak,
            period,
            workoutsByType,
            progressByExercise,
            caloriesByDay,
            durationByDay,
            personalRecords
        });
    } catch (error) {
        console.error('Error getting workout stats:', error);
        res.status(500).json({ error: error.message });
    }
};

// Calculate workout streak (consecutive days with workouts)
const calculateStreak = (logs) => {
    if (!logs || logs.length === 0) return 0;
    
    // Sort logs by date (newest first)
    const sortedLogs = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Get unique dates (in case of multiple workouts per day)
    const uniqueDates = new Set();
    sortedLogs.forEach(log => {
        const dateStr = new Date(log.date).toISOString().split('T')[0];
        uniqueDates.add(dateStr);
    });
    
    // Convert to array and sort (newest first)
    const dates = Array.from(uniqueDates).sort().reverse();
    
    // Calculate streak
    let streak = 1; // Start with 1 for the most recent workout
    const today = new Date().toISOString().split('T')[0];
    const mostRecentDate = dates[0];
    
    // Check if the most recent workout was today or yesterday
    const isToday = mostRecentDate === today;
    
    if (!isToday) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        // If the most recent workout wasn't yesterday or today, streak is broken
        if (mostRecentDate !== yesterdayStr) {
            return 0;
        }
    }
    
    // Count consecutive days
    for (let i = 0; i < dates.length - 1; i++) {
        const currentDate = new Date(dates[i]);
        const nextDate = new Date(dates[i + 1]);
        
        // Calculate difference in days
        const diffTime = currentDate - nextDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // If the difference is exactly 1 day, continue the streak
        if (diffDays === 1) {
            streak++;
        } else {
            break; // Streak is broken
        }
    }
    
    return streak;
};

// Update goals progress when a workout is logged
const updateGoalsProgress = async (userId) => {
    try {
        // Find all active workout-related goals for the user
        const goals = await Goal.find({
            userId,
            status: 'active',
            category: { $in: ['fitness', 'workout', 'health'] }
        });
        
        if (!goals.length) return; // No active goals to update
        
        // Get recent workout logs
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const workoutLogs = await WorkoutLog.find({
            userId,
            date: { $gte: thirtyDaysAgo }
        }).sort({ date: -1 });
        
        if (!workoutLogs.length) return; // No recent workouts
        
        // Process each goal
        for (const goal of goals) {
            let progress = 0;
            let isCompleted = false;
            
            // Different logic based on goal type
            switch (goal.type) {
                case 'workout_frequency':
                    // Count workouts in the specified period
                    const periodDays = goal.period === 'weekly' ? 7 : 30;
                    const periodStart = new Date();
                    periodStart.setDate(periodStart.getDate() - periodDays);
                    
                    const workoutsInPeriod = workoutLogs.filter(log => 
                        new Date(log.date) >= periodStart
                    ).length;
                    
                    progress = Math.min(100, (workoutsInPeriod / goal.target) * 100);
                    isCompleted = workoutsInPeriod >= goal.target;
                    break;
                    
                case 'calories_burned':
                    // Sum calories burned in the specified period
                    const caloriesPeriodDays = goal.period === 'weekly' ? 7 : 30;
                    const caloriesPeriodStart = new Date();
                    caloriesPeriodStart.setDate(caloriesPeriodStart.getDate() - caloriesPeriodDays);
                    
                    const caloriesBurned = workoutLogs
                        .filter(log => new Date(log.date) >= caloriesPeriodStart)
                        .reduce((sum, log) => sum + (log.caloriesBurned || 0), 0);
                    
                    progress = Math.min(100, (caloriesBurned / goal.target) * 100);
                    isCompleted = caloriesBurned >= goal.target;
                    break;
                    
                case 'workout_duration':
                    // Sum workout duration in the specified period
                    const durationPeriodDays = goal.period === 'weekly' ? 7 : 30;
                    const durationPeriodStart = new Date();
                    durationPeriodStart.setDate(durationPeriodStart.getDate() - durationPeriodDays);
                    
                    const totalDuration = workoutLogs
                        .filter(log => new Date(log.date) >= durationPeriodStart)
                        .reduce((sum, log) => sum + (log.duration || 0), 0);
                    
                    progress = Math.min(100, (totalDuration / goal.target) * 100);
                    isCompleted = totalDuration >= goal.target;
                    break;
                    
                case 'strength_improvement':
                    // Check for strength improvements in specific exercises
                    if (goal.specificExercise) {
                        const exerciseLogs = workoutLogs
                            .filter(log => log.exercises.some(ex => 
                                ex.name.toLowerCase() === goal.specificExercise.toLowerCase() && 
                                ex.category === 'strength'
                            ))
                            .sort((a, b) => new Date(a.date) - new Date(b.date));
                        
                        if (exerciseLogs.length >= 2) {
                            // Compare first and last log for the exercise
                            const firstLog = exerciseLogs[0];
                            const lastLog = exerciseLogs[exerciseLogs.length - 1];
                            
                            const firstExercise = firstLog.exercises.find(ex => 
                                ex.name.toLowerCase() === goal.specificExercise.toLowerCase()
                            );
                            
                            const lastExercise = lastLog.exercises.find(ex => 
                                ex.name.toLowerCase() === goal.specificExercise.toLowerCase()
                            );
                            
                            if (firstExercise && lastExercise) {
                                const improvement = lastExercise.weight - firstExercise.weight;
                                progress = Math.min(100, (improvement / goal.target) * 100);
                                isCompleted = improvement >= goal.target;
                            }
                        }
                    }
                    break;
                    
                case 'workout_streak':
                    // Check current streak
                    const streak = calculateStreak(workoutLogs);
                    progress = Math.min(100, (streak / goal.target) * 100);
                    isCompleted = streak >= goal.target;
                    break;
                    
                default:
                    // Skip other goal types
                    continue;
            }
            
            // Update goal progress
            goal.progress = Math.max(goal.progress, progress); // Only increase progress
            
            // Check if goal is completed
            if (isCompleted && goal.status !== 'completed') {
                goal.status = 'completed';
                goal.completedAt = new Date();
            }
            
            await goal.save();
        }
    } catch (error) {
        console.error('Error updating goals progress:', error);
    }
};

module.exports = exports;