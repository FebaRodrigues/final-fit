# Fitness-Management-System
The Fitness Management System is an advanced online platform designed to help users track and manage their fitness journey. It provides tools for monitoring exercise routines, nutrition, health metrics, and overall progress, ensuring a structured and goal-oriented approach to fitness

## Troubleshooting Connection Issues

If you experience connection issues with the application, follow these steps to resolve them:

### Common Error Messages

1. **"Failed to load resource: net::ERR_CONNECTION_REFUSED"**
   - This indicates that the client is trying to connect to a server port that isn't responding.
   - Solution: Use the `reset-connection.bat` script to reset port settings.

2. **"Network error - server may be down or unreachable"**
   - This indicates that the client cannot establish a connection to the server.
   - Solution: Ensure the server is running and use the `reset-connection.bat` script.

3. **"403 Forbidden"**
   - This indicates that you don't have permission to access a resource.
   - Solution: Ensure you're logged in with the correct account and have the necessary permissions.

### Quick Fix Steps

1. **Run the Reset Connection Utility**
   - Execute `reset-connection.bat` from the main directory
   - This will kill any existing Node.js processes, reset port settings, and restart the application

2. **Clear Browser Cache**
   - Open your browser's developer tools (F12 or Ctrl+Shift+I)
   - Go to the Application tab
   - Select "Storage" on the left sidebar
   - Check "Local Storage" and "Cookies"
   - Click "Clear site data" button
   - Close and reopen your browser

3. **Restart the Application**
   - Close all browser windows
   - Run `start-app.bat` to restart the application

### Advanced Troubleshooting

If the above steps don't resolve your issue:

1. **Check Server Logs**
   - Look at `Server/server.log` for any error messages

2. **Verify Port Settings**
   - Check `current-port.txt` to ensure it contains the correct port (usually 7000)

3. **Check Network Configuration**
   - Ensure no firewall is blocking connections to localhost ports 7000-7005

For persistent issues, please contact support with details about the error messages you're seeing.
