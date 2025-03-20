import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Button, Paper, Alert, Divider, Chip } from '@mui/material';
import { LockOutlined, ArrowUpward } from '@mui/icons-material';

/**
 * Component to display when a user doesn't have the required membership to access a feature
 * @param {Object} props - Component props
 * @param {Object} props.error - Error object with membership access details
 * @param {string} props.featureName - Name of the feature being accessed
 * @param {Function} props.onBack - Function to go back to previous page
 */
const MembershipAccessError = ({ error, featureName = 'this feature', onBack }) => {
  const requiredPlans = error?.requiredPlans || [];
  const currentPlan = error?.currentPlan || 'None';
  
  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto', mt: 4, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
        <LockOutlined sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
        <Typography variant="h5" component="h1" gutterBottom align="center" fontWeight="bold">
          Membership Required
        </Typography>
      </Box>
      
      <Alert severity="warning" sx={{ mb: 3 }}>
        {error?.message || `You need a higher membership level to access ${featureName}.`}
      </Alert>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Your current plan: 
          <Chip 
            label={currentPlan} 
            color={currentPlan === 'None' ? 'default' : 'primary'} 
            size="small" 
            sx={{ ml: 1 }}
          />
        </Typography>
        
        <Typography variant="subtitle1" gutterBottom>
          Required plan{requiredPlans.length > 1 ? 's' : ''}:
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
          {requiredPlans.map(plan => (
            <Chip 
              key={plan} 
              label={plan} 
              color="success" 
              variant={plan === currentPlan ? 'filled' : 'outlined'}
            />
          ))}
        </Box>
      </Box>
      
      <Divider sx={{ my: 3 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Button 
          variant="outlined" 
          onClick={onBack || (() => window.history.back())}
        >
          Go Back
        </Button>
        
        <Button 
          variant="contained" 
          color="primary" 
          component={Link} 
          to="/membership"
          startIcon={<ArrowUpward />}
        >
          Upgrade Membership
        </Button>
      </Box>
    </Paper>
  );
};

export default MembershipAccessError; 