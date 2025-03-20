// controllers/goalController.js
const Goal = require('../models/Goal');
const User = require('../models/User');
const Notification = require('../models/Notification');
const WorkoutLog = require('../models/WorkoutLog');

// Create a new goal
exports.createGoal = async (req, res) => {
    try {
        const { 
            goalType, 
            currentValue, 
            targetValue, 
            deadline, 
            frequency, 
            notes, 
            milestones, 
            workouts,
            userId: targetUserId 
        } = req.body;
        
        console.log('Received goal data:', req.body);
        
        // Determine if this is a trainer creating a goal for a user
        const isTrainer = req.user && req.user.role === 'trainer';
        const userId = isTrainer && targetUserId ? targetUserId : (req.user ? req.user.id : null);
        const trainerId = isTrainer ? req.user.id : null;
        
        console.log('User info:', { isTrainer, userId, trainerId });

        // Validate input
        if (!goalType) {
            return res.status(400).json({ error: 'Goal type is required' });
        }
        
        if (currentValue === undefined || currentValue === null) {
            return res.status(400).json({ error: 'Current value is required' });
        }
        
        if (targetValue === undefined || targetValue === null) {
            return res.status(400).json({ error: 'Target value is required' });
        }
        
        if (!deadline) {
            return res.status(400).json({ error: 'Deadline is required' });
        }
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Validate deadline is in the future
        if (new Date(deadline) <= new Date()) {
            return res.status(400).json({ error: 'Deadline must be in the future' });
        }

        // Create goal with initial progress calculation
        const progress = calculateProgress(goalType, currentValue, targetValue);
        
        const goalData = {
            userId,
            goalType,
            currentValue,
            targetValue,
            deadline,
            frequency: frequency || 'custom',
            notes,
            progress,
            milestones: processMilestones(milestones || [], currentValue, targetValue),
            workouts: workouts || [],
            createdBy: isTrainer ? 'trainer' : 'user',
            trainerId: trainerId
        };
        
        console.log('Creating goal with data:', goalData);
        
        const goal = new Goal(goalData);
        
        await goal.save();
        console.log('Goal saved successfully:', goal._id);

        // Notify user
        try {
            await Notification.create({
                recipientId: userId,
                recipientModel: 'User',
                type: 'Goal',
                message: isTrainer 
                    ? `Your trainer has created a new "${goalType}" goal for you.`
                    : `New goal "${goalType}" created with target ${targetValue}.`,
                status: 'Unread',
            });
            console.log('Notification created successfully');
        } catch (notificationError) {
            console.error('Error creating notification:', notificationError);
            // Continue even if notification fails
        }

        res.status(201).json({ 
            message: 'Goal created successfully', 
            goal 
        });
    } catch (error) {
        console.error('Error creating goal:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

// Get active goals for a user
exports.getUserGoals = async (req, res) => {
    const { userId } = req.params;
    const status = req.query.status || 'active'; // Default to active goals
    
    try {
        // Ensure the requesting user can only see their own goals
        // If the request is from a trainer or admin, they can see the goals for the specified userId
        const requestingUserId = req.user.id;
        const requestingUserRole = req.user.role;
        
        // Only allow access if:
        // 1. The user is requesting their own goals
        // 2. The user is a trainer who created the goal
        // 3. The user is an admin
        if (requestingUserRole !== 'admin' && 
            requestingUserRole !== 'trainer' && 
            requestingUserId !== userId) {
            return res.status(403).json({ error: 'Unauthorized access to goals' });
        }
        
        // If it's a trainer, only show goals they created or are assigned to
        let query = { userId, status };
        if (requestingUserRole === 'trainer' && requestingUserId !== userId) {
            query.trainerId = requestingUserId;
        }
        
        const goals = await Goal.find(query)
            .populate('workouts', 'title description')
            .populate('trainerId', 'name email image')
            .sort({ createdAt: -1 });
            
        res.status(200).json({ goals });
    } catch (error) {
        console.error('Error fetching user goals:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get all goals for a user (with optional filtering)
exports.getAllUserGoals = async (req, res) => {
    const { userId } = req.params;
    const { status, goalType, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    try {
        // Ensure the requesting user can only see their own goals
        // If the request is from a trainer or admin, they can see the goals for the specified userId
        const requestingUserId = req.user.id;
        const requestingUserRole = req.user.role;
        
        // Only allow access if:
        // 1. The user is requesting their own goals
        // 2. The user is a trainer who created the goal
        // 3. The user is an admin
        if (requestingUserRole !== 'admin' && 
            requestingUserRole !== 'trainer' && 
            requestingUserId !== userId) {
            return res.status(403).json({ error: 'Unauthorized access to goals' });
        }
        
        // Build query
        let query = { userId };
        
        // If it's a trainer, only show goals they created or are assigned to
        if (requestingUserRole === 'trainer' && requestingUserId !== userId) {
            query.trainerId = requestingUserId;
        }
        
        if (status) {
            query.status = status;
        }
        
        if (goalType) {
            query.goalType = goalType;
        }
        
        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        
        const goals = await Goal.find(query)
            .populate('workouts', 'title description')
            .populate('trainerId', 'name email image')
            .sort(sort);
            
        res.status(200).json({ goals });
    } catch (error) {
        console.error('Error fetching all user goals:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get a specific goal by ID
exports.getGoalById = async (req, res) => {
    const { goalId } = req.params;
    
    try {
        const goal = await Goal.findById(goalId)
            .populate('workouts', 'title description')
            .populate('userId', 'name email')
            .populate('trainerId', 'name email image');
            
        if (!goal) {
            return res.status(404).json({ error: 'Goal not found' });
        }
        
        // Ensure user can only access their own goals
        const requestingUserId = req.user.id;
        const requestingUserRole = req.user.role;
        
        // Only allow access if:
        // 1. The user is requesting their own goal
        // 2. The user is a trainer who created the goal
        // 3. The user is an admin
        if (requestingUserRole !== 'admin' && 
            !(requestingUserRole === 'trainer' && goal.trainerId?.toString() === requestingUserId) && 
            goal.userId.toString() !== requestingUserId) {
            return res.status(403).json({ error: 'Unauthorized access to goal' });
        }
        
        res.status(200).json({ goal });
    } catch (error) {
        console.error('Error fetching goal:', error);
        res.status(500).json({ error: error.message });
    }
};

// Update a goal
exports.updateGoal = async (req, res) => {
    const { goalId } = req.params;
    const updateData = req.body;
    const userId = req.user.id;
    const isTrainer = req.user.role === 'trainer';
    
    try {
        // Find the goal first to check ownership
        const goal = await Goal.findById(goalId);
        
        if (!goal) {
            return res.status(404).json({ error: 'Goal not found' });
        }
        
        // Check if user owns this goal or is a trainer assigned to this user
        const canModify = 
            goal.userId.toString() === userId || 
            (isTrainer && (goal.trainerId?.toString() === userId || !goal.trainerId)) ||
            req.user.role === 'admin';
            
        if (!canModify) {
            return res.status(403).json({ error: 'Not authorized to update this goal' });
        }
        
        // If goal type is being changed, we need to recalculate progress
        if (updateData.goalType !== undefined && updateData.goalType !== goal.goalType) {
            console.log(`Goal type changing from ${goal.goalType} to ${updateData.goalType}`);
            
            // Use the new goal type for progress calculation
            const currentValue = updateData.currentValue !== undefined ? updateData.currentValue : goal.currentValue;
            const targetValue = updateData.targetValue !== undefined ? updateData.targetValue : goal.targetValue;
            
            updateData.progress = calculateProgress(updateData.goalType, currentValue, targetValue);
        }
        // If currentValue or targetValue is being updated, recalculate progress
        else if (updateData.currentValue !== undefined || updateData.targetValue !== undefined) {
            const currentValue = updateData.currentValue !== undefined ? updateData.currentValue : goal.currentValue;
            const targetValue = updateData.targetValue !== undefined ? updateData.targetValue : goal.targetValue;
            
            updateData.progress = calculateProgress(goal.goalType, currentValue, targetValue);
        }
        
        // Check if goal is completed
        if (updateData.progress >= 100) {
            updateData.status = 'completed';
            updateData.updatedAt = new Date();
            
            // Create notification for goal completion
            await Notification.create({
                recipientId: goal.userId,
                recipientModel: 'User',
                type: 'Goal',
                message: isTrainer
                    ? `Your trainer has marked your "${goal.goalType}" goal as completed.`
                    : `Congratulations! You've completed your "${goal.goalType}" goal.`,
                status: 'Unread',
            });
        }
        
        // If milestones are being updated, process them
        if (updateData.milestones) {
            updateData.milestones = processMilestones(
                updateData.milestones,
                updateData.currentValue !== undefined ? updateData.currentValue : goal.currentValue,
                updateData.targetValue !== undefined ? updateData.targetValue : goal.targetValue
            );
        }
        
        // If trainer is updating, record that
        if (isTrainer) {
            updateData.trainerId = userId;
        }
        
        // Update the goal
        const updatedGoal = await Goal.findByIdAndUpdate(
            goalId,
            { ...updateData, updatedAt: new Date() },
            { new: true, runValidators: true }
        ).populate('workouts', 'title description');
        
        res.status(200).json({ 
            message: 'Goal updated successfully', 
            goal: updatedGoal 
        });
    } catch (error) {
        console.error('Error updating goal:', error);
        res.status(500).json({ error: error.message });
    }
};

// Update goal progress
exports.updateGoalProgress = async (req, res) => {
    const { goalId } = req.params;
    const { currentValue } = req.body;
    const userId = req.user.id;
    const isTrainer = req.user.role === 'trainer';
    
    try {
        // Find the goal
        const goal = await Goal.findById(goalId);
        
        if (!goal) {
            return res.status(404).json({ error: 'Goal not found' });
        }
        
        // Check if user owns this goal or is a trainer assigned to this user
        const canModify = 
            goal.userId.toString() === userId || 
            (isTrainer && (goal.trainerId?.toString() === userId || !goal.trainerId)) ||
            req.user.role === 'admin';
            
        if (!canModify) {
            return res.status(403).json({ error: 'Not authorized to update this goal' });
        }
        
        // Calculate new progress
        const progress = calculateProgress(goal.goalType, currentValue, goal.targetValue);
        
        // Check if any milestones are completed
        const updatedMilestones = goal.milestones.map(milestone => {
            // If milestone is already completed, don't change it
            if (milestone.completed) return milestone;
            
            // Check if milestone is now completed
            const isCompleted = checkMilestoneCompletion(goal.goalType, currentValue, milestone.targetValue);
            
            if (isCompleted) {
                return {
                    ...milestone.toObject(),
                    completed: true,
                    completedAt: new Date()
                };
            }
            
            return milestone;
        });
        
        // Determine goal status
        let status = goal.status;
        if (progress >= 100) {
            status = 'completed';
            
            // Create notification for goal completion
            await Notification.create({
                recipientId: goal.userId,
                recipientModel: 'User',
                type: 'Goal',
                message: isTrainer
                    ? `Your trainer has marked your "${goal.goalType}" goal as completed.`
                    : `Congratulations! You've completed your "${goal.goalType}" goal.`,
                status: 'Unread',
            });
        }
        
        // If trainer is updating, record that
        const updateData = {
            currentValue, 
            progress, 
            milestones: updatedMilestones,
            status,
            updatedAt: new Date()
        };
        
        if (isTrainer) {
            updateData.trainerId = userId;
        }
        
        // Update the goal
        const updatedGoal = await Goal.findByIdAndUpdate(
            goalId,
            updateData,
            { new: true }
        );
        
        res.status(200).json({ 
            message: 'Goal progress updated successfully', 
            goal: updatedGoal 
        });
    } catch (error) {
        console.error('Error updating goal progress:', error);
        res.status(500).json({ error: error.message });
    }
};

// Delete a goal (soft delete)
exports.deleteGoal = async (req, res) => {
    const { goalId } = req.params;
    const userId = req.user.id;
    const isTrainer = req.user.role === 'trainer';
    
    try {
        // Find the goal first to check ownership
        const goal = await Goal.findById(goalId);
        
        if (!goal) {
            return res.status(404).json({ error: 'Goal not found' });
        }
        
        // Check if user owns this goal or is a trainer assigned to this user
        const canModify = 
            goal.userId.toString() === userId || 
            (isTrainer && (goal.trainerId?.toString() === userId || !goal.trainerId)) ||
            req.user.role === 'admin';
            
        if (!canModify) {
            return res.status(403).json({ error: 'Not authorized to delete this goal' });
        }
        
        // Soft delete by updating status
        await Goal.findByIdAndUpdate(goalId, { 
            status: 'deleted',
            updatedAt: new Date()
        });
        
        // Notify user if a trainer deleted their goal
        if (isTrainer && goal.userId.toString() !== userId) {
            await Notification.create({
                recipientId: goal.userId,
                recipientModel: 'User',
                type: 'Goal',
                message: `Your trainer has removed your "${goal.goalType}" goal.`,
                status: 'Unread',
            });
        }
        
        res.status(200).json({ message: 'Goal deleted successfully' });
    } catch (error) {
        console.error('Error deleting goal:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get goal statistics for a user
exports.getGoalStats = async (req, res) => {
    const { userId } = req.params;
    
    try {
        // Get counts by status
        const activeCount = await Goal.countDocuments({ userId, status: 'active' });
        const completedCount = await Goal.countDocuments({ userId, status: 'completed' });
        const failedCount = await Goal.countDocuments({ userId, status: 'failed' });
        
        // Get counts by type
        const weightLossCount = await Goal.countDocuments({ userId, goalType: 'weight loss' });
        const weightGainCount = await Goal.countDocuments({ userId, goalType: 'weight gain' });
        const exerciseCount = await Goal.countDocuments({ userId, goalType: 'exercise' });
        const calorieIntakeCount = await Goal.countDocuments({ userId, goalType: 'calorie intake' });
        const stepCountCount = await Goal.countDocuments({ userId, goalType: 'step count' });
        const gymWorkoutsCount = await Goal.countDocuments({ userId, goalType: 'gym workouts' });
        
        // Get average progress of active goals
        const activeGoals = await Goal.find({ userId, status: 'active' });
        const avgProgress = activeGoals.length > 0
            ? activeGoals.reduce((sum, goal) => sum + goal.progress, 0) / activeGoals.length
            : 0;
        
        // Get completion rate
        const totalGoals = activeCount + completedCount + failedCount;
        const completionRate = totalGoals > 0 ? (completedCount / totalGoals) * 100 : 0;
        
        res.status(200).json({
            totalGoals,
            byStatus: {
                active: activeCount,
                completed: completedCount,
                failed: failedCount
            },
            byType: {
                weightLoss: weightLossCount,
                weightGain: weightGainCount,
                exercise: exerciseCount,
                calorieIntake: calorieIntakeCount,
                stepCount: stepCountCount,
                gymWorkouts: gymWorkoutsCount
            },
            avgProgress,
            completionRate
        });
    } catch (error) {
        console.error('Error fetching goal statistics:', error);
        res.status(500).json({ error: error.message });
    }
};

// Helper function to calculate progress based on goal type
const calculateProgress = (goalType, currentValue, targetValue) => {
    if (currentValue === undefined || currentValue === null || 
        targetValue === undefined || targetValue === null) {
        return 0;
    }
    
    // Ensure values are numbers
    const current = parseFloat(currentValue);
    const target = parseFloat(targetValue);
    
    if (isNaN(current) || isNaN(target)) {
        return 0;
    }
    
    let progress = 0;
    
    switch (goalType) {
        case 'weight loss':
            // For weight loss, progress increases as current value decreases
            if (current >= target) {
                // Calculate progress only if current weight is above target (still losing)
                const initialWeight = current; // Assume starting weight is current weight
                const weightToLose = initialWeight - target;
                
                if (weightToLose <= 0) {
                    progress = 0; // No progress if target is higher than current
                } else {
                    const weightLost = initialWeight - current;
                    progress = Math.min(100, Math.max(0, (weightLost / weightToLose) * 100));
                }
            } else {
                // Already reached or exceeded target
                progress = 100;
            }
            break;
            
        case 'weight gain':
        case 'exercise':
        case 'step count':
        case 'gym workouts':
            // For these goals, progress increases as current value increases
            if (target <= 0) {
                progress = 0; // Prevent division by zero
            } else if (current >= target) {
                progress = 100; // Already reached or exceeded target
            } else {
                progress = Math.min(100, Math.max(0, (current / target) * 100));
            }
            break;
            
        case 'calorie intake':
            // For calorie intake, progress is based on how close to the target
            if (target <= 0) {
                progress = 0; // Prevent division by zero
            } else if (current > target) {
                // If current is over target (assuming target is max), progress decreases
                progress = Math.max(0, 100 - ((current - target) / target * 100));
            } else {
                // If current is under target, progress increases
                progress = Math.min(100, (current / target) * 100);
            }
            break;
            
        default:
            progress = 0;
    }
    
    return Math.round(progress);
};

// Helper function to process milestones
const processMilestones = (milestones, currentValue, targetValue) => {
    if (!milestones || !Array.isArray(milestones) || milestones.length === 0) {
        return [];
    }
    
    // Filter out invalid milestones
    const validMilestones = milestones.filter(milestone => 
        milestone && 
        milestone.title && 
        (milestone.targetValue !== undefined && milestone.targetValue !== null)
    );
    
    if (validMilestones.length === 0) {
        return [];
    }
    
    // Sort milestones by target value
    const sortedMilestones = [...validMilestones].sort((a, b) => a.targetValue - b.targetValue);
    
    // Check if each milestone is already completed
    return sortedMilestones.map(milestone => ({
        title: milestone.title || '',
        targetValue: parseFloat(milestone.targetValue) || 0,
        notes: milestone.notes || '',
        completed: milestone.completed || (currentValue >= milestone.targetValue),
        completedAt: milestone.completed ? milestone.completedAt : (currentValue >= milestone.targetValue ? new Date() : null)
    }));
};

// Helper function to check if a milestone is completed
const checkMilestoneCompletion = (goalType, currentValue, milestoneTarget) => {
    if (currentValue === undefined || currentValue === null || 
        milestoneTarget === undefined || milestoneTarget === null) {
        return false;
    }
    
    // Ensure values are numbers
    const current = parseFloat(currentValue);
    const target = parseFloat(milestoneTarget);
    
    if (isNaN(current) || isNaN(target)) {
        return false;
    }
    
    switch (goalType) {
        case 'weight loss':
            // For weight loss, milestone is completed when current weight is less than or equal to target
            return current <= target;
            
        case 'weight gain':
        case 'exercise':
        case 'step count':
        case 'gym workouts':
            // For these goals, milestone is completed when current value is greater than or equal to target
            return current >= target;
            
        case 'calorie intake':
            // For calorie intake, it depends on whether the goal is to stay under or over
            // Assuming the goal is to stay under a certain calorie count
            return current <= target;
            
        default:
            return false;
    }
};

module.exports = exports;