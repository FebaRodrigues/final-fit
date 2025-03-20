// const Recommendation = require('../models/Recommendation'); // Adjust the path as necessary
// const Goal = require('../models/Goal'); // Ensure you have the Goal model imported

// // Get recommendations based on user goals
// exports.getRecommendationsByGoals = async (req, res) => {
//     const { userId } = req.params;
//     try {
//         const goals = await Goal.find({ userId });
//         // Example logic for recommendations
//         const recommendations = goals.map(goal => {
//             if (goal.goalType === 'weight loss') {
//                 return { exercise: 'Cardio', duration: '30 minutes', nutrition: 'Low-carb diet' };
//             } else if (goal.goalType === 'muscle gain') {
//                 return { exercise: 'Strength training', duration: '1 hour', nutrition: 'High-protein diet' };
//             }
//             return null;
//         }).filter(Boolean);
//         res.status(200).json(recommendations);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// // Get recommendations for a specific user
// exports.getRecommendations = async (req, res) => {
//     const { id } = req.params; // Get the user ID from the request parameters
//     try {
//         // Fetch recommendations from the database based on user ID
//         const recommendations = await Recommendation.find({ userId: id });
//         if (!recommendations || recommendations.length === 0) {
//             return res.status(404).json({ message: 'No recommendations found for this user' });
//         }
//         res.status(200).json(recommendations); // Return the recommendations
//     } catch (error) {
//         res.status(500).json({ error: error.message }); // Handle any errors
//     }
// };

// // Create a recommendation
// exports.createRecommendation = async (req, res) => {
//     const { userId, recommendations } = req.body; // Extract data from the request body
//     try {
//         const newRecommendation = new Recommendation({
//             userId,
//             recommendations,
//             createdAt: new Date() // Set the current timestamp
//         });
//         await newRecommendation.save(); // Save the recommendation to the database
//         res.status(201).json({ message: 'Recommendation created successfully', recommendation: newRecommendation });
//     } catch (error) {
//         res.status(500).json({ error: error.message }); // Handle any errors
//     }
// };