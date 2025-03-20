# Fitness Tracker Server Setup

This document provides instructions for setting up and running the Fitness Tracker server.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- PowerShell (for Windows users)

## Quick Start

1. **Create Desktop Shortcuts**:
   - Run the `create-desktop-shortcut.ps1` script to create desktop shortcuts for starting and checking the server
   - Right-click the script and select "Run with PowerShell"

2. **Start the Server**:
   - Use the "Start Fitness Tracker Server" desktop shortcut
   - Or run the `start-server.ps1` script directly

3. **Check Server Status**:
   - Use the "Check Fitness Tracker Server" desktop shortcut
   - Or run the `check-server.ps1` script directly

4. **Diagnose Server Issues**:
   - If you're having problems with the server, use the "Diagnose Fitness Tracker Server" shortcut
   - Or run the `diagnose-server.ps1` script directly
   - This will check for common issues and provide guidance on how to fix them

## Manual Server Start

If you prefer to start the server manually:

1. Open a terminal/command prompt
2. Navigate to the Server directory:
   ```
   cd fitness-tracker/Server
   ```
3. Run the server:
   ```
   node start-server.js
   ```

## Troubleshooting

### Server Won't Start

1. Check if the server is already running:
   - Run the `check-server.ps1` script
   - Or try accessing http://localhost:5050 in your browser

2. Check for port conflicts:
   - The server uses port 5050 by default
   - If another application is using this port, you may need to modify the port in the server configuration

3. Check for Node.js errors:
   - Look for error messages in the console when starting the server
   - Make sure all dependencies are installed by running `npm install` in the Server directory

4. Run the diagnostic tool:
   - Use the "Diagnose Fitness Tracker Server" shortcut
   - This will check for common issues and provide guidance

### Client Can't Connect to Server

1. Verify the server is running:
   - Run the `check-server.ps1` script

2. Check the API URL in the client:
   - The client should be configured to connect to http://localhost:5050/api
   - This is set in the `.env` file in the Client/gym directory

3. Check for CORS issues:
   - If you see CORS errors in the browser console, make sure the server is properly configured to allow requests from the client

## Server Configuration

The server configuration is stored in the following files:

- `Server/config/config.js`: Main configuration file
- `Server/.env`: Environment variables (if used)

## Need Help?

If you continue to experience issues with the server:

1. Run the diagnostic tool to identify common problems
2. Check the server logs for error messages
3. Restart your computer and try again
4. Contact the development team for assistance 