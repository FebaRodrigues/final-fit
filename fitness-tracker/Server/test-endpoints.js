// test-endpoints.js
const axios = require('axios');

// Set up axios instance
const API = axios.create({
  baseURL: 'http://localhost:5050/api',
  timeout: 5000
});

// Test endpoints
async function testEndpoints() {
  try {
    console.log('Testing endpoints...');
    
    // Test health endpoint
    try {
      console.log('\nTesting health endpoint...');
      const healthResponse = await API.get('/health');
      console.log('Health endpoint response:', healthResponse.status);
    } catch (error) {
      console.error('Error testing health endpoint:', error.message);
    }
    
    // Test admin analytics endpoint
    try {
      console.log('\nTesting admin analytics endpoint...');
      const analyticsResponse = await API.get('/admin/analytics');
      console.log('Admin analytics endpoint response status:', analyticsResponse.status);
    } catch (error) {
      console.error('Error testing admin analytics endpoint:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    }
    
    // Test admin memberships endpoint
    try {
      console.log('\nTesting admin memberships endpoint...');
      const membershipsResponse = await API.get('/admin/memberships');
      console.log('Admin memberships endpoint response status:', membershipsResponse.status);
    } catch (error) {
      console.error('Error testing admin memberships endpoint:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    }
    
    // Test analytics endpoint
    try {
      console.log('\nTesting analytics endpoint...');
      const analyticsResponse = await API.get('/analytics/admin');
      console.log('Analytics endpoint response status:', analyticsResponse.status);
    } catch (error) {
      console.error('Error testing analytics endpoint:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    }
    
    console.log('\nTests completed.');
  } catch (error) {
    console.error('Error testing endpoints:', error.message);
  }
}

// Run the tests
testEndpoints(); 