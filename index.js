// Root index.js - redirects to the actual server
console.log('Starting from root index.js');
console.log('Redirecting to fitness-tracker/Server/index.js');

try {
  require('./fitness-tracker/Server/index.js');
} catch (error) {
  console.error('Error starting server:', error.message);
  process.exit(1);
} 