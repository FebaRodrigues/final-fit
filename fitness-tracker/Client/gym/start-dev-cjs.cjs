// Direct script to start Vite development server (CommonJS version)
const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Vite development server...');

// Get the path to the node_modules/.bin directory
const binPath = path.join(__dirname, 'node_modules', '.bin');

// Command to run (use vite.cmd on Windows)
const isWindows = process.platform === 'win32';
const command = path.join(binPath, isWindows ? 'vite.cmd' : 'vite');

console.log(`Using command: ${command}`);

// Spawn the process
const viteProcess = spawn(command, ['--port', '5173', '--host'], {
  stdio: 'inherit',
  shell: true
});

viteProcess.on('error', (error) => {
  console.error('Failed to start Vite:', error);
});

// Handle process exit
process.on('SIGINT', () => {
  console.log('Shutting down Vite server...');
  viteProcess.kill();
  process.exit(0);
}); 