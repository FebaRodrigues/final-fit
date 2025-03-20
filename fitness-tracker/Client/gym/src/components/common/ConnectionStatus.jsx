import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Alert, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import axios from 'axios';

const ConnectionStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [checkingConnection, setCheckingConnection] = useState(false);

  // Check connection status periodically
  useEffect(() => {
    const checkConnection = async () => {
      try {
        setCheckingConnection(true);
        const apiUrl = import.meta.env.VITE_API_URL;
        
        const response = await axios.get(`${apiUrl}/health`, {
          timeout: 3000
        });
        
        if (response.status === 200) {
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      } catch (error) {
        setIsConnected(false);
      } finally {
        setCheckingConnection(false);
      }
    };

    // Check immediately on component mount
    checkConnection();
    
    // Then check every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleResetConnection = () => {
    window.location.reload();
  };

  // Only show when there's a connection issue
  if (isConnected) return null;

  return (
    <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}>
      <Alert 
        severity="error" 
        variant="filled"
        action={
          <Button 
            color="inherit" 
            size="small" 
            onClick={handleResetConnection}
            disabled={checkingConnection}
          >
            Retry
          </Button>
        }
      >
        Server connection issue detected
      </Alert>
    </Box>
  );
};

export default ConnectionStatus; 