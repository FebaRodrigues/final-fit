import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Alert, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { resetConnection, setServerPort } from '../../utils/resetConnection';
import axios from 'axios';

const ConnectionStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [serverPort, setServerPort] = useState(localStorage.getItem('serverPort') || '5050');
  const [openDialog, setOpenDialog] = useState(false);
  const [manualPort, setManualPort] = useState(serverPort);
  const [checkingConnection, setCheckingConnection] = useState(false);

  // Check connection status periodically
  useEffect(() => {
    const checkConnection = async () => {
      try {
        setCheckingConnection(true);
        const port = localStorage.getItem('serverPort') || '5050';
        setServerPort(port);
        
        const response = await axios.get(`http://localhost:${port}/api/health`, {
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
    resetConnection();
    window.location.reload();
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSetPort = () => {
    if (manualPort && !isNaN(parseInt(manualPort))) {
      setServerPort(manualPort);
      localStorage.setItem('serverPort', manualPort);
      setOpenDialog(false);
      window.location.reload();
    }
  };

  // Only show when there's a connection issue
  if (isConnected) return null;

  return (
    <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}>
      <Alert 
        severity="error" 
        variant="filled"
        action={
          <Box>
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleResetConnection}
              disabled={checkingConnection}
            >
              Reset
            </Button>
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleOpenDialog}
              disabled={checkingConnection}
            >
              Configure
            </Button>
          </Box>
        }
      >
        Server connection issue detected
      </Alert>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Configure Server Connection</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Current server port: {serverPort}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Server Port"
            type="number"
            fullWidth
            variant="outlined"
            value={manualPort}
            onChange={(e) => setManualPort(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSetPort}>Save & Reload</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConnectionStatus; 