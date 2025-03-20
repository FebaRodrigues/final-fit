const FoodDatabase = require('../models/FoodDatabase');
const User = require('../models/User');
const { searchFoods, getFoodDetails, convertUsdaFoodToAppFormat } = require('../utils/usdaApi');

// Search food database
exports.searchFoods = async (req, res) => {
    try {
        const { query, category, limit = 20, page = 1, includeUsda = true } = req.query;
        const skip = (page - 1) * limit;
        
        // Build search criteria
        const searchCriteria = {};
        
        if (query) {
            // Use text search for query
            searchCriteria.$text = { $search: query };
        }
        
        if (category) {
            searchCriteria.category = category;
        }
        
        // Find foods matching criteria in our database
        const foods = await FoodDatabase.find(searchCriteria)
            .sort({ popularity: -1, name: 1 }) // Sort by popularity and then name
            .skip(skip)
            .limit(parseInt(limit))
            .lean();
        
        // Get total count for pagination
        const totalCount = await FoodDatabase.countDocuments(searchCriteria);
        
        // If USDA search is enabled and we have a query, also search USDA database
        let usdaFoods = [];
        if (includeUsda === 'true' && query) {
            try {
                const usdaResults = await searchFoods(query, 10, 1);
                
                if (usdaResults && usdaResults.foods) {
                    // Convert USDA foods to our format and mark them as from USDA
                    usdaFoods = usdaResults.foods.map(food => {
                        const formattedFood = convertUsdaFoodToAppFormat(food);
                        formattedFood.fromUsda = true; // Mark as from USDA
                        return formattedFood;
                    });
                }
            } catch (error) {
                console.error('Error searching USDA foods:', error);
                // Continue with just our database results if USDA search fails
            }
        }
        
        // Combine results, putting our database results first
        const combinedFoods = [...foods, ...usdaFoods];
        
        res.status(200).json({
            foods: combinedFoods,
            pagination: {
                total: totalCount + usdaFoods.length,
                page: parseInt(page),
                pages: Math.ceil((totalCount + usdaFoods.length) / limit)
            }
        });
    } catch (error) {
        console.error('Error searching food database:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get food by ID
exports.getFoodById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const food = await FoodDatabase.findById(id).lean();
        
        if (!food) {
            return res.status(404).json({ error: 'Food not found' });
        }
        
        // Increment popularity counter
        await FoodDatabase.findByIdAndUpdate(id, { $inc: { popularity: 1 } });
        
        res.status(200).json({ food });
    } catch (error) {
        console.error('Error getting food by ID:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get food by USDA FDC ID
exports.getFoodByUsdaId = async (req, res) => {
    try {
        const { fdcId } = req.params;
        
        // First check if we already have this food in our database
        const existingFood = await FoodDatabase.findOne({ usdaFdcId: fdcId }).lean();
        
        if (existingFood) {
            // Increment popularity counter
            await FoodDatabase.findByIdAndUpdate(existingFood._id, { $inc: { popularity: 1 } });
            return res.status(200).json({ food: existingFood });
        }
        
        // If not in our database, fetch from USDA API
        try {
            const usdaFood = await getFoodDetails(fdcId);
            
            if (!usdaFood) {
                return res.status(404).json({ error: 'Food not found in USDA database' });
            }
            
            // Convert to our format
            const formattedFood = convertUsdaFoodToAppFormat(usdaFood);
            formattedFood.fromUsda = true; // Mark as from USDA
            
            res.status(200).json({ food: formattedFood });
        } catch (error) {
            console.error('Error fetching food from USDA:', error);
            return res.status(500).json({ error: 'Error fetching food from USDA database' });
        }
    } catch (error) {
        console.error('Error getting food by USDA ID:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get food by barcode
exports.getFoodByBarcode = async (req, res) => {
    try {
        const { barcode } = req.params;
        
        const food = await FoodDatabase.findOne({ barcode }).lean();
        
        if (!food) {
            return res.status(404).json({ error: 'Food not found' });
        }
        
        // Increment popularity counter
        await FoodDatabase.findByIdAndUpdate(food._id, { $inc: { popularity: 1 } });
        
        res.status(200).json({ food });
    } catch (error) {
        console.error('Error getting food by barcode:', error);
        res.status(500).json({ error: error.message });
    }
};

// Add new food to database
exports.addFood = async (req, res) => {
    try {
        const { 
            name, category, calories, protein, carbs, fat, 
            fiber, sugar, sodium, cholesterol, potassium, 
            vitamins, servingSize, servingUnit, barcode, brand,
            usdaFdcId // Allow saving USDA foods to our database
        } = req.body;
        
        // Validate required fields
        if (!name || !calories) {
            return res.status(400).json({ error: 'Name and calories are required' });
        }
        
        // Check if food with same name and brand already exists
        const existingFood = await FoodDatabase.findOne({ 
            name: { $regex: new RegExp(`^${name}$`, 'i') },
            brand: brand || { $exists: false }
        });
        
        if (existingFood) {
            return res.status(400).json({ error: 'Food with this name and brand already exists' });
        }
        
        // If this is a USDA food, check if we already have it by USDA ID
        if (usdaFdcId) {
            const existingUsdaFood = await FoodDatabase.findOne({ usdaFdcId });
            
            if (existingUsdaFood) {
                return res.status(400).json({ error: 'This USDA food is already in the database' });
            }
        }
        
        // Create new food entry
        const newFood = new FoodDatabase({
            name,
            category,
            calories,
            protein: protein || 0,
            carbs: carbs || 0,
            fat: fat || 0,
            fiber: fiber || 0,
            sugar: sugar || 0,
            sodium: sodium || 0,
            cholesterol: cholesterol || 0,
            potassium: potassium || 0,
            vitamins: vitamins || {},
            servingSize: servingSize || 100,
            servingUnit: servingUnit || 'g',
            barcode,
            brand,
            isVerified: req.user.role === 'admin' || !!usdaFdcId, // USDA foods are considered verified
            addedBy: req.user._id,
            usdaFdcId // Store USDA FDC ID if provided
        });
        
        await newFood.save();
        
        res.status(201).json({
            message: 'Food added successfully',
            food: newFood
        });
    } catch (error) {
        console.error('Error adding food:', error);
        res.status(500).json({ error: error.message });
    }
};

// Import food from USDA to our database
exports.importUsdaFood = async (req, res) => {
    try {
        const { fdcId } = req.body;
        
        if (!fdcId) {
            return res.status(400).json({ error: 'USDA FDC ID is required' });
        }
        
        // Check if already in our database
        const existingFood = await FoodDatabase.findOne({ usdaFdcId: fdcId });
        
        if (existingFood) {
            return res.status(400).json({ error: 'This USDA food is already in the database' });
        }
        
        // Fetch from USDA API
        try {
            const usdaFood = await getFoodDetails(fdcId);
            
            if (!usdaFood) {
                return res.status(404).json({ error: 'Food not found in USDA database' });
            }
            
            // Convert to our format
            const formattedFood = convertUsdaFoodToAppFormat(usdaFood);
            
            // Add to our database
            const newFood = new FoodDatabase({
                ...formattedFood,
                isVerified: true, // USDA foods are considered verified
                addedBy: req.user._id,
                usdaFdcId: fdcId
            });
            
            await newFood.save();
            
            res.status(201).json({
                message: 'USDA food imported successfully',
                food: newFood
            });
        } catch (error) {
            console.error('Error importing USDA food:', error);
            return res.status(500).json({ error: 'Error importing food from USDA database' });
        }
    } catch (error) {
        console.error('Error importing USDA food:', error);
        res.status(500).json({ error: error.message });
    }
};

// Update food in database (admin only)
exports.updateFood = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        // Find the food
        const food = await FoodDatabase.findById(id);
        
        if (!food) {
            return res.status(404).json({ error: 'Food not found' });
        }
        
        // Update food data
        Object.keys(updateData).forEach(key => {
            if (key !== '_id' && key !== 'addedBy' && key !== 'createdAt') {
                food[key] = updateData[key];
            }
        });
        
        // Set as verified if admin is updating
        if (req.user.role === 'admin') {
            food.isVerified = true;
        }
        
        await food.save();
        
        res.status(200).json({
            message: 'Food updated successfully',
            food
        });
    } catch (error) {
        console.error('Error updating food:', error);
        res.status(500).json({ error: error.message });
    }
};

// Delete food from database (admin only)
exports.deleteFood = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await FoodDatabase.findByIdAndDelete(id);
        
        if (!result) {
            return res.status(404).json({ error: 'Food not found' });
        }
        
        res.status(200).json({
            message: 'Food deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting food:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get food categories
exports.getFoodCategories = async (req, res) => {
    try {
        const categories = [
            'Fruits', 'Vegetables', 'Grains', 'Protein Foods', 
            'Dairy', 'Oils', 'Beverages', 'Snacks', 'Fast Food',
            'Prepared Meals', 'Supplements', 'Other'
        ];
        
        res.status(200).json({ categories });
    } catch (error) {
        console.error('Error getting food categories:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get recently used foods by user
exports.getRecentFoods = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Find user
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Get recent foods from user's nutrition logs
        const recentFoodIds = user.recentFoods || [];
        
        // Get food details
        const recentFoods = await FoodDatabase.find({
            _id: { $in: recentFoodIds }
        }).lean();
        
        res.status(200).json({ recentFoods });
    } catch (error) {
        console.error('Error getting recent foods:', error);
        res.status(500).json({ error: error.message });
    }
};

// Add food to user's recent foods
exports.addToRecentFoods = async (req, res) => {
    try {
        const { userId, foodId } = req.body;
        
        // Find user
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Initialize recentFoods array if it doesn't exist
        if (!user.recentFoods) {
            user.recentFoods = [];
        }
        
        // Remove food if it already exists in the array
        user.recentFoods = user.recentFoods.filter(id => id.toString() !== foodId);
        
        // Add food to the beginning of the array
        user.recentFoods.unshift(foodId);
        
        // Keep only the 20 most recent foods
        if (user.recentFoods.length > 20) {
            user.recentFoods = user.recentFoods.slice(0, 20);
        }
        
        await user.save();
        
        res.status(200).json({
            message: 'Food added to recent foods',
            recentFoods: user.recentFoods
        });
    } catch (error) {
        console.error('Error adding to recent foods:', error);
        res.status(500).json({ error: error.message });
    }
}; 