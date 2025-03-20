// test-admin-routes.js
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
const serverEnvPath = path.resolve(__dirname, '.env');
if (fs.existsSync(serverEnvPath)) {
  console.log(`Loading .env from: ${serverEnvPath}`);
  dotenv.config({ path: serverEnvPath });
} else {
  console.log(`Server .env file not found at: ${serverEnvPath}`);
}

// Set up axios instance
const API = axios.create({
  baseURL: 'http://localhost:5050/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Test admin login
async function testAdminLogin() {
  try {
    console.log('Testing admin login...');
    
    // Try with default admin credentials
    const loginResponse = await API.post('/admin/login', {
      email: 'admin@fitnesstracker.com',
      password: 'adminpassword'
    });
    
    console.log('Login successful:', loginResponse.status);
    console.log('Token:', loginResponse.data.token);
    
    // Set token for subsequent requests
    API.defaults.headers.common['Authorization'] = `Bearer ${loginResponse.data.token}`;
    
    return loginResponse.data.token;
  } catch (error) {
    console.error('Error logging in with default credentials:', error.message);
    
    // Try with alternative admin credentials
    try {
      console.log('\nTrying alternative admin credentials...');
      const altLoginResponse = await API.post('/admin/login', {
        email: 'admin@example.com',
        password: 'password123'
      });
      
      console.log('Login successful with alternative credentials:', altLoginResponse.status);
      console.log('Token:', altLoginResponse.data.token);
      
      // Set token for subsequent requests
      API.defaults.headers.common['Authorization'] = `Bearer ${altLoginResponse.data.token}`;
      
      return altLoginResponse.data.token;
    } catch (altError) {
      console.error('Error logging in with alternative credentials:', altError.message);
      if (altError.response) {
        console.error('Response status:', altError.response.status);
        console.error('Response data:', altError.response.data);
      }
      return null;
    }
  }
}

// Test admin analytics endpoint
async function testAnalyticsEndpoint(token) {
  try {
    console.log('\nTesting admin analytics endpoint...');
    const response = await API.get('/admin/analytics', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Analytics endpoint response status:', response.status);
    console.log('Analytics data sample:', JSON.stringify(response.data).substring(0, 200) + '...');
    return true;
  } catch (error) {
    console.error('Error testing analytics endpoint:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Test admin memberships endpoint
async function testMembershipsEndpoint(token) {
  try {
    console.log('\nTesting admin memberships endpoint...');
    const response = await API.get('/admin/memberships', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Memberships endpoint response status:', response.status);
    console.log('Memberships data sample:', JSON.stringify(response.data).substring(0, 200) + '...');
    return true;
  } catch (error) {
    console.error('Error testing memberships endpoint:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Run tests
async function runTests() {
  try {
    const token = await testAdminLogin();
    if (!token) {
      console.error('Login failed, cannot proceed with tests');
      return;
    }
    
    const analyticsSuccess = await testAnalyticsEndpoint(token);
    const membershipsSuccess = await testMembershipsEndpoint(token);
    
    console.log('\nTest Results:');
    console.log('Analytics Endpoint:', analyticsSuccess ? 'SUCCESS' : 'FAILED');
    console.log('Memberships Endpoint:', membershipsSuccess ? 'SUCCESS' : 'FAILED');
    
    if (!analyticsSuccess || !membershipsSuccess) {
      console.log('\nPossible issues:');
      console.log('1. Check if the server is running');
      console.log('2. Check if the admin routes are properly registered in server.js');
      console.log('3. Check if the controller methods are properly implemented');
      console.log('4. Check if the required models are imported in the controller');
    }
  } catch (error) {
    console.error('Error running tests:', error.message);
  }
}

runTests(); 