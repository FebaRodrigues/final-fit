// src/utils/serverPortDetector.js
import axios from 'axios';
import { updateServerPort } from '../api';

// Global variable to track if port detection is in progress
let portDetectionPromise = null;

// Function to detect the server port
export const detectServerPort = async () => {
    // If detection is already in progress, return the existing promise
    if (portDetectionPromise) {
        return portDetectionPromise;
    }
    
    // Create a new promise for port detection
    portDetectionPromise = new Promise(async (resolve) => {
        console.log('Using API URL from environment:', import.meta.env.VITE_API_URL);
        
        // Use the environment variable for the API URL
        const apiUrl = import.meta.env.VITE_API_URL;
        
        try {
            console.log('Checking server health...');
            const response = await axios.get(`${apiUrl}/health`, {
                timeout: 5000 // Increased timeout for better chance of connection
            });
            
            if (response.status === 200 || response.status === 404) {
                console.log('Server confirmed as running');
                resolve(apiUrl);
                return apiUrl;
            }
        } catch (error) {
            console.log('Server health check failed:', error.message);
        }
        
        // Always use the environment variable
        console.log('Using API URL from environment');
        resolve(apiUrl);
        return apiUrl;
    });
    
    return portDetectionPromise;
};

// Reset the port detection promise (useful for testing or forcing a new detection)
export const resetPortDetection = () => {
    portDetectionPromise = null;
    console.log('Port detection reset. Will use API URL from environment on next call.');
};

export default detectServerPort; 