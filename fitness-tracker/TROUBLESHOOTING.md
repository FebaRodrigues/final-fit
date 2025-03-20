# Troubleshooting Guide

This guide will help you resolve common issues with the Fitness Management System.

## Server Connection Issues

If you're seeing errors like `ERR_CONNECTION_REFUSED` when trying to access the server, follow these steps:

### 1. Check if the Server is Running

Run the server check script:

```powershell
.\check-server-config.ps1
```

This will check if your server configuration is correct and if MongoDB is accessible.

### 2. Start the Server

If the server is not running, start it using:

```powershell
.\run-server.ps1
```

### 3. Try the Simple Server

If the main server is having issues, try running the simple test server:

```powershell
.\run-simple-server.ps1
```

### 4. Check MongoDB Connection

Make sure MongoDB is running and accessible. The server requires a MongoDB connection to function properly.

If you're using a local MongoDB instance, make sure it's running. If you're using MongoDB Atlas, check your internet connection and make sure the connection string in your `.env` file is correct.

### 5. Check for Port Conflicts

The server is configured to run on port 5051 by default. Make sure no other application is using this port.

You can check if the port is in use with:

```powershell
netstat -ano | findstr :5051
```

If you see output, it means the port is in use. You can either stop the other application or change the port in the `.env` file.

### 6. Check Firewall Settings

Make sure your firewall is not blocking the server. You can temporarily disable the firewall to test if this is the issue.

### 7. Check Environment Variables

Make sure your `.env` file in the Server directory has the correct configuration:

```
PORT=5051
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
```

## Client Connection Issues

If the client is having trouble connecting to the server:

### 1. Check API Configuration

The client is configured to connect to the server at `http://localhost:5051/api`. Make sure this matches the server's address and port.

### 2. Start the Client

Start the client using:

```powershell
.\run-client.ps1
```

### 3. Clear Browser Cache

Try clearing your browser cache and cookies, then reload the page.

### 4. Check Console for Errors

Open your browser's developer tools (F12) and check the console for any error messages.

## Database Issues

If you're having issues with the database:

### 1. Check MongoDB Connection

Make sure MongoDB is running and accessible.

### 2. Check Database Content

You can run the test goal creation script to add some test data to the database:

```powershell
.\create-test-goals.ps1
```

## Still Having Issues?

If you're still having issues after trying these steps, please provide the following information:

1. The exact error message you're seeing
2. The steps you've taken to try to resolve the issue
3. The output of the server check script
4. Any relevant logs from the server or client

This will help us diagnose and resolve the issue more quickly. 