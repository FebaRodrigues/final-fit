// controllers/workoutProgramController.js
const WorkoutProgram = require('../models/WorkoutProgram');
const User = require('../models/User');

// Get all workout programs (Admin only)
exports.getAllWorkoutPrograms = async (req, res) => {
    try {
        const programs = await WorkoutProgram.find()
            .populate('trainerId', 'name email')
            .populate('userId', 'name email');
        
        res.status(200).json(programs);
    } catch (error) {
        console.error('Error fetching all workout programs:', error);
        res.status(500).json({ error: 'Failed to fetch workout programs' });
    }
};

// Create a new workout program (Trainer or Admin)
exports.createWorkoutProgram = async (req, res) => {
    const { 
        title, 
        description, 
        exercises, 
        category, 
        isLibraryPlan,
        difficulty,
        estimatedDuration,
        estimatedCaloriesBurn,
        tags,
        imageUrl
    } = req.body;
    const trainerId = req.user.role === 'trainer' ? req.user.id : null; // Only set trainerId for trainers

    try {
        // Validate required fields
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }
        if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
            return res.status(400).json({ error: 'At least one exercise is required' });
        }
        if (!category) {
            return res.status(400).json({ error: 'Category is required' });
        }

        // Calculate estimated duration if not provided
        let calculatedDuration = estimatedDuration;
        if (!calculatedDuration) {
            calculatedDuration = exercises.reduce((sum, ex) => {
                // Estimate time based on sets, reps and rest time
                const exerciseTime = (ex.sets || 1) * (ex.reps || 1) * 3; // ~3 seconds per rep
                const restTime = ((ex.sets || 1) - 1) * (ex.restTime || 60) / 60; // Rest time in minutes
                return sum + exerciseTime / 60 + restTime; // Convert to minutes
            }, 0);
        }

        const program = new WorkoutProgram({
            trainerId,
            title,
            description,
            exercises: exercises.map(ex => ({
                name: ex.name,
                sets: ex.sets,
                reps: ex.reps,
                weight: ex.weight,
                duration: ex.duration,
                distance: ex.distance,
                caloriesBurned: ex.caloriesBurned,
                restTime: ex.restTime || 60,
                notes: ex.notes || '',
                category: ex.category || 'strength'
            })),
            category,
            isLibraryPlan: isLibraryPlan || false,
            difficulty: difficulty || 'Beginner',
            estimatedDuration: calculatedDuration,
            estimatedCaloriesBurn: estimatedCaloriesBurn || 0,
            tags: tags || [],
            imageUrl: imageUrl || '',
            updatedAt: new Date()
        });
        
        await program.save();
        res.status(201).json({ 
            message: 'Workout program created successfully', 
            program 
        });
    } catch (error) {
        console.error('Error creating workout program:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get all workout programs for a user (includes assigned and library plans they've selected)
exports.getWorkoutPrograms = async (req, res) => {
    const { userId } = req.params;
    const { category, difficulty } = req.query;
    
    try {
        // Ensure the requesting user can only see their own workout programs
        // If the request is from a trainer or admin, they can see the programs for the specified userId
        const requestingUserId = req.user.id;
        const requestingUserRole = req.user.role;
        
        // Only allow access if:
        // 1. The user is requesting their own workout programs
        // 2. The user is a trainer who created the program
        // 3. The user is an admin
        if (requestingUserRole !== 'admin' && 
            requestingUserRole !== 'trainer' && 
            requestingUserId !== userId) {
            return res.status(403).json({ error: 'Unauthorized access to workout programs' });
        }
        
        let query = { userId };
        
        // Add filters if provided
        if (category) {
            query.category = category;
        }
        if (difficulty) {
            query.difficulty = difficulty;
        }
        
        const assignedPrograms = await WorkoutProgram.find(query).sort({ updatedAt: -1 });
        res.status(200).json(assignedPrograms);
    } catch (error) {
        console.error('Error getting workout programs:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get all library workout programs (accessible to all users)
exports.getLibraryWorkoutPrograms = async (req, res) => {
    const { category, difficulty, search } = req.query;
    
    try {
        let query = { isLibraryPlan: true };
        
        // Add filters if provided
        if (category) {
            query.category = category;
        }
        if (difficulty) {
            query.difficulty = difficulty;
        }
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }
        
        console.log('Fetching library workout programs with query:', query);
        const libraryPrograms = await WorkoutProgram.find(query).sort({ updatedAt: -1 });
        console.log('Library programs retrieved:', libraryPrograms.length);
        res.status(200).json(libraryPrograms);
    } catch (error) {
        console.error('Error in getLibraryWorkoutPrograms:', error.stack);
        res.status(500).json({ error: error.message });
    }
};

// Assign a workout program to a user (Trainer only)
exports.assignWorkoutProgram = async (req, res) => {
    const { programId, userId, customizations } = req.body;
    const trainerId = req.user.id;

    try {
        // Validate that userId is provided
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }
        
        // Check if the user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const program = await WorkoutProgram.findById(programId);
        if (!program) return res.status(404).json({ message: 'Workout program not found' });

        // Apply any customizations to the program
        let exercises = program.exercises;
        if (customizations && customizations.exercises) {
            exercises = customizations.exercises;
        }

        // Clone the program for the user
        const assignedProgram = new WorkoutProgram({
            trainerId,
            userId, // Ensure this is set to the specific user ID
            title: customizations?.title || program.title,
            description: customizations?.description || program.description,
            exercises: exercises,
            category: customizations?.category || program.category,
            isLibraryPlan: false, // Assigned plans are not library plans
            difficulty: customizations?.difficulty || program.difficulty,
            estimatedDuration: customizations?.estimatedDuration || program.estimatedDuration,
            estimatedCaloriesBurn: customizations?.estimatedCaloriesBurn || program.estimatedCaloriesBurn,
            tags: customizations?.tags || program.tags,
            imageUrl: customizations?.imageUrl || program.imageUrl,
            updatedAt: new Date()
        });
        
        await assignedProgram.save();
        res.status(200).json({ 
            message: 'Workout program assigned successfully', 
            assignedProgram 
        });
    } catch (error) {
        console.error('Error assigning workout program:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get a specific workout program by ID
exports.getWorkoutProgramById = async (req, res) => {
    const { programId } = req.params;
    
    try {
        const program = await WorkoutProgram.findById(programId);
        if (!program) {
            return res.status(404).json({ message: 'Workout program not found' });
        }
        
        res.status(200).json(program);
    } catch (error) {
        console.error('Error getting workout program:', error);
        res.status(500).json({ error: error.message });
    }
};

// Update a workout program
exports.updateWorkoutProgram = async (req, res) => {
    const { programId } = req.params;
    const updateData = req.body;
    
    try {
        // Make sure updatedAt is set
        updateData.updatedAt = new Date();
        
        const program = await WorkoutProgram.findByIdAndUpdate(
            programId,
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!program) {
            return res.status(404).json({ message: 'Workout program not found' });
        }
        
        res.status(200).json({ 
            message: 'Workout program updated successfully', 
            program 
        });
    } catch (error) {
        console.error('Error updating workout program:', error);
        res.status(500).json({ error: error.message });
    }
};

// Delete a workout program
exports.deleteWorkoutProgram = async (req, res) => {
    const { programId } = req.params;
    
    try {
        const program = await WorkoutProgram.findByIdAndDelete(programId);
        
        if (!program) {
            return res.status(404).json({ message: 'Workout program not found' });
        }
        
        res.status(200).json({ 
            message: 'Workout program deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting workout program:', error);
        res.status(500).json({ error: error.message });
    }
};