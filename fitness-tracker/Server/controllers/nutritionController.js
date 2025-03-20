// controllers/nutritionController.js
const Nutrition = require('../models/Nutrition');
const User = require('../models/User');
const NutritionPlan = require('../models/NutritionPlan');

// Create or update nutrition log for a specific date
exports.createOrUpdateNutritionLog = async (req, res) => {
    const { userId, date, meals, waterIntake, dailyGoals, notes } = req.body;
    
    try {
        // Validate required fields
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }
        
        // Format date (strip time part)
        const formattedDate = new Date(date || Date.now());
        formattedDate.setHours(0, 0, 0, 0);
        
        // Check if log already exists for this date
        let nutritionLog = await Nutrition.findOne({
            userId,
            date: {
                $gte: formattedDate,
                $lt: new Date(formattedDate.getTime() + 24 * 60 * 60 * 1000)
            }
        });
        
        if (nutritionLog) {
            // Update existing log
            if (meals) nutritionLog.meals = meals;
            if (waterIntake) nutritionLog.waterIntake = waterIntake;
            if (dailyGoals) nutritionLog.dailyGoals = dailyGoals;
            if (notes !== undefined) nutritionLog.notes = notes;
            
            await nutritionLog.save();
            
            res.status(200).json({
                message: 'Nutrition log updated successfully',
                nutritionLog
            });
        } else {
            // Create new log
            nutritionLog = new Nutrition({
                userId,
                date: formattedDate,
                meals: meals || [],
                waterIntake: waterIntake || [],
                dailyGoals,
                notes
            });
            
            await nutritionLog.save();
            
            res.status(201).json({
                message: 'Nutrition log created successfully',
                nutritionLog
            });
        }
    } catch (error) {
        console.error('Error creating/updating nutrition log:', error);
        res.status(500).json({ error: error.message });
    }
};

// Add a meal to a nutrition log
exports.addMeal = async (req, res) => {
    const { userId, date, meal } = req.body;
    
    try {
        console.log('Adding meal with data:', { 
            userId, 
            date, 
            meal: {
                name: meal?.name,
                time: meal?.time,
                foods: meal?.foods?.length || 0,
                notes: meal?.notes
            }
        });
        
        // Validate required fields
        if (!userId || !meal || !meal.name) {
            console.error('Missing required fields:', { 
                hasUserId: !!userId, 
                hasMeal: !!meal, 
                hasMealName: meal?.name 
            });
            return res.status(400).json({ error: 'userId, meal name are required' });
        }
        
        // Ensure meal has a foods array
        if (!meal.foods || !Array.isArray(meal.foods)) {
            console.log('Meal is missing foods array or it is not an array. Setting to empty array.');
            meal.foods = [];
        } else {
            console.log('Food items in meal:', meal.foods.map(food => ({
                name: food.name,
                calories: food.calories,
                servingSize: food.servingSize,
                quantity: food.quantity
            })));
        }
        
        // Calculate meal totals
        let totalCalories = 0;
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;
        
        meal.foods.forEach(food => {
            const multiplier = (food.quantity || 1) * (food.servingSize || 1);
            totalCalories += (food.calories || 0) * multiplier;
            totalProtein += (food.protein || 0) * multiplier;
            totalCarbs += (food.carbs || 0) * multiplier;
            totalFat += (food.fat || 0) * multiplier;
        });
        
        // Add totals to the meal
        meal.totalCalories = totalCalories;
        meal.totalProtein = totalProtein;
        meal.totalCarbs = totalCarbs;
        meal.totalFat = totalFat;
        
        console.log('Calculated meal totals:', {
            totalCalories,
            totalProtein,
            totalCarbs,
            totalFat
        });
        
        // Format date (strip time part)
        const formattedDate = new Date(date || Date.now());
        formattedDate.setHours(0, 0, 0, 0);
        
        console.log('Formatted date:', formattedDate);
        
        // Find or create nutrition log for this date
        let nutritionLog = await Nutrition.findOne({
            userId,
            date: {
                $gte: formattedDate,
                $lt: new Date(formattedDate.getTime() + 24 * 60 * 60 * 1000)
            }
        });
        
        console.log('Found nutrition log:', nutritionLog ? 'Yes' : 'No');
        
        if (!nutritionLog) {
            console.log('Creating new nutrition log');
            nutritionLog = new Nutrition({
                userId,
                date: formattedDate,
                meals: [],
                waterIntake: []
            });
        } else {
            console.log('Existing log details:', {
                id: nutritionLog._id,
                date: nutritionLog.date,
                mealsCount: nutritionLog.meals.length,
                waterCount: nutritionLog.waterIntake.length
            });
        }
        
        // Add the meal
        console.log('Adding meal to log');
        nutritionLog.meals.push(meal);
        
        // Save the log
        console.log('Saving nutrition log');
        const savedLog = await nutritionLog.save();
        console.log('Log saved successfully');
        
        // Verify the meal was added
        console.log('Saved log details:', {
            id: savedLog._id,
            date: savedLog.date,
            mealsCount: savedLog.meals.length,
            waterCount: savedLog.waterIntake.length
        });
        
        if (savedLog.meals.length > 0) {
            console.log('Last meal in log:', {
                id: savedLog.meals[savedLog.meals.length - 1]._id,
                name: savedLog.meals[savedLog.meals.length - 1].name,
                foodsCount: savedLog.meals[savedLog.meals.length - 1].foods.length
            });
        }
        
        console.log('Meal added successfully');
        console.log('Updated nutrition log:', {
            id: nutritionLog._id,
            date: nutritionLog.date,
            mealCount: nutritionLog.meals.length,
            waterCount: nutritionLog.waterIntake.length
        });
        
        res.status(200).json({
            message: 'Meal added successfully',
            nutritionLog: savedLog
        });
    } catch (error) {
        console.error('Error adding meal:', error);
        res.status(500).json({ error: error.message });
    }
};

// Update a meal in a nutrition log
exports.updateMeal = async (req, res) => {
    const { logId, mealId, updatedMeal } = req.body;
    
    try {
        // Validate required fields
        if (!logId || !mealId || !updatedMeal) {
            return res.status(400).json({ error: 'logId, mealId, and updatedMeal are required' });
        }
        
        // Find the nutrition log
        const nutritionLog = await Nutrition.findById(logId);
        
        if (!nutritionLog) {
            return res.status(404).json({ error: 'Nutrition log not found' });
        }
        
        // Find the meal index
        const mealIndex = nutritionLog.meals.findIndex(meal => meal._id.toString() === mealId);
        
        if (mealIndex === -1) {
            return res.status(404).json({ error: 'Meal not found in this log' });
        }
        
        // Update the meal
        nutritionLog.meals[mealIndex] = {
            ...nutritionLog.meals[mealIndex].toObject(),
            ...updatedMeal,
            _id: nutritionLog.meals[mealIndex]._id // Preserve the original ID
        };
        
        await nutritionLog.save();
        
        res.status(200).json({
            message: 'Meal updated successfully',
            nutritionLog
        });
    } catch (error) {
        console.error('Error updating meal:', error);
        res.status(500).json({ error: error.message });
    }
};

// Delete a meal from a nutrition log
exports.deleteMeal = async (req, res) => {
    const { userId, mealId } = req.body;
    
    try {
        console.log('Deleting meal with data:', { userId, mealId });
        
        if (!userId || !mealId) {
            return res.status(400).json({ error: 'User ID and meal ID are required' });
        }
        
        // Find all nutrition logs for the user - IMPORTANT: field is 'userId' not 'user'
        const nutritionLogs = await Nutrition.find({ userId });
        
        console.log(`Found ${nutritionLogs.length} nutrition logs for user ${userId}`);
        
        if (!nutritionLogs || nutritionLogs.length === 0) {
            return res.status(404).json({ error: 'No nutrition logs found for this user' });
        }
        
        let mealFound = false;
        let updatedLog = null;
        
        // Loop through each log to find the meal
        for (const log of nutritionLogs) {
            console.log(`Checking log ${log._id} with ${log.meals.length} meals`);
            const mealIndex = log.meals.findIndex(meal => meal._id.toString() === mealId);
            
            if (mealIndex !== -1) {
                console.log(`Found meal at index ${mealIndex} in log ${log._id}`);
                // Remove the meal
                log.meals.splice(mealIndex, 1);
                await log.save();
                mealFound = true;
                updatedLog = log;
                break;
            }
        }
        
        if (!mealFound) {
            return res.status(404).json({ error: 'Meal not found in any nutrition logs' });
        }
        
        res.status(200).json({
            message: 'Meal deleted successfully',
            nutritionLog: updatedLog
        });
    } catch (error) {
        console.error('Error deleting meal:', error);
        res.status(500).json({ error: error.message });
    }
};

// Add water intake to a nutrition log
exports.addWaterIntake = async (req, res) => {
    const { userId, date, waterIntake } = req.body;
    
    try {
        console.log('Adding water intake with data:', { userId, date, waterIntake });
        
        // Validate required fields
        if (!userId || !waterIntake || !waterIntake.amount) {
            return res.status(400).json({ error: 'userId and water amount are required' });
        }
        
        // Format date (strip time part)
        const formattedDate = new Date(date || Date.now());
        formattedDate.setHours(0, 0, 0, 0);
        
        console.log('Formatted date:', formattedDate);
        
        // Find or create nutrition log for this date
        let nutritionLog = await Nutrition.findOne({
            userId,
            date: {
                $gte: formattedDate,
                $lt: new Date(formattedDate.getTime() + 24 * 60 * 60 * 1000)
            }
        });
        
        console.log('Found nutrition log:', nutritionLog ? 'Yes' : 'No');
        
        if (!nutritionLog) {
            console.log('Creating new nutrition log');
            nutritionLog = new Nutrition({
                userId,
                date: formattedDate,
                meals: [],
                waterIntake: []
            });
        }
        
        // Add the water intake
        nutritionLog.waterIntake.push(waterIntake);
        await nutritionLog.save();
        
        console.log('Water intake added successfully');
        
        res.status(200).json({
            message: 'Water intake added successfully',
            nutritionLog
        });
    } catch (error) {
        console.error('Error adding water intake:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get nutrition log for a specific date
exports.getNutritionLogByDate = async (req, res) => {
    const { userId, date } = req.params;
    
    try {
        // Format date (strip time part)
        const formattedDate = new Date(date || Date.now());
        formattedDate.setHours(0, 0, 0, 0);
        
        // Find nutrition log for this date
        const nutritionLog = await Nutrition.findOne({
            userId,
            date: {
                $gte: formattedDate,
                $lt: new Date(formattedDate.getTime() + 24 * 60 * 60 * 1000)
            }
        });
        
        if (!nutritionLog) {
            return res.status(404).json({ 
                message: 'No nutrition log found for this date',
                nutritionLog: {
                    userId,
                    date: formattedDate,
                    meals: [],
                    waterIntake: [],
                    totalCalories: 0,
                    totalProtein: 0,
                    totalCarbs: 0,
                    totalFat: 0,
                    totalWater: 0
                }
            });
        }
        
        res.status(200).json({ nutritionLog });
    } catch (error) {
        console.error('Error fetching nutrition log:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get nutrition logs for a date range
exports.getNutritionLogs = async (req, res) => {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    
    try {
        console.log('Getting nutrition logs for user:', userId);
        console.log('Date range:', { startDate, endDate });
        
        // Build query
        const query = { userId };
        
        if (startDate || endDate) {
            query.date = {};
            
            if (startDate) {
                const formattedStartDate = new Date(startDate);
                formattedStartDate.setHours(0, 0, 0, 0);
                query.date.$gte = formattedStartDate;
                console.log('Formatted start date:', formattedStartDate);
            }
            
            if (endDate) {
                const formattedEndDate = new Date(endDate);
                formattedEndDate.setHours(23, 59, 59, 999);
                query.date.$lte = formattedEndDate;
                console.log('Formatted end date:', formattedEndDate);
            }
        }
        
        console.log('Query:', JSON.stringify(query));
        
        // Find nutrition logs
        const nutritionLogs = await Nutrition.find(query).sort({ date: -1 });
        
        console.log(`Found ${nutritionLogs.length} nutrition logs`);
        if (nutritionLogs.length > 0) {
            console.log('First log date:', nutritionLogs[0].date);
            console.log('First log meals count:', nutritionLogs[0].meals.length);
            console.log('First log water intake count:', nutritionLogs[0].waterIntake.length);
        }
        
        res.status(200).json({ logs: nutritionLogs });
    } catch (error) {
        console.error('Error fetching nutrition logs:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get nutrition statistics for a date range
exports.getNutritionStats = async (req, res) => {
    const { userId } = req.params;
    const { startDate, endDate, period = 'week' } = req.query;
    
    try {
        // Calculate date range based on period if not provided
        let formattedStartDate, formattedEndDate;
        
        if (startDate && endDate) {
            formattedStartDate = new Date(startDate);
            formattedStartDate.setHours(0, 0, 0, 0);
            
            formattedEndDate = new Date(endDate);
            formattedEndDate.setHours(23, 59, 59, 999);
        } else {
            formattedEndDate = new Date();
            formattedEndDate.setHours(23, 59, 59, 999);
            
            formattedStartDate = new Date();
            
            switch (period) {
                case 'week':
                    formattedStartDate.setDate(formattedEndDate.getDate() - 7);
                    break;
                case 'month':
                    formattedStartDate.setMonth(formattedEndDate.getMonth() - 1);
                    break;
                case 'year':
                    formattedStartDate.setFullYear(formattedEndDate.getFullYear() - 1);
                    break;
                default:
                    formattedStartDate.setDate(formattedEndDate.getDate() - 7);
            }
            
            formattedStartDate.setHours(0, 0, 0, 0);
        }
        
        // Find nutrition logs in the date range
        const nutritionLogs = await Nutrition.find({
            userId,
            date: {
                $gte: formattedStartDate,
                $lte: formattedEndDate
            }
        }).sort({ date: 1 });
        
        if (nutritionLogs.length === 0) {
            return res.status(200).json({
                message: 'No nutrition logs found for this period',
                stats: {
                    averageCalories: 0,
                    averageProtein: 0,
                    averageCarbs: 0,
                    averageFat: 0,
                    averageWater: 0,
                    totalDays: 0,
                    caloriesByDay: [],
                    macrosByDay: []
                }
            });
        }
        
        // Calculate statistics
        const totalDays = nutritionLogs.length;
        
        const totalCalories = nutritionLogs.reduce((sum, log) => sum + log.totalCalories, 0);
        const totalProtein = nutritionLogs.reduce((sum, log) => sum + log.totalProtein, 0);
        const totalCarbs = nutritionLogs.reduce((sum, log) => sum + log.totalCarbs, 0);
        const totalFat = nutritionLogs.reduce((sum, log) => sum + log.totalFat, 0);
        const totalWater = nutritionLogs.reduce((sum, log) => sum + log.totalWater, 0);
        
        const averageCalories = totalCalories / totalDays;
        const averageProtein = totalProtein / totalDays;
        const averageCarbs = totalCarbs / totalDays;
        const averageFat = totalFat / totalDays;
        const averageWater = totalWater / totalDays;
        
        // Prepare data for charts
        const caloriesByDay = nutritionLogs.map(log => ({
            date: log.date,
            calories: log.totalCalories
        }));
        
        const macrosByDay = nutritionLogs.map(log => ({
            date: log.date,
            protein: log.totalProtein,
            carbs: log.totalCarbs,
            fat: log.totalFat
        }));
        
        res.status(200).json({
            stats: {
                averageCalories,
                averageProtein,
                averageCarbs,
                averageFat,
                averageWater,
                totalDays,
                caloriesByDay,
                macrosByDay
            }
        });
    } catch (error) {
        console.error('Error fetching nutrition statistics:', error);
        res.status(500).json({ error: error.message });
    }
};

// Set daily nutrition goals
exports.setNutritionGoals = async (req, res) => {
    const { userId, dailyGoals } = req.body;
    const userIdParam = req.params.userId || userId;
    
    try {
        // Validate required fields
        if (!userIdParam || !dailyGoals) {
            return res.status(400).json({ error: 'userId and dailyGoals are required' });
        }
        
        // Update user's nutrition goals
        const user = await User.findById(userIdParam);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Initialize nutritionPreferences if it doesn't exist
        if (!user.nutritionPreferences) {
            user.nutritionPreferences = {};
        }
        
        // Update daily goals
        user.nutritionPreferences.dailyGoals = {
            calories: dailyGoals.calories || 2000,
            protein: dailyGoals.protein || 150,
            carbs: dailyGoals.carbs || 200,
            fat: dailyGoals.fat || 65,
            fiber: dailyGoals.fiber || 30,
            sugar: dailyGoals.sugar || 50,
            sodium: dailyGoals.sodium || 2300,
            water: dailyGoals.water || 2000
        };
        
        await user.save();
        
        res.status(200).json({
            message: 'Nutrition goals updated successfully',
            goals: user.nutritionPreferences.dailyGoals
        });
    } catch (error) {
        console.error('Error setting nutrition goals:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get nutrition goals for a user
exports.getNutritionGoals = async (req, res) => {
    const { userId } = req.params;
    
    try {
        // Find user
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Get nutrition goals
        const goals = user.nutritionPreferences?.dailyGoals || {
            calories: 2000,
            protein: 150,
            carbs: 200,
            fat: 65,
            fiber: 30,
            sugar: 50,
            sodium: 2300,
            water: 2000
        };
        
        res.status(200).json({ goals });
    } catch (error) {
        console.error('Error fetching nutrition goals:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get personalized nutrition plan for a user
exports.getNutritionPlan = async (req, res) => {
    const { userId } = req.params;
    
    try {
        // Find user's nutrition plan
        let plan = await NutritionPlan.findOne({ userId });
        
        // If no plan exists, create a default one
        if (!plan) {
            plan = {
                userId,
                meals: [
                    {
                        name: 'Breakfast',
                        time: '08:00',
                        suggestions: [
                            'Oatmeal with berries and nuts',
                            'Greek yogurt with honey and granola',
                            'Whole grain toast with avocado and eggs'
                        ]
                    },
                    {
                        name: 'Lunch',
                        time: '12:30',
                        suggestions: [
                            'Grilled chicken salad with mixed vegetables',
                            'Quinoa bowl with roasted vegetables and tofu',
                            'Turkey and vegetable wrap with hummus'
                        ]
                    },
                    {
                        name: 'Dinner',
                        time: '19:00',
                        suggestions: [
                            'Baked salmon with steamed vegetables and brown rice',
                            'Lean beef stir-fry with vegetables and noodles',
                            'Vegetable and bean chili with whole grain bread'
                        ]
                    },
                    {
                        name: 'Snacks',
                        time: 'Various',
                        suggestions: [
                            'Apple with almond butter',
                            'Carrot sticks with hummus',
                            'Greek yogurt with berries',
                            'Handful of mixed nuts'
                        ]
                    }
                ],
                recommendations: [
                    'Focus on whole, unprocessed foods',
                    'Aim for at least 5 servings of fruits and vegetables daily',
                    'Stay hydrated by drinking at least 2 liters of water per day',
                    'Limit processed foods, added sugars, and saturated fats'
                ],
                restrictions: []
            };
        }
        
        res.status(200).json({ plan });
    } catch (error) {
        console.error('Error fetching nutrition plan:', error);
        res.status(500).json({ error: error.message });
    }
};

// Update personalized nutrition plan for a user
exports.updateNutritionPlan = async (req, res) => {
    const { userId } = req.params;
    const { meals, recommendations, restrictions } = req.body;
    
    try {
        // Find user's nutrition plan
        let plan = await NutritionPlan.findOne({ userId });
        
        // If no plan exists, create a new one
        if (!plan) {
            plan = new NutritionPlan({
                userId,
                meals: meals || [],
                recommendations: recommendations || [],
                restrictions: restrictions || []
            });
        } else {
            // Update existing plan
            if (meals) plan.meals = meals;
            if (recommendations) plan.recommendations = recommendations;
            if (restrictions) plan.restrictions = restrictions;
        }
        
        await plan.save();
        
        res.status(200).json({
            message: 'Nutrition plan updated successfully',
            plan
        });
    } catch (error) {
        console.error('Error updating nutrition plan:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = exports;