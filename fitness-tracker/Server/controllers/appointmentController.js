// controllers/appointmentController.js

const Appointment = require('../models/Appointment');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Trainer = require('../models/Trainer');

// Book an appointment
exports.bookAppointment = async (req, res) => {
    const { userId, trainerId, date } = req.body;
    
    try {
        // Get user and trainer details for notification
        const user = await User.findById(userId);
        const trainer = await Trainer.findById(trainerId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        if (!trainer) {
            return res.status(404).json({ message: 'Trainer not found' });
        }
        
        // Create the appointment
        const appointment = new Appointment({ 
            userId, 
            trainerId, 
            date: date || new Date(), // Use provided date or current date
            trainerName: trainer.name // Store trainer name for easier reference
        });
        
        await appointment.save();
        
        // Send notification to trainer
        try {
            await sendEmailNotification(
                trainer.email,
                'New Training Appointment Request',
                `You have a new training appointment request from ${user.name} (${user.email}). Please contact them to schedule a specific time.`
            );
        } catch (emailError) {
            console.error('Failed to send email notification:', emailError);
            // Continue with the process even if email fails
        }
        
        res.status(201).json({ 
            message: 'Appointment booked successfully',
            appointment
        });
    } catch (error) {
        console.error('Error booking appointment:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get appointments for a user
exports.getAppointments = async (req, res) => {
    const { userId } = req.params;
    try {
        const appointments = await Appointment.find({ userId })
            .sort({ date: -1 }) // Sort by date, newest first
            .populate('trainerId', 'name email'); // Populate trainer details
            
        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Accept or reject an appointment
exports.updateAppointmentStatus = async (req, res) => {
    const { appointmentId } = req.params;
    const { status } = req.body; // status can be 'confirmed' or 'canceled'

    try {
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        appointment.status = status; // Update the status
        await appointment.save();
        
        // Send notification to user
        const user = await User.findById(appointment.userId);
        if (user) {
            await sendEmailNotification(
                user.email, 
                'Appointment Status Update', 
                `Your appointment has been ${status}.`
            );
        }
        
        res.status(200).json({ 
            message: 'Appointment status updated successfully', 
            appointment 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all appointments for a trainer
exports.getAppointmentsForTrainer = async (req, res) => {
    const { trainerId } = req.params;
    try {
        const appointments = await Appointment.find({ trainerId })
            .sort({ date: -1 }) // Sort by date, newest first
            .populate("userId", "name email");
            
        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Function to send email notifications
const sendEmailNotification = async (email, subject, message) => {
    // Check if email configuration is available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('Email notification skipped: Missing email configuration');
        return;
    }
    
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: subject,
        text: message,
    };

    await transporter.sendMail(mailOptions);
};