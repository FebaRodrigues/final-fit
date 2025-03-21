// Simple script to test CORS configuration on Vercel
const https = require('https');

const options = {
  hostname: 'final-fit-backend.vercel.app',
  port: 443,
  path: '/api/test-cors',
  method: 'GET',
  headers: {
    'Origin': 'https://final-fit-frontend.vercel.app',
    'User-Agent': 'Node.js CORS Test'
  }
};

console.log('Sending CORS test request to https://final-fit-backend.vercel.app/api/test-cors');

const req = https.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  
  res.on('data', (chunk) => {
    console.log('Response Body:', chunk.toString());
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.end(); 