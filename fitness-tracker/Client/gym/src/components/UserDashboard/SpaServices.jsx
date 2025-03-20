import React, { useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import API from '../../api';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import useMembershipAccess from '../../hooks/useMembershipAccess';
import { useNavigate } from 'react-router-dom';
import '../../styles/SpaServices.css';
import axios from 'axios';

// Material UI imports
import { 
  Button, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Checkbox, 
  FormControlLabel,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Grid,
  Chip,
  Paper,
  Container,
  CircularProgress,
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';

// Material UI Icons
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import CloseIcon from '@mui/icons-material/Close';
import SpaIcon from '@mui/icons-material/Spa';
import RefreshIcon from '@mui/icons-material/Refresh';

// Default service images
const DEFAULT_IMAGES = {
  'Swedish Massage': 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
  'Deep Tissue Massage': 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80',
  'Hot Stone Massage': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
  'Sports Massage': 'https://images.unsplash.com/photo-1573045619003-b5cd64d98c61?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
  'Aromatherapy Massage': 'https://images.unsplash.com/photo-1620733723572-11c53f73a416?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80',
  'Reflexology': 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
  'default': 'https://images.unsplash.com/photo-1519824145371-296894a0daa9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80'
};

const SpaServices = () => {
  const { user, membership } = useContext(AuthContext);
  const { hasSpaAccess, userPlan } = useMembershipAccess();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [freeSessionEligibility, setFreeSessionEligibility] = useState({
    eligible: false,
    message: ''
  });
  const [useFreeSession, setUseFreeSession] = useState(false);
  const [localMembership, setLocalMembership] = useState(() => {
    try {
      const stored = localStorage.getItem('membership');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });
  
  // Refs to track API request attempts
  const servicesRequestAttempted = useRef(false);
  const bookingsRequestAttempted = useRef(false);
  const eligibilityRequestAttempted = useRef(false);
  const apiErrorCount = useRef(0);

  // Get available time slots based on selected date
  const getAvailableTimeSlots = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    
    // Base time slots
    const baseTimeSlots = [
      '09:00', '10:00', '11:00', '12:00', '13:00', 
      '14:00', '15:00', '16:00', '17:00', '18:00'
    ];
    
    // If selected date is today, filter out past times
    if (selectedDay.getTime() === today.getTime()) {
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();
      
      return baseTimeSlots.filter(timeSlot => {
        const [hours, minutes] = timeSlot.split(':').map(Number);
        // Allow booking only if the time is at least 1 hour in the future
        return (hours > currentHour) || (hours === currentHour && minutes > currentMinutes + 60);
      });
    }
    
    return baseTimeSlots;
  };

  // Navigate to membership upgrade page
  const navigateToMembershipUpgrade = () => {
    toast.info("You need an Elite membership to access SPA services");
    try {
      navigate('/user/membership');
    } catch (error) {
      console.error("Error navigating to membership page:", error);
      try {
        navigate('/user/dashboard');
        toast.info("Please upgrade your membership to access SPA services");
      } catch (fallbackError) {
        console.error("Error navigating to dashboard:", fallbackError);
      }
    }
  };

  // Get effective membership (from localStorage or context)
  const effectiveMembership = localMembership || membership;
  const isEliteMember = effectiveMembership && 
                        effectiveMembership.status === 'Active' && 
                        effectiveMembership.planType === 'Elite';

  // Check if user has access to SPA services
  useEffect(() => {
    console.log("SpaServices - Checking access:", { 
      membership, 
      localMembership, 
      effectiveMembership, 
      userPlan,
      isEliteMember
    });
    
    // If user doesn't have any membership, redirect to upgrade page
    if (!hasSpaAccess()) {
      console.log("SpaServices - User doesn't have access to SPA services");
      toast.error("You need an active membership to access SPA services");
      navigateToMembershipUpgrade();
      return;
    }
    
    // Only attempt to fetch services once
    if (!servicesRequestAttempted.current) {
      servicesRequestAttempted.current = true;
      fetchServices();
    }
    
    // Only attempt to fetch bookings once
    if (!bookingsRequestAttempted.current && user?.id) {
      bookingsRequestAttempted.current = true;
      fetchBookings();
    }
    
    // Only check eligibility once for Elite members
    if (!eligibilityRequestAttempted.current && user?.id && isEliteMember) {
      eligibilityRequestAttempted.current = true;
      checkFreeSessionEligibility();
    }
    
    // Set loading to false after a timeout if it's still true
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log("SpaServices - Setting loading to false after timeout");
        setLoading(false);
      }
    }, 5000);
    
    return () => clearTimeout(timeoutId);
  }, [user, isEliteMember, hasSpaAccess, navigate, loading]);

  // Update available time slots when date changes
  useEffect(() => {
    const availableSlots = getAvailableTimeSlots();
    if (availableSlots.length > 0 && !availableSlots.includes(selectedTime)) {
      setSelectedTime(availableSlots[0]);
    }
  }, [selectedDate]);

  const fetchServices = async () => {
    try {
      console.log("SpaServices - Fetching services");
      const response = await API.get('/spa/services', { timeout: 10000 });
      setServices(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching SPA services:', error);
      
      // Increment error count
      apiErrorCount.current += 1;
      
      // Only show error toast once
      if (apiErrorCount.current <= 1) {
        setError('Failed to load SPA services. The server might be down or restarting.');
        toast.error('Error loading SPA services. Please try again later.');
      }
      
      // Set empty services array to prevent further attempts
      setServices([]);
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    if (!user || !user.id) return;
    
    try {
      console.log("SpaServices - Fetching bookings for user:", user.id);
      const response = await API.get(`/spa/bookings/user/${user.id}`, { timeout: 10000 });
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching SPA bookings:', error);
      
      // Only show error toast once
      if (apiErrorCount.current <= 1) {
        toast.error('Error loading your SPA bookings. Please try again later.');
      }
      
      // Set empty bookings array to prevent further attempts
      setBookings([]);
    }
  };

  const checkFreeSessionEligibility = async () => {
    if (!user || !user.id) return;
    
    try {
      console.log("SpaServices - Checking free session eligibility for user:", user.id);
      const response = await API.get(`/spa/bookings/free-eligibility/${user.id}`, { timeout: 10000 });
      console.log("SpaServices - Free session eligibility response:", response.data);
      setFreeSessionEligibility(response.data);
      setUseFreeSession(response.data.eligible);
    } catch (error) {
      console.error('Error checking free session eligibility:', error);
      // Set default eligibility to false
      setFreeSessionEligibility({ eligible: false, message: 'Unable to check eligibility' });
    }
  };

  const handleBookService = (service) => {
    setSelectedService(service);
    setShowBookingForm(true);
    
    // Set default date and time
    const now = new Date();
    setSelectedDate(now);
    
    // Get available time slots and set the first available
    const availableSlots = getAvailableTimeSlots();
    if (availableSlots.length > 0) {
      setSelectedTime(availableSlots[0]);
    } else {
      // If no slots available today, set date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setSelectedDate(tomorrow);
      setSelectedTime('10:00'); // Default time for tomorrow
    }
    
    // Reset notes
    setNotes('');
    
    // Check if user is eligible for free session
    if (isEliteMember && !eligibilityRequestAttempted.current) {
      eligibilityRequestAttempted.current = true;
      checkFreeSessionEligibility();
    } else {
      setUseFreeSession(false);
    }
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    
    // Validate booking time is not in the past
    const bookingDateTime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    bookingDateTime.setHours(hours, minutes, 0, 0);
    
    const now = new Date();
    if (bookingDateTime < now) {
      toast.error('Cannot book appointments in the past. Please select a future time.');
      return;
    }
    
    try {
      setLoading(true);
      
      const bookingData = {
        userId: user.id,
        serviceId: selectedService._id,
        date: selectedDate,
        time: selectedTime,
        notes,
        isFreeSession: useFreeSession && freeSessionEligibility.eligible
      };
      
      console.log("SpaServices - Submitting booking:", bookingData);
      const response = await API.post('/spa/bookings', bookingData, { timeout: 15000 });
      console.log("SpaServices - Booking response:", response.data);
      
      // Check if payment is required
      if (response.data.requiresPayment) {
        // Store booking info in session storage for payment page
        sessionStorage.setItem('pendingPayment', JSON.stringify({
          type: 'SpaService',
          bookingId: response.data.booking._id,
          amount: response.data.booking.price,
          description: `SPA Service: ${selectedService.name}`
        }));
        
        // Try to navigate to payments page
        try {
          toast.info('Redirecting to payment page...');
          navigate('/user/payments');
        } catch (error) {
          console.error("Error navigating to /user/payments:", error);
          // Fallback to user dashboard
          navigate('/user/dashboard');
          toast.info("Your booking requires payment. Please visit the payments section.");
        }
        return;
      }
      
      toast.success('SPA session booking request submitted! An admin will confirm your booking shortly.');
      setShowBookingForm(false);
      
      // Reset request attempted flag to allow a new fetch
      bookingsRequestAttempted.current = false;
      fetchBookings(); // Refresh bookings list
      
      // If this was a free session, refresh eligibility
      if (useFreeSession) {
        eligibilityRequestAttempted.current = false;
        checkFreeSessionEligibility();
      }
    } catch (error) {
      console.error('Error booking SPA session:', error);
      
      // Check if the error indicates payment is required
      if (error.response?.data?.requiresPayment) {
        toast.error('You need to make a payment for this service.');
      } else {
        toast.error(error.response?.data?.error || 'Failed to book SPA session');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId, status) => {
    // Prevent cancellation if booking is already confirmed
    if (status === 'Confirmed') {
      toast.error('Cannot cancel confirmed bookings. Please contact staff for assistance.');
      return;
    }
    
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }
    
    try {
      setLoading(true);
      await API.delete(`/spa/bookings/${bookingId}`, { timeout: 10000 });
      toast.success('Booking cancelled successfully');
      
      // Reset request attempted flag to allow a new fetch
      bookingsRequestAttempted.current = false;
      fetchBookings(); // Refresh bookings list
      
      // If this was a free session, refresh eligibility
      if (isEliteMember) {
        eligibilityRequestAttempted.current = false;
        checkFreeSessionEligibility();
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Completed':
        return 'info';
      case 'Cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  // Helper function to get the appropriate image for a service
  const getServiceImage = (service) => {
    if (!service || !service.name) return DEFAULT_IMAGES.default;
    
    // Check if there's a direct match in our DEFAULT_IMAGES
    if (DEFAULT_IMAGES[service.name]) {
      return DEFAULT_IMAGES[service.name];
    }
    
    // Check for partial matches
    const serviceName = service.name.toLowerCase();
    if (serviceName.includes('massage')) {
      if (serviceName.includes('sports')) {
        return DEFAULT_IMAGES['Sports Massage'];
      } else if (serviceName.includes('deep') || serviceName.includes('tissue')) {
        return DEFAULT_IMAGES['Deep Tissue Massage'];
      } else if (serviceName.includes('hot') || serviceName.includes('stone')) {
        return DEFAULT_IMAGES['Hot Stone Massage'];
      } else if (serviceName.includes('aroma') || serviceName.includes('therapy')) {
        return DEFAULT_IMAGES['Aromatherapy Massage'];
      } else {
        return DEFAULT_IMAGES['Swedish Massage']; // Default massage image
      }
    } else if (serviceName.includes('reflexology')) {
      return DEFAULT_IMAGES['Reflexology'];
    }
    
    // Default fallback
    return DEFAULT_IMAGES.default;
  };

  // If user doesn't have access to SPA services, show upgrade message
  if (!hasSpaAccess()) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>Membership Required!</AlertTitle>
          You need an active membership to access SPA services.
        </Alert>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={navigateToMembershipUpgrade}
        >
          Get Membership
        </Button>
      </Container>
    );
  }

  if (loading && services.length === 0 && apiErrorCount.current === 0) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress color="primary" size={60} thickness={4} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading SPA services...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Error!</AlertTitle>
          {error}
          <Typography variant="body2" sx={{ mt: 1 }}>
            The server might be down or restarting. Please try again later.
          </Typography>
        </Alert>
        <Button 
          variant="contained" 
          color="error" 
          startIcon={<RefreshIcon />}
          onClick={() => window.location.reload()}
        >
          Refresh Page
        </Button>
      </Container>
    );
  }

  return (
    <div className="spa-services-container">
      <div className="spa-services-header">
        <h2>SPA Services</h2>
        <p>Relax, rejuvenate, and recover with our premium spa treatments</p>
      </div>
      
      {/* Server Status Warning */}
      {apiErrorCount.current > 0 && (
        <Alert severity="warning" sx={{ mb: 4 }}>
          <AlertTitle>Server Connection Issues</AlertTitle>
          We're having trouble connecting to the server. Some features may not work correctly.
          Please try again later or contact support if the issue persists.
          <Button 
            variant="outlined" 
            color="warning" 
            size="small" 
            startIcon={<RefreshIcon />}
            onClick={() => window.location.reload()}
            sx={{ mt: 1 }}
          >
            Refresh Page
          </Button>
        </Alert>
      )}
      
      {/* Elite Membership Notice */}
      {isEliteMember && (
        <div className="elite-notice">
          <h3>Elite Membership Benefit</h3>
          <p>
            As an Elite member, you are entitled to one free SPA session per month.
            {freeSessionEligibility.eligible 
              ? ' You have not used your free session this month.' 
              : ' You have already used your free session this month.'}
          </p>
        </div>
      )}
      
      {/* Available Services */}
      <div>
        <h3 className="bookings-title">Available SPA Services</h3>
        {services.length > 0 ? (
          <div className="services-grid">
            {services.map((service) => (
              <div key={service._id} className="service-card">
                <div className="service-image">
                  <img 
                    src={getServiceImage(service)} 
                    alt={service.name} 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = DEFAULT_IMAGES.default;
                    }}
                  />
                </div>
                <div className="service-content">
                  <h3 className="service-title">{service.name}</h3>
                  <p className="service-description">{service.description}</p>
                  <div className="service-details">
                    <span className="service-duration">
                      <AccessTimeIcon fontSize="small" />
                      {service.duration} min
                    </span>
                    <span className="service-price">₹{service.price}</span>
                  </div>
                  <button
                    className="book-button"
                    onClick={() => handleBookService(service)}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#f9f9f9', borderRadius: 2 }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              No services available at the moment. Please try again later.
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={() => {
                servicesRequestAttempted.current = false;
                fetchServices();
              }}
              sx={{ mt: 2 }}
            >
              Retry Loading Services
            </Button>
          </Paper>
        )}
      </div>
      
      {/* Your Bookings */}
      <div className="bookings-section">
        <h3 className="bookings-title">Your SPA Bookings</h3>
        {bookings.length > 0 ? (
          <div className="bookings-list">
            {bookings.map((booking) => (
              <div key={booking._id} className="booking-item">
                <div className="booking-header">
                  <span className="booking-service">
                    {booking.serviceId?.name || booking.serviceName || 
                     (booking.price ? `Service (Price: ₹${booking.price})` : 'Unknown Service')}
                  </span>
                  <span className={`booking-status status-${booking.status.toLowerCase()}`}>
                    {booking.status}
                  </span>
                </div>
                <div className="booking-details">
                  <span className="booking-date">
                    <EventIcon fontSize="small" />
                    {new Date(booking.date).toLocaleDateString()} at {booking.time}
                  </span>
                  <div className="booking-actions">
                    {booking.status === 'Pending' && (
                      <button
                        className="btn-cancel-booking"
                        onClick={() => handleCancelBooking(booking._id, booking.status)}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
                {booking.isFreeSession && (
                  <span className="free-session-badge">
                    Free Elite Session
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
            No bookings found. Book a service to see your appointments here.
          </Typography>
        )}
      </div>
      
      {/* Booking Form Dialog */}
      <Dialog 
        open={showBookingForm && selectedService !== null} 
        onClose={() => setShowBookingForm(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(to right, #ff5733, #ff9e33)',
          color: 'white',
          position: 'relative'
        }}>
          Book {selectedService?.name}
          <IconButton
            aria-label="close"
            onClick={() => setShowBookingForm(false)}
            sx={{ 
              position: 'absolute', 
              right: 8, 
              top: 8,
              color: 'white'
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 3 }}>
            <AlertTitle>Booking Information</AlertTitle>
            Your booking will be in "Pending" status until confirmed by an admin. 
            Elite members can use their free monthly session once the booking is confirmed.
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
              Important: Once a booking is confirmed by an admin, it cannot be cancelled.
            </Typography>
          </Alert>
          
          <Box sx={{ 
            mb: 3, 
            p: 2, 
            bgcolor: 'background.paper', 
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box 
                component="img" 
                src={getServiceImage(selectedService || {})} 
                alt={selectedService?.name}
                sx={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: 2, 
                  objectFit: 'cover',
                  mr: 2
                }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = DEFAULT_IMAGES.default;
                }}
              />
              <Box>
                <Typography variant="h6" gutterBottom>{selectedService?.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedService?.description}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
                Duration: {selectedService?.duration} minutes
              </Typography>
              <Typography variant="h6" color="primary">
                ₹{selectedService?.price}
                {useFreeSession && freeSessionEligibility.eligible && 
                  <Chip 
                    label="Free with Elite" 
                    size="small" 
                    color="secondary" 
                    sx={{ ml: 1 }} 
                  />
                }
              </Typography>
            </Box>
          </Box>
          
          <form onSubmit={handleSubmitBooking}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="date-label">Date</InputLabel>
                  <DatePicker
                    selected={selectedDate}
                    onChange={date => setSelectedDate(date)}
                    minDate={new Date()}
                    customInput={
                      <TextField 
                        fullWidth 
                        variant="outlined"
                        label="Date"
                      />
                    }
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="time-label">Time</InputLabel>
                  <Select
                    labelId="time-label"
                    value={selectedTime}
                    onChange={e => setSelectedTime(e.target.value)}
                    label="Time"
                  >
                    {getAvailableTimeSlots().map(time => (
                      <MenuItem key={time} value={time}>{time}</MenuItem>
                    ))}
                  </Select>
                  {getAvailableTimeSlots().length === 0 && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      No available time slots for today. Please select a future date.
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Notes (Optional)"
                  multiline
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  fullWidth
                  placeholder="Any special requests or information"
                  variant="outlined"
                />
              </Grid>
              
              {/* Free Session Checkbox for Elite Members */}
              {isEliteMember && freeSessionEligibility.eligible && (
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={useFreeSession}
                        onChange={e => setUseFreeSession(e.target.checked)}
                        color="secondary"
                      />
                    }
                    label="Use my free Elite session for this month"
                  />
                </Grid>
              )}
            </Grid>
          </form>
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#f9f9f9' }}>
          <Button 
            onClick={() => setShowBookingForm(false)}
            color="inherit"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitBooking}
            variant="contained" 
            color="primary"
            disabled={loading || getAvailableTimeSlots().length === 0}
            sx={{ 
              background: 'linear-gradient(to right, #ff5733, #ff9e33)',
              '&:hover': {
                background: 'linear-gradient(to right, #ff4719, #ff8919)'
              }
            }}
          >
            {loading ? 'Processing...' : 'Book Now'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default SpaServices; 