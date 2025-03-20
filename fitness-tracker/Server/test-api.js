// test-api.js
const axios = require('axios');

const BASE_URL = 'http://localhost:5050/api';

async function testEndpoints() {
  try {
    console.log('Testing API endpoints...');
    
    // Test health endpoint
    try {
      const healthResponse = await axios.get(`${BASE_URL}/health`);
      console.log('Health endpoint:', healthResponse.status, healthResponse.data);
    } catch (error) {
      console.error('Health endpoint error:', error.message);
    }
    
    // Test food database categories endpoint
    try {
      const categoriesResponse = await axios.get(`${BASE_URL}/food-database/categories/list`);
      console.log('Food categories endpoint:', categoriesResponse.status, categoriesResponse.data);
    } catch (error) {
      console.error('Food categories endpoint error:', error.message);
      console.error('Error details:', error.response?.data || 'No response data');
    }
    
    // Test nutrition goals endpoint
    try {
      const goalsResponse = await axios.get(`${BASE_URL}/nutrition/goals/67ce973756a305c6436a999c`);
      console.log('Nutrition goals endpoint:', goalsResponse.status, goalsResponse.data);
    } catch (error) {
      console.error('Nutrition goals endpoint error:', error.message);
      console.error('Error details:', error.response?.data || 'No response data');
    }
    
    // Test nutrition plan endpoint
    try {
      const planResponse = await axios.get(`${BASE_URL}/nutrition/plan/67ce973756a305c6436a999c`);
      console.log('Nutrition plan endpoint:', planResponse.status, planResponse.data);
    } catch (error) {
      console.error('Nutrition plan endpoint error:', error.message);
      console.error('Error details:', error.response?.data || 'No response data');
    }
    
    console.log('API tests completed');
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testEndpoints(); 