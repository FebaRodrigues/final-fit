// controllers/spaController.js
const { SpaService, SpaBooking } = require('../models/Spa');
const Membership = require('../models/Membership');
const Payment = require('../models/Payment');
const mongoose = require('mongoose');

// Get all SPA services
exports.getAllSpaServices = async (req, res) => {
  try {
    const services = await SpaService.find();
    res.status(200).json(services);
  } catch (error) {
    console.error('Error fetching SPA services:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get a specific SPA service by ID
exports.getSpaServiceById = async (req, res) => {
  try {
    const service = await SpaService.findById(req.params.serviceId);
    if (!service) {
      return res.status(404).json({ message: 'SPA service not found' });
    }
    res.status(200).json(service);
  } catch (error) {
    console.error('Error fetching SPA service:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create a new SPA service (admin only)
exports.createSpaService = async (req, res) => {
  try {
    const { name, description, duration, price, image } = req.body;
    const service = new SpaService({
      name,
      description,
      duration,
      price,
      ...(image && { image })
    });
    await service.save();
    res.status(201).json({ message: 'SPA service created', service });
  } catch (error) {
    console.error('Error creating SPA service:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update a SPA service (admin only)
exports.updateSpaService = async (req, res) => {
  try {
    const { name, description, duration, price, image } = req.body;
    const updatedService = await SpaService.findByIdAndUpdate(
      req.params.serviceId,
      {
        name,
        description,
        duration,
        price,
        ...(image && { image })
      },
      { new: true }
    );
    if (!updatedService) {
      return res.status(404).json({ message: 'SPA service not found' });
    }
    res.status(200).json({ message: 'SPA service updated', service: updatedService });
  } catch (error) {
    console.error('Error updating SPA service:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete a SPA service (admin only)
exports.deleteSpaService = async (req, res) => {
  try {
    const deletedService = await SpaService.findByIdAndDelete(req.params.serviceId);
    if (!deletedService) {
      return res.status(404).json({ message: 'SPA service not found' });
    }
    res.status(200).json({ message: 'SPA service deleted' });
  } catch (error) {
    console.error('Error deleting SPA service:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all SPA bookings for a user
exports.getUserSpaBookings = async (req, res) => {
  try {
    const bookings = await SpaBooking.find({ userId: req.params.userId })
      .populate('serviceId')
      .sort({ date: -1 });
    
    // Process bookings to handle deleted services
    const processedBookings = bookings.map(booking => {
      const bookingObj = booking.toObject();
      
      // If serviceId is null or undefined but we have a price, try to get service info
      if (!bookingObj.serviceId && bookingObj.price) {
        // If we have a serviceName stored, use it
        if (booking.serviceName) {
          bookingObj.serviceId = {
            name: booking.serviceName,
            _id: 'deleted'
          };
        } else {
          bookingObj.serviceId = {
            name: `Service (Price: ₹${bookingObj.price})`,
            _id: 'deleted'
          };
        }
      }
      
      return bookingObj;
    });
    
    res.status(200).json(processedBookings);
  } catch (error) {
    console.error('Error fetching user SPA bookings:', error);
    res.status(500).json({ error: error.message });
  }
};

// Check if user has used their free Elite session this month
exports.checkFreeSessionEligibility = async (req, res) => {
  const userId = req.params.userId;
  
  try {
    // Check if user has an active Elite membership
    const activeMembership = await Membership.findOne({
      userId,
      planType: 'Elite',
      status: 'Active'
    });
    
    if (!activeMembership) {
      return res.status(200).json({ 
        eligible: false, 
        message: 'User does not have an active Elite membership' 
      });
    }
    
    // Get the current month and year
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Check if user has already used their free session this month
    // Only count confirmed or completed sessions as "used"
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
    
    const freeSessionThisMonth = await SpaBooking.findOne({
      userId,
      isFreeSession: true,
      status: { $in: ['Confirmed', 'Completed'] },
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });
    
    if (freeSessionThisMonth) {
      return res.status(200).json({ 
        eligible: false, 
        message: 'Free Elite session already used this month',
        usedSession: freeSessionThisMonth
      });
    }
    
    // User is eligible for a free session
    return res.status(200).json({ 
      eligible: true, 
      message: 'User is eligible for a free Elite session this month' 
    });
  } catch (error) {
    console.error('Error checking free session eligibility:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create a new SPA booking
exports.createBooking = async (req, res) => {
  try {
    const { userId, serviceId, date, time, isFreeSession } = req.body;
    
    // Validate required fields
    if (!userId || !serviceId || !date || !time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if the service exists
    const service = await SpaService.findById(serviceId);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    // Check if the time slot is available
    const existingBooking = await SpaBooking.findOne({
      serviceId,
      date,
      time,
      status: { $nin: ['Cancelled', 'Rejected'] }
    });
    
    if (existingBooking) {
      return res.status(400).json({ error: 'This time slot is already booked' });
    }
    
    // If it's a free session, verify eligibility
    let requiresPayment = true;
    
    if (isFreeSession) {
      // Check if user has an active Elite membership
      const activeMembership = await Membership.findOne({
        userId,
        planType: 'Elite',
        status: 'Active'
      });
      
      if (!activeMembership) {
        return res.status(400).json({ error: 'User does not have an active Elite membership for free session' });
      }
      
      // Get the current month and year
      const bookingDate = new Date(date);
      const bookingMonth = bookingDate.getMonth();
      const bookingYear = bookingDate.getFullYear();
      
      // Check if user has already used their free session this month
      const startOfMonth = new Date(bookingYear, bookingMonth, 1);
      const endOfMonth = new Date(bookingYear, bookingMonth + 1, 0, 23, 59, 59, 999);
      
      const freeSessionThisMonth = await SpaBooking.findOne({
        userId,
        isFreeSession: true,
        status: { $in: ['Confirmed', 'Completed'] },
        date: { $gte: startOfMonth, $lte: endOfMonth }
      });
      
      if (freeSessionThisMonth) {
        return res.status(400).json({ 
          error: 'Free Elite session already used this month',
          requiresPayment: true
        });
      }
      
      // User is eligible for a free session
      requiresPayment = false;
    }
    
    // Create the booking
    const newBooking = new SpaBooking({
      userId,
      serviceId,
      serviceName: service.name,
      date,
      time,
      status: 'Pending',
      isFreeSession: isFreeSession || false,
      price: requiresPayment ? service.price : 0
    });
    
    await newBooking.save();
    
    // Return the booking with payment requirement info
    res.status(201).json({ 
      booking: newBooking,
      requiresPayment,
      message: 'Booking created successfully' 
    });
  } catch (error) {
    console.error('Error creating SPA booking:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update a SPA booking status
exports.updateSpaBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const updatedBooking = await SpaBooking.findByIdAndUpdate(
      req.params.bookingId,
      { status },
      { new: true }
    ).populate('serviceId');
    
    if (!updatedBooking) {
      return res.status(404).json({ message: 'SPA booking not found' });
    }
    
    res.status(200).json({ 
      message: 'SPA booking status updated', 
      booking: updatedBooking 
    });
  } catch (error) {
    console.error('Error updating SPA booking status:', error);
    res.status(500).json({ error: error.message });
  }
};

// Cancel a SPA booking
exports.cancelSpaBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const booking = await SpaBooking.findById(req.params.bookingId);
    
    if (!booking) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'SPA booking not found' });
    }
    
    // Update booking status to cancelled
    booking.status = 'Cancelled';
    await booking.save({ session });
    
    // If there's an associated payment and it's still pending, cancel it
    if (booking.paymentId) {
      const payment = await Payment.findById(booking.paymentId);
      if (payment && payment.status === 'Pending') {
        payment.status = 'Failed';
        await payment.save({ session });
      }
    }
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(200).json({ 
      message: 'SPA booking cancelled successfully', 
      booking 
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error cancelling SPA booking:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all SPA bookings (admin only)
exports.getAllSpaBookings = async (req, res) => {
  try {
    const bookings = await SpaBooking.find()
      .populate('userId', 'name email')
      .populate('serviceId')
      .sort({ date: -1 });
    
    // Process bookings to handle deleted services
    const processedBookings = bookings.map(booking => {
      const bookingObj = booking.toObject();
      
      // If serviceId is null or undefined but we have a price, try to get service info
      if (!bookingObj.serviceId && bookingObj.price) {
        // If we have a serviceName stored, use it
        if (booking.serviceName) {
          bookingObj.serviceId = {
            name: booking.serviceName,
            _id: 'deleted'
          };
        } else {
          bookingObj.serviceId = {
            name: `Service (Price: ₹${bookingObj.price})`,
            _id: 'deleted'
          };
        }
      }
      
      return bookingObj;
    });
    
    res.status(200).json(processedBookings);
  } catch (error) {
    console.error('Error fetching all SPA bookings:', error);
    res.status(500).json({ error: error.message });
  }
};

// Generate SPA reports (admin only)
exports.generateSpaReport = async (req, res) => {
  try {
    const { period } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
      default:
        startDate = new Date(0); // Beginning of time
        break;
    }
    
    // Get all bookings within the date range
    const bookings = await SpaBooking.find({
      date: { $gte: startDate, $lte: now }
    }).populate('serviceId');
    
    // Calculate report metrics
    const totalBookings = bookings.length;
    const pendingBookings = bookings.filter(b => b.status === 'Pending').length;
    const confirmedBookings = bookings.filter(b => b.status === 'Confirmed').length;
    const completedBookings = bookings.filter(b => b.status === 'Completed').length;
    const cancelledBookings = bookings.filter(b => b.status === 'Cancelled').length;
    const freeSessionsUsed = bookings.filter(b => b.isFreeSession).length;
    
    // Calculate total revenue (excluding free sessions and cancelled bookings)
    let totalRevenue = 0;
    bookings.forEach(booking => {
      if (!booking.isFreeSession && booking.status !== 'Cancelled') {
        if (booking.serviceId) {
          totalRevenue += booking.serviceId.price;
        } else if (booking.price) {
          totalRevenue += booking.price;
        }
      }
    });
    
    // Calculate popular services
    const serviceMap = {};
    bookings.forEach(booking => {
      if (booking.status !== 'Cancelled') {
        if (booking.serviceId) {
          const serviceId = booking.serviceId._id.toString();
          if (!serviceMap[serviceId]) {
            serviceMap[serviceId] = {
              name: booking.serviceId.name,
              count: 0
            };
          }
          serviceMap[serviceId].count++;
        } else if (booking.price) {
          // Handle deleted services
          const deletedServiceId = 'deleted-service';
          if (!serviceMap[deletedServiceId]) {
            serviceMap[deletedServiceId] = {
              name: 'Deleted Service',
              count: 0
            };
          }
          serviceMap[deletedServiceId].count++;
        }
      }
    });
    
    const popularServices = Object.values(serviceMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 services
    
    res.status(200).json({
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      freeSessionsUsed,
      popularServices
    });
  } catch (error) {
    console.error('Error generating SPA report:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = exports; 