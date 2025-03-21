// cors-test.js - Simple utility to test CORS and endpoints
const axios = require('axios');

// Configuration
const API_URL = process.env.API_URL || 'https://final-fit-backend.vercel.app/api';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'testpassword123';

// Function to test endpoints
async function testEndpoints() {
  try {
    console.log('Testing API endpoints...');
    console.log('API URL:', API_URL);
    
    // Test health endpoint
    console.log('\nTesting /health endpoint...');
    const healthResponse = await axios.get(`${API_URL}/health`);
    console.log('Health check response:', healthResponse.status, healthResponse.data);
    
    // Test CORS
    console.log('\nTesting CORS...');
    const corsResponse = await axios.get(`${API_URL}/cors-test`);
    console.log('CORS test response:', corsResponse.status, corsResponse.data);
    
    // Test user login (singular)
    console.log('\nTesting /user/login endpoint...');
    try {
      const loginResponse = await axios.post(`${API_URL}/user/login`, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      });
      console.log('Login response (should fail with invalid credentials):', loginResponse.status);
    } catch (error) {
      console.log('Expected login error:', error.response ? error.response.status : error.message);
    }
    
    // Test users login (plural)
    console.log('\nTesting /users/login endpoint...');
    try {
      const usersLoginResponse = await axios.post(`${API_URL}/users/login`, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      });
      console.log('Users login response (should fail with invalid credentials):', usersLoginResponse.status);
    } catch (error) {
      console.log('Expected users login error:', error.response ? error.response.status : error.message);
    }
    
    console.log('\nAll tests completed!');
  } catch (error) {
    console.error('Error testing endpoints:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the tests
testEndpoints(); 