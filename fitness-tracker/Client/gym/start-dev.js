// Direct script to start Vite development server
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starting Vite development server...');

// Get the path to the node_modules/.bin directory
const binPath = join(__dirname, 'node_modules', '.bin');

// Command to run (use vite.cmd on Windows)
const isWindows = process.platform === 'win32';
const command = join(binPath, isWindows ? 'vite.cmd' : 'vite');

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