import React, { useState, useEffect } from 'react';
import API, { 
  getSpaServices, 
  getSpaReports, 
  getUserSpaBookings, 
  bookSpaSession, 
  cancelSpaBooking,
  getSpaServiceById,
  createSpaService,
  updateSpaService,
  deleteSpaService,
  getAllSpaBookings,
  updateSpaBookingStatus
} from '../../api';
import { toast } from 'react-toastify';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  TextField, 
  Grid, 
  Box, 
  Chip, 
  Divider, 
  Paper, 
  IconButton, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Spa as SpaIcon, 
  AccessTime as TimeIcon, 
  AttachMoney as MoneyIcon,
  Add as AddIcon
} from '@mui/icons-material';

const SpaManagement = () => {
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabIndex, setTabIndex] = useState(0);
  
  // For service form
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    duration: 60,
    price: 0,
    image: ''
  });
  
  // For editing service
  const [editingService, setEditingService] = useState(null);
  
  // For reports
  const [reportPeriod, setReportPeriod] = useState('month');
  const [reportData, setReportData] = useState({
    totalBookings: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    freeSessionsUsed: 0,
    popularServices: []
  });

  useEffect(() => {
    fetchServices();
    fetchBookings();
    generateReport(reportPeriod);
  }, [reportPeriod]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await getSpaServices();
      console.log('SPA Services Response:', response);
      setServices(response.data || []);
      console.log('Services state after setting:', response.data);
    } catch (error) {
      console.error('Error fetching SPA services:', error);
      setError('Failed to load SPA services');
      toast.error('Error loading SPA services');
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await getAllSpaBookings();
      setBookings(response.data || []);
    } catch (error) {
      console.error('Error fetching SPA bookings:', error);
      setError('Failed to load SPA bookings');
      toast.error('Error loading SPA bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (period) => {
    try {
      setLoading(true);
      const response = await getSpaReports(period);
      setReportData(response.data);
    } catch (error) {
      console.error('Error generating SPA report:', error);
      toast.error('Error generating SPA report');
      // Set default empty report data on error
      setReportData({
        totalBookings: 0,
        confirmedBookings: 0,
        pendingBookings: 0,
        cancelledBookings: 0,
        completedBookings: 0,
        totalRevenue: 0,
        freeSessionsUsed: 0,
        popularServices: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleServiceChange = (e) => {
    const { name, value } = e.target;
    setNewService(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'duration' ? parseFloat(value) : value
    }));
  };

  const handleEditServiceChange = (e) => {
    const { name, value } = e.target;
    setEditingService(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'duration' ? parseFloat(value) : value
    }));
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    console.log('Creating new service:', newService);
    try {
      const response = await createSpaService(newService);
      console.log('Service created successfully:', response);
      toast.success('SPA service created successfully');
      setNewService({
        name: '',
        description: '',
        duration: 60,
        price: 0,
        image: ''
      });
      fetchServices();
    } catch (error) {
      console.error('Error creating SPA service:', error);
      toast.error('Failed to create SPA service');
    }
  };

  const handleEditService = (service) => {
    setEditingService(service);
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();
    try {
      await updateSpaService(editingService._id, editingService);
      toast.success('SPA service updated successfully');
      setEditingService(null);
      fetchServices();
    } catch (error) {
      console.error('Error updating SPA service:', error);
      toast.error('Failed to update SPA service');
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await deleteSpaService(serviceId);
        toast.success('SPA service deleted successfully');
        fetchServices();
      } catch (error) {
        console.error('Error deleting SPA service:', error);
        toast.error('Failed to delete SPA service');
      }
    }
  };

  const handleUpdateBookingStatus = async (bookingId, status) => {
    try {
      await updateSpaBookingStatus(bookingId, status);
      toast.success(`Booking ${status.toLowerCase()} successfully`);
      fetchBookings();
      generateReport(reportPeriod);
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Failed to update booking status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed':
        return '#4caf50';
      case 'Pending':
        return '#ff9800';
      case 'Completed':
        return '#2196f3';
      case 'Cancelled':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'Confirmed':
        return '#e8f5e9';
      case 'Pending':
        return '#fff3e0';
      case 'Completed':
        return '#e3f2fd';
      case 'Cancelled':
        return '#ffebee';
      default:
        return '#f5f5f5';
    }
  };

  if (loading && services.length === 0 && bookings.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Paper sx={{ p: 3, bgcolor: '#ffebee', color: '#c62828' }}>
          <Typography variant="h6" fontWeight="bold">Error!</Typography>
          <Typography>{error}</Typography>
        </Paper>
      </Box>
    );
  }

  const customTabStyle = {
    padding: '12px 24px',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    transition: 'all 0.3s ease',
    fontWeight: 500,
    color: '#555',
    '&:hover': {
      color: '#3f51b5',
      borderBottomColor: '#3f51b5'
    },
    '&.react-tabs__tab--selected': {
      color: '#3f51b5',
      borderBottomColor: '#3f51b5',
      fontWeight: 600
    }
  };

  return (
    <Box p={4} sx={{ maxWidth: 1200, margin: '0 auto' }}>
      <Typography variant="h4" fontWeight="bold" mb={4} color="primary">
        SPA Management
      </Typography>
      
      <Tabs 
        selectedIndex={tabIndex} 
        onSelect={index => setTabIndex(index)}
        selectedTabClassName="react-tabs__tab--selected"
      >
        <TabList className="flex border-b mb-6" style={{ borderBottom: '1px solid #e0e0e0' }}>
          <Tab className="px-6 py-3" style={customTabStyle}>Bookings</Tab>
          <Tab className="px-6 py-3" style={customTabStyle}>Services</Tab>
          <Tab className="px-6 py-3" style={customTabStyle}>Reports</Tab>
        </TabList>
        
        {/* Bookings Tab */}
        <TabPanel>
          <Typography variant="h5" fontWeight="600" mb={3}>
            SPA Bookings
          </Typography>
          
          <TableContainer component={Paper} elevation={2}>
            <Table>
              <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Service</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date & Time</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Free Session</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bookings && bookings.length > 0 ? (
                  bookings.map(booking => (
                    <TableRow key={booking._id} hover>
                      <TableCell>
                        {booking.userId?.name || 'Unknown User'}
                      </TableCell>
                      <TableCell>
                        {booking.serviceId?.name || booking.serviceName || 
                         (typeof booking.serviceId === 'string' ? `Service ID: ${booking.serviceId}` : 
                          (booking.price ? `Service (Price: ₹${booking.price})` : 'Unknown Service'))}
                      </TableCell>
                      <TableCell>
                        {booking.date ? new Date(booking.date).toLocaleDateString() : 'N/A'} at {booking.time || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={booking.status || 'Unknown'} 
                          size="small"
                          sx={{ 
                            bgcolor: getStatusBgColor(booking.status),
                            color: getStatusColor(booking.status),
                            fontWeight: 500
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {booking.isFreeSession ? 
                          <Chip label="Yes" size="small" color="primary" variant="outlined" /> : 
                          <Chip label="No" size="small" variant="outlined" />
                        }
                      </TableCell>
                      <TableCell>
                        {booking.status === 'Pending' && (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button 
                              size="small" 
                              variant="outlined" 
                              color="success"
                              onClick={() => handleUpdateBookingStatus(booking._id, 'Confirmed')}
                            >
                              Confirm
                            </Button>
                            <Button 
                              size="small" 
                              variant="outlined" 
                              color="error"
                              onClick={() => handleUpdateBookingStatus(booking._id, 'Cancelled')}
                            >
                              Cancel
                            </Button>
                          </Box>
                        )}
                        {booking.status === 'Confirmed' && (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button 
                              size="small" 
                              variant="outlined" 
                              color="primary"
                              onClick={() => handleUpdateBookingStatus(booking._id, 'Completed')}
                            >
                              Complete
                            </Button>
                            <Button 
                              size="small" 
                              variant="outlined" 
                              color="error"
                              onClick={() => handleUpdateBookingStatus(booking._id, 'Cancelled')}
                            >
                              Cancel
                            </Button>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      <Typography color="text.secondary">No bookings found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
        
        {/* Services Tab */}
        <TabPanel>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h5" fontWeight="600" mb={3}>
                SPA Services
              </Typography>
              
              <Paper elevation={2} sx={{ mb: 4, overflow: 'hidden', borderRadius: 2 }}>
                {services && services.length > 0 ? (
                  services.map(service => (
                    <Box key={service._id} sx={{ p: 3, borderBottom: '1px solid #eee', '&:last-child': { borderBottom: 'none' } }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="h6" fontWeight="500">{service.name}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1.5 }}>
                            {service.description}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Box display="flex" alignItems="center">
                              <TimeIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                              <Typography variant="body2">{service.duration} min</Typography>
                            </Box>
                            <Box display="flex" alignItems="center">
                              <MoneyIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                              <Typography variant="body2">₹{service.price}</Typography>
                            </Box>
                          </Box>
                        </Box>
                        <Box>
                          <IconButton 
                            size="small" 
                            color="primary" 
                            onClick={() => handleEditService(service)}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => handleDeleteService(service._id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Box p={4} textAlign="center">
                    <Typography color="text.secondary">No services found</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              {editingService ? (
                <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h5" fontWeight="600" mb={3}>
                    Edit Service
                  </Typography>
                  <form onSubmit={handleUpdateService}>
                    <TextField
                      fullWidth
                      label="Name"
                      name="name"
                      value={editingService.name}
                      onChange={handleEditServiceChange}
                      margin="normal"
                      required
                      variant="outlined"
                    />
                    
                    <TextField
                      fullWidth
                      label="Description"
                      name="description"
                      value={editingService.description}
                      onChange={handleEditServiceChange}
                      margin="normal"
                      required
                      multiline
                      rows={3}
                      variant="outlined"
                    />
                    
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Duration (minutes)"
                          name="duration"
                          type="number"
                          value={editingService.duration}
                          onChange={handleEditServiceChange}
                          margin="normal"
                          required
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Price (₹)"
                          name="price"
                          type="number"
                          value={editingService.price}
                          onChange={handleEditServiceChange}
                          margin="normal"
                          required
                          variant="outlined"
                        />
                      </Grid>
                    </Grid>
                    
                    <TextField
                      fullWidth
                      label="Image URL"
                      name="image"
                      value={editingService.image}
                      onChange={handleEditServiceChange}
                      margin="normal"
                      variant="outlined"
                    />
                    
                    <Box display="flex" justifyContent="flex-end" mt={3}>
                      <Button
                        variant="outlined"
                        onClick={() => setEditingService(null)}
                        sx={{ mr: 2 }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                      >
                        Update Service
                      </Button>
                    </Box>
                  </form>
                </Paper>
              ) : (
                <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h5" fontWeight="600" mb={3}>
                    Add New Service
                  </Typography>
                  <form onSubmit={handleCreateService}>
                    <TextField
                      fullWidth
                      label="Name"
                      name="name"
                      value={newService.name}
                      onChange={handleServiceChange}
                      margin="normal"
                      required
                      variant="outlined"
                    />
                    
                    <TextField
                      fullWidth
                      label="Description"
                      name="description"
                      value={newService.description}
                      onChange={handleServiceChange}
                      margin="normal"
                      required
                      multiline
                      rows={3}
                      variant="outlined"
                    />
                    
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Duration (minutes)"
                          name="duration"
                          type="number"
                          value={newService.duration}
                          onChange={handleServiceChange}
                          margin="normal"
                          required
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Price (₹)"
                          name="price"
                          type="number"
                          value={newService.price}
                          onChange={handleServiceChange}
                          margin="normal"
                          required
                          variant="outlined"
                        />
                      </Grid>
                    </Grid>
                    
                    <TextField
                      fullWidth
                      label="Image URL"
                      name="image"
                      value={newService.image}
                      onChange={handleServiceChange}
                      margin="normal"
                      variant="outlined"
                    />
                    
                    <Box display="flex" justifyContent="flex-end" mt={3}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                      >
                        Add Service
                      </Button>
                    </Box>
                  </form>
                </Paper>
              )}
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Reports Tab */}
        <TabPanel>
          <Box mb={4}>
            <Typography variant="h5" fontWeight="600" mb={3}>
              SPA Reports
            </Typography>
            
            <FormControl variant="outlined" sx={{ minWidth: 200, mb: 4 }}>
              <InputLabel>Report Period</InputLabel>
              <Select
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value)}
                label="Report Period"
              >
                <MenuItem value="week">Last Week</MenuItem>
                <MenuItem value="month">Last Month</MenuItem>
                <MenuItem value="quarter">Last Quarter</MenuItem>
                <MenuItem value="year">Last Year</MenuItem>
                <MenuItem value="all">All Time</MenuItem>
              </Select>
            </FormControl>
            
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={3} sx={{ borderRadius: 2, height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Bookings
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" mt={1}>
                      {reportData.totalBookings || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={3} sx={{ borderRadius: 2, height: '100%', bgcolor: '#e3f2fd' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Revenue
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" mt={1} color="primary">
                      ₹{(reportData.totalRevenue || 0).toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={3} sx={{ borderRadius: 2, height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      Free Sessions Used
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" mt={1}>
                      {reportData.freeSessionsUsed || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={3} sx={{ borderRadius: 2, height: '100%', bgcolor: '#fff8e1' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      Pending Bookings
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" mt={1} color="warning.dark">
                      {reportData.pendingBookings || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Card elevation={3} sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="600" mb={2}>
                      Booking Status
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                        <Box display="flex" alignItems="center">
                          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#4caf50', mr: 1.5 }} />
                          <Typography>Confirmed</Typography>
                        </Box>
                        <Typography fontWeight="600">{reportData.confirmedBookings || 0}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                        <Box display="flex" alignItems="center">
                          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ff9800', mr: 1.5 }} />
                          <Typography>Pending</Typography>
                        </Box>
                        <Typography fontWeight="600">{reportData.pendingBookings || 0}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                        <Box display="flex" alignItems="center">
                          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#2196f3', mr: 1.5 }} />
                          <Typography>Completed</Typography>
                        </Box>
                        <Typography fontWeight="600">{reportData.completedBookings || 0}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box display="flex" alignItems="center">
                          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#f44336', mr: 1.5 }} />
                          <Typography>Cancelled</Typography>
                        </Box>
                        <Typography fontWeight="600">{reportData.cancelledBookings || 0}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card elevation={3} sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="600" mb={2}>
                      Popular Services
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    {reportData.popularServices && reportData.popularServices.length > 0 ? (
                      reportData.popularServices.map((service, index) => (
                        <Box key={index} display="flex" justifyContent="space-between" alignItems="center" mb={index < reportData.popularServices.length - 1 ? 1.5 : 0}>
                          <Box display="flex" alignItems="center">
                            <SpaIcon fontSize="small" sx={{ color: '#9c27b0', mr: 1.5 }} />
                            <Typography>{service.name}</Typography>
                          </Box>
                          <Chip 
                            label={`${service.count} bookings`} 
                            size="small" 
                            sx={{ bgcolor: '#f3e5f5', color: '#9c27b0', fontWeight: 500 }}
                          />
                        </Box>
                      ))
                    ) : (
                      <Typography color="text.secondary" align="center" py={2}>
                        No data available
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Tabs>
    </Box>
  );
};

export default SpaManagement; 