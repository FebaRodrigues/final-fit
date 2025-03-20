// scripts/updateSpaBookingsSimple.js
require('dotenv').config();
const mongoose = require('mongoose');
const { SpaService, SpaBooking } = require('../models/Spa');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const updateBookings = async () => {
  try {
    console.log('Starting to update SPA bookings...');
    
    // Get all services for reference
    const services = await SpaService.find();
    console.log(`Found ${services.length} services`);
    
    const serviceMap = {};
    services.forEach(service => {
      serviceMap[service._id.toString()] = service.name;
    });
    
    // Get all bookings
    const bookings = await SpaBooking.find();
    console.log(`Found ${bookings.length} bookings to process`);
    
    let updatedCount = 0;
    
    // Update each booking
    for (const booking of bookings) {
      if (!booking.serviceName && booking.serviceId) {
        const serviceId = booking.serviceId.toString();
        const serviceName = serviceMap[serviceId] || 'Unknown Service';
        
        console.log(`Updating booking ${booking._id} with service name: ${serviceName}`);
        
        // Update the booking with the service name
        await SpaBooking.findByIdAndUpdate(booking._id, { serviceName });
        updatedCount++;
      }
    }
    
    console.log(`Updated ${updatedCount} bookings with service names`);
    console.log('Migration completed successfully');
    
    // Close the connection
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error updating bookings:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

// Run the migration
updateBookings(); 