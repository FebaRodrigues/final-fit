# Fitness Management System - Port 5050 Configuration

## IMPORTANT: This application must run on port 5050 to maintain data consistency

If you change the port, all user, admin, and trainer data will be lost because the database connections are tied to the specific port.

## Starting the Application on Port 5050

We've provided several scripts to ensure the application always runs on port 5050. These scripts can be run from either the root directory or the fitness-tracker directory.

### For Windows Users (Using Batch Files)

1. **Start everything with one command:**
   ```
   start-on-port-5050.bat
   ```
   This will:
   - Detect the correct directory structure
   - Kill any existing Node.js processes
   - Free up port 5050 if it's in use
   - Start the server on port 5050
   - Start the client

2. **Start only the server on port 5050:**
   ```
   ensure-port-5050.bat
   ```
   This will:
   - Detect the correct directory structure
   - Kill any existing Node.js processes
   - Free up port 5050 if it's in use
   - Start the server on port 5050

### For PowerShell Users

1. **Start everything with one command:**
   ```
   .\start-on-port-5050.ps1
   ```
   This will:
   - Detect the correct directory structure
   - Kill any existing Node.js processes
   - Free up port 5050 if it's in use
   - Start the server on port 5050
   - Start the client
   - Keep the processes running until you press Ctrl+C

2. **Start only the server on port 5050:**
   ```
   .\ensure-port-5050.ps1
   ```
   This will:
   - Detect the correct directory structure
   - Kill any existing Node.js processes
   - Free up port 5050 if it's in use
   - Start the server on port 5050

## Directory Structure Detection

The scripts are designed to work whether you run them from:
- The root directory (where fitness-tracker is a subdirectory)
- The fitness-tracker directory itself

The scripts will automatically detect the correct directory structure and adjust paths accordingly.

## Troubleshooting

If you encounter issues with the server not starting on port 5050:

1. **Check if port 5050 is already in use:**
   ```
   netstat -ano | findstr :5050
   ```

2. **Kill the process using port 5050:**
   ```
   taskkill /F /PID <PID>
   ```
   Replace `<PID>` with the process ID shown in the netstat output.

3. **Check server logs:**
   ```
   type fitness-tracker\Server\server.log
   ```
   or if you're in the fitness-tracker directory:
   ```
   type Server\server.log
   ```

4. **Check client logs:**
   ```
   type fitness-tracker\Client\gym\client.log
   ```
   or if you're in the fitness-tracker directory:
   ```
   type Client\gym\client.log
   ```

5. **Check the path structure:**
   Make sure you're running the scripts from either:
   - The root directory (where fitness-tracker is a subdirectory)
   - The fitness-tracker directory itself

## Manual Configuration

If you need to manually configure the application to use port 5050:

1. **Server configuration:**
   - Edit `fitness-tracker/Server/server.js` and ensure the PORT constant is set to 5050
   - Restart the server

2. **Client configuration:**
   - Edit `fitness-tracker/Client/gym/src/api.jsx` and ensure the `getServerUrl` function returns 'http://localhost:5050/api'
   - Restart the client

## Why Port 5050 is Required

The application is configured to use port 5050 for several reasons:

1. **Database Consistency:** The database connections are tied to the specific port
2. **Authentication:** User sessions and tokens are associated with the port
3. **Data Persistence:** Changing the port would result in loss of user, admin, and trainer data

By ensuring the application always runs on port 5050, we maintain data consistency and prevent data loss. 