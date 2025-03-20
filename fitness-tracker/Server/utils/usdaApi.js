// utils/usdaApi.js
const axios = require('axios');

// USDA FoodData Central API configuration
const USDA_API_KEY = 'VcbSslP5xeCF06aDL09lwEtc99AeGDc0oKUfpJm1';
const USDA_API_URL = 'https://api.nal.usda.gov/fdc/v1';

/**
 * Search for foods in the USDA database
 * @param {string} query - Search query
 * @param {number} pageSize - Number of results to return (default: 25)
 * @param {number} pageNumber - Page number (default: 1)
 * @returns {Promise} - Promise resolving to search results
 */
const searchFoods = async (query, pageSize = 25, pageNumber = 1) => {
  try {
    const response = await axios.get(`${USDA_API_URL}/foods/search`, {
      params: {
        api_key: USDA_API_KEY,
        query,
        pageSize,
        pageNumber,
        dataType: 'Foundation,SR Legacy,Survey (FNDDS),Branded'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error searching USDA foods:', error);
    throw error;
  }
};

/**
 * Get detailed food information by FDC ID
 * @param {string} fdcId - FDC ID of the food
 * @returns {Promise} - Promise resolving to food details
 */
const getFoodDetails = async (fdcId) => {
  try {
    const response = await axios.get(`${USDA_API_URL}/food/${fdcId}`, {
      params: {
        api_key: USDA_API_KEY
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting USDA food details:', error);
    throw error;
  }
};

/**
 * Convert USDA food data to our application's food format
 * @param {Object} usdaFood - Food data from USDA API
 * @returns {Object} - Formatted food data for our application
 */
const convertUsdaFoodToAppFormat = (usdaFood) => {
  // Initialize with default values
  const formattedFood = {
    name: usdaFood.description || 'Unknown Food',
    category: mapUsdaFoodCategory(usdaFood.foodCategory || ''),
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    cholesterol: 0,
    potassium: 0,
    vitamins: {
      a: 0,
      c: 0,
      d: 0,
      calcium: 0,
      iron: 0
    },
    servingSize: 100,
    servingUnit: 'g',
    barcode: usdaFood.gtinUpc || '',
    brand: usdaFood.brandName || '',
    isVerified: true, // USDA data is considered verified
    usdaFdcId: usdaFood.fdcId
  };
  
  // Extract nutrients
  if (usdaFood.foodNutrients) {
    usdaFood.foodNutrients.forEach(nutrient => {
      const { nutrientId, value } = nutrient;
      
      // Map USDA nutrient IDs to our application's properties
      switch (nutrientId) {
        case 1008: // Energy (kcal)
          formattedFood.calories = value || 0;
          break;
        case 1003: // Protein
          formattedFood.protein = value || 0;
          break;
        case 1005: // Carbohydrates
          formattedFood.carbs = value || 0;
          break;
        case 1004: // Total lipids (fat)
          formattedFood.fat = value || 0;
          break;
        case 1079: // Fiber
          formattedFood.fiber = value || 0;
          break;
        case 2000: // Sugars
          formattedFood.sugar = value || 0;
          break;
        case 1093: // Sodium
          formattedFood.sodium = value || 0;
          break;
        case 1253: // Cholesterol
          formattedFood.cholesterol = value || 0;
          break;
        case 1092: // Potassium
          formattedFood.potassium = value || 0;
          break;
        case 1106: // Vitamin A
          formattedFood.vitamins.a = value || 0;
          break;
        case 1162: // Vitamin C
          formattedFood.vitamins.c = value || 0;
          break;
        case 1114: // Vitamin D
          formattedFood.vitamins.d = value || 0;
          break;
        case 1087: // Calcium
          formattedFood.vitamins.calcium = value || 0;
          break;
        case 1089: // Iron
          formattedFood.vitamins.iron = value || 0;
          break;
      }
    });
  }
  
  // Set serving size if available
  if (usdaFood.servingSize && usdaFood.servingSizeUnit) {
    formattedFood.servingSize = usdaFood.servingSize;
    formattedFood.servingUnit = mapServingUnit(usdaFood.servingSizeUnit);
  }
  
  return formattedFood;
};

/**
 * Map USDA food category to our application's categories
 * @param {string} usdaCategory - USDA food category
 * @returns {string} - Mapped category
 */
const mapUsdaFoodCategory = (usdaCategory) => {
  const categoryMap = {
    'Fruits and Fruit Juices': 'Fruits',
    'Vegetables and Vegetable Products': 'Vegetables',
    'Cereal Grains and Pasta': 'Grains',
    'Breakfast Cereals': 'Grains',
    'Baked Products': 'Grains',
    'Meat, Poultry, Fish and Seafood': 'Protein Foods',
    'Legumes and Legume Products': 'Protein Foods',
    'Nuts and Seeds': 'Protein Foods',
    'Eggs and Egg Products': 'Protein Foods',
    'Dairy and Egg Products': 'Dairy',
    'Milk and Milk Products': 'Dairy',
    'Cheese and Cheese Products': 'Dairy',
    'Fats and Oils': 'Oils',
    'Beverages': 'Beverages',
    'Snacks': 'Snacks',
    'Fast Foods': 'Fast Food',
    'Restaurant Foods': 'Fast Food',
    'Meals, Entrees, and Side Dishes': 'Prepared Meals',
    'Soups, Sauces, and Gravies': 'Prepared Meals',
    'Sweets': 'Snacks',
    'Spices and Herbs': 'Other',
    'Baby Foods': 'Other'
  };
  
  return categoryMap[usdaCategory] || 'Other';
};

/**
 * Map USDA serving unit to our application's serving units
 * @param {string} usdaUnit - USDA serving unit
 * @returns {string} - Mapped serving unit
 */
const mapServingUnit = (usdaUnit) => {
  const unitMap = {
    'g': 'g',
    'ml': 'ml',
    'oz': 'oz',
    'cup': 'cup',
    'tbsp': 'tbsp',
    'tsp': 'tsp',
    'piece': 'piece',
    'serving': 'serving'
  };
  
  return unitMap[usdaUnit.toLowerCase()] || 'g';
};

module.exports = {
  searchFoods,
  getFoodDetails,
  convertUsdaFoodToAppFormat
}; 