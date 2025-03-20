// scripts/importCommonFoods.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { searchFoods, getFoodDetails, convertUsdaFoodToAppFormat } = require('../utils/usdaApi');
const FoodDatabase = require('../models/FoodDatabase');

// Load environment variables
const serverEnvPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(serverEnvPath)) {
  console.log(`Loading .env from: ${serverEnvPath}`);
  dotenv.config({ path: serverEnvPath });
} else {
  console.log(`Server .env file not found at: ${serverEnvPath}`);
  
  // Try root .env file
  const rootEnvPath = path.resolve(__dirname, '../../../.env');
  if (fs.existsSync(rootEnvPath)) {
    console.log(`Loading .env from: ${rootEnvPath}`);
    dotenv.config({ path: rootEnvPath });
  }
}

// Hardcoded MongoDB URI as a fallback
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://febarodrigues88:nhPqFzat4hq2crm1@cluster0.mvvdq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

console.log('MongoDB URI:', MONGO_URI ? 'Found' : 'Not found');

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});

// List of common food search terms
const commonFoods = [
  'apple', 'banana', 'orange', 'chicken breast', 'salmon', 
  'rice', 'bread', 'pasta', 'milk', 'egg', 
  'broccoli', 'spinach', 'carrot', 'potato', 'tomato',
  'yogurt', 'cheese', 'beef', 'oatmeal', 'avocado'
];

// Import foods
async function importCommonFoods() {
  try {
    console.log('Starting to import common foods...');
    let importedCount = 0;
    let errorCount = 0;
    
    for (const food of commonFoods) {
      try {
        console.log(`Searching for "${food}"...`);
        const searchResult = await searchFoods(food, 3, 1);
        
        if (searchResult && searchResult.foods && searchResult.foods.length > 0) {
          // Take the first result
          const usdaFood = searchResult.foods[0];
          
          // Check if already exists
          const existingFood = await FoodDatabase.findOne({ usdaFdcId: usdaFood.fdcId });
          
          if (existingFood) {
            console.log(`Food with USDA ID ${usdaFood.fdcId} already exists in database.`);
            continue;
          }
          
          // Convert to our format
          const formattedFood = convertUsdaFoodToAppFormat(usdaFood);
          
          // Add to database
          const newFood = new FoodDatabase({
            ...formattedFood,
            isVerified: true,
            usdaFdcId: usdaFood.fdcId,
            popularity: 10 // Give some initial popularity
          });
          
          await newFood.save();
          console.log(`Imported "${formattedFood.name}" (${usdaFood.fdcId})`);
          importedCount++;
          
          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          console.log(`No results found for "${food}"`);
        }
      } catch (error) {
        console.error(`Error importing "${food}":`, error.message);
        errorCount++;
      }
    }
    
    console.log(`Import completed. Imported ${importedCount} foods with ${errorCount} errors.`);
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

// Run the import
importCommonFoods(); 