import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import API from '../api';

const SpaServices = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch spa services
    const fetchServices = async () => {
      try {
        setLoading(true);
        const response = await API.get('/spa/services');
        setServices(response.data);
      } catch (error) {
        console.error('Error fetching spa services:', error);
        setError('Failed to load spa services');
        toast.error('Failed to load spa services');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleBooking = async (service) => {
    if (!user) {
      toast.error('Please log in to book a service');
      navigate('/login');
      return;
    }

    if (!user.hasMembership) {
      toast.warning('You need an active membership to book spa services');
      navigate('/membership');
      return;
    }

    try {
      setLoading(true);
      
      // Get current date and time
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Format time as HH:MM
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      
      // Create a booking
      const bookingData = {
        userId: user.id,
        serviceId: service._id,
        date: tomorrow.toISOString().split('T')[0], // Format as YYYY-MM-DD
        time: timeString,
        price: service.price,
        notes: `Booking for ${service.name}`
      };
      
      console.log('SpaServices - Creating booking:', bookingData);
      
      const response = await API.post('/spa/bookings', bookingData);
      console.log('SpaServices - Booking response:', response.data);
      console.log('SpaServices - Full response:', response);
      
      // Extract the booking from the response
      let booking;
      let bookingId;

      if (response.data && response.data.booking) {
        // If the response has a booking property
        booking = response.data.booking;
        bookingId = booking._id;
        console.log('SpaServices - Extracted booking from response.data.booking:', booking);
      } else if (response.data && response.data._id) {
        // If the response is the booking itself
        booking = response.data;
        bookingId = response.data._id;
        console.log('SpaServices - Extracted booking from response.data:', booking);
      } else {
        console.error('SpaServices - Invalid booking response format:', response.data);
        throw new Error('Invalid booking response format');
      }

      console.log('SpaServices - Created booking with ID:', bookingId);

      if (bookingId) {
        toast.success('Booking created! Proceeding to payment.');
        
        // Navigate to payments page with booking information
        navigate('/payments', { 
          state: { 
            pendingPayment: {
              type: 'SpaService',
              bookingId: bookingId,
              amount: service.price,
              serviceName: service.name,
              description: `Booking for ${service.name}`
            }
          } 
        });
      } else {
        throw new Error('Failed to create booking: No booking ID returned');
      }
    } catch (err) {
      console.error('Error creating booking:', err);
      toast.error('Failed to create booking: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading spa services...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="spa-services-container">
      <h2>Spa Services</h2>
      <div className="services-grid">
        {services.map(service => (
          <div key={service._id} className="service-card">
            <img src={service.image} alt={service.name} />
            <h3>{service.name}</h3>
            <p>{service.description}</p>
            <div className="service-details">
              <span>Duration: {service.duration} minutes</span>
              <span>Price: ₹{service.price}</span>
            </div>
            <button onClick={() => handleBooking(service)}>Book Now</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpaServices; 