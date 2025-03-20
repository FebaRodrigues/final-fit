// controllers/trainerController.js
const Trainer = require('../models/Trainer');
const User = require('../models/User');
const Goal = require('../models/Goal');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Workout = require('../models/WorkoutLog');
const mongoose = require('mongoose');

// Import from the correct path with proper destructuring
const { uploadToCloudinary } = require('../utils/imageUpload');
// Log to confirm import is working
console.log("uploadToCloudinary function loaded:", typeof uploadToCloudinary);

const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const nodemailer = require('nodemailer');

// Function to send email notifications
const sendEmailNotification = async (email, subject, message) => {
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
  
  exports.updateAppointmentStatus = async (req, res) => {
    const { appointmentId } = req.params;
    const { status } = req.body;
    console.log("Updating appointment:", appointmentId, "with status:", status); // Debug
  
    try {
      const appointment = await Appointment.findById(appointmentId);
      console.log("Found appointment:", appointment); // Debug
      if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
  
      appointment.status = status;
      await appointment.save();
      console.log("Updated appointment:", appointment); // Debug
  
      const user = await User.findById(appointment.userId);
      console.log("Found user:", user); // Debug
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      await sendEmailNotification(user.email, 'Appointment Status Update', `Your appointment has been ${status}.`);
      console.log("Email notification sent to:", user.email); // Debug
  
      res.status(200).json({ message: 'Appointment status updated successfully', appointment });
    } catch (error) {
      console.error("Error in updateAppointmentStatus:", error); // Log detailed error
      res.status(500).json({ error: "Failed to update appointment status: " + error.message });
    }
  };



// Register a new trainer
exports.registerTrainer = async (req, res) => {
    const { name, email, password, specialties, expectedSalary, phone, bio } = req.body;
    let image = req.file;

    try {
        const existingTrainer = await Trainer.findOne({ email });
        if (existingTrainer) {
            return res.status(400).json({ message: 'Trainer with this email already exists' });
        }

        // Validate expected salary
        if (!expectedSalary || isNaN(expectedSalary) || expectedSalary <= 0) {
            return res.status(400).json({ message: 'Please provide a valid expected salary' });
        }

        let imageUrl = "https://res.cloudinary.com/daacjyk3d/image/upload/v1740376690/fitnessApp/gfo0vamcfcurte2gc4jk.jpg";
        if (image) {
          try {
            console.log("typeof uploadToCloudinary:", typeof uploadToCloudinary);
            if (typeof uploadToCloudinary !== 'function') {
              console.error("uploadToCloudinary is not a function!");
              throw new Error("Image upload utility not available");
            }
            
            // Use the imported function
            const result = await uploadToCloudinary(image.path);
            console.log("Cloudinary upload result:", result);
            
            if (result && result.secure_url) {
              imageUrl = result.secure_url;
              console.log("Image uploaded for new trainer:", imageUrl);
            } else {
              console.warn("Cloudinary upload did not return a secure URL, using default image");
            }
          } catch (error) {
            console.error("Error uploading trainer image:", error);
            // Continue with default image
          }
        }

        const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
        const newTrainer = new Trainer({ 
            name, 
            email, 
            password: hashedPassword, // Store the hashed password
            specialties, 
            expectedSalary: Number(expectedSalary),
            phone: phone || '',
            bio: bio || '',
            image: imageUrl,
            approved: false // Ensure trainer starts as not approved
        });
        await newTrainer.save();

        // Send email notification to admin
        try {
            const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
            await sendEmailNotification(
                adminEmail,
                'New Trainer Registration',
                `A new trainer has registered and is awaiting approval:\n\nName: ${name}\nEmail: ${email}\nExpected Salary: $${expectedSalary}\n\nPlease login to the admin dashboard to review and approve.`
            );
        } catch (emailError) {
            console.error('Failed to send admin notification:', emailError);
        }

        res.status(201).json({ 
            message: 'Trainer registered successfully. Your account is pending approval by an administrator.', 
            trainerId: newTrainer._id 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Login Trainer
exports.loginTrainer = async (req, res) => {
    const { email, password } = req.body;

    try {
        console.log("Login attempt with email:", email); // Log the email
        const trainer = await Trainer.findOne({ email });
        
        // Check if the trainer exists
        if (!trainer) {
            console.log("Trainer not found"); // Log if trainer is not found
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Check if the trainer is approved
        if (!trainer.approved) {
            console.log("Trainer not approved"); // Log if trainer is not approved
            return res.status(403).json({ 
                message: "Your account is pending approval by an administrator. Please check back later." 
            });
        }

        // Compare the provided password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, trainer.password);
        if (!isMatch) {
            console.log("Password does not match"); // Log if password does not match
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate a JWT token
        const token = jwt.sign(
            { id: trainer._id, role: trainer.role }, // Include the role from the trainer document
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || "1h" }
        );

        // Return the token and role
        res.json({ token, role: trainer.role, trainer });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Server error, please try again later" });
    }
};

     


// Get all trainers
exports.getAllTrainers = async (req, res) => {
    try {
        const trainers = await Trainer.find();
        res.status(200).json(trainers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get available trainers (public access)
exports.getAvailableTrainers = async (req, res) => {
    try {
        // Only return approved trainers with basic information needed for booking
        const trainers = await Trainer.find({ approved: true })
            .select('_id name specialties experience availability image bio');
        
        console.log(`Found ${trainers.length} approved trainers`);
        res.status(200).json(trainers);
    } catch (error) {
        console.error('Error fetching available trainers:', error);
        res.status(500).json({ message: 'Failed to fetch trainers', error: error.message });
    }
};

// Get a trainer's profile by ID
exports.getTrainerProfileById = async (req, res) => {
    const { trainerId } = req.params; // Ensure this is being extracted correctly
    try {
        const trainer = await Trainer.findById(trainerId);
        if (!trainer) return res.status(404).json({ message: 'Trainer not found' });
        res.status(200).json(trainer);
    } catch (error) {
        console.error("Error fetching trainer profile:", error); // Log the error for debugging
        res.status(500).json({ error: error.message });
    }
};

// Update a trainer's profile
exports.updateTrainerProfile = async (req, res) => {
    const { trainerId } = req.params;
    const { name, email, specialties, phone, bio, availability, certifications, experience, image: imageUrl } = req.body;
    let image = req.file;
  
    console.log("Updating trainer profile for ID:", trainerId);
    console.log("Incoming req.body:", req.body);
    console.log("Incoming req.file:", req.file);
  
    try {
      // Construct updateData with proper handling of specialties
      let updateData = {};

      if (name) updateData.name = name;
      if (email) updateData.email = email;
      
      // Explicitly handle specialties
      console.log("Raw specialties from req.body:", specialties); // Debug raw value
      if (specialties !== undefined) {
        // Handle specialties as a string, array, or JSON string
        if (typeof specialties === 'string' && specialties.startsWith('[')) {
          try {
            updateData.specialties = JSON.parse(specialties);
          } catch (e) {
            updateData.specialties = specialties.split(',').map(s => s.trim());
          }
        } else if (Array.isArray(specialties)) {
          updateData.specialties = specialties;
        } else if (typeof specialties === 'string') {
          updateData.specialties = specialties.split(',').map(s => s.trim());
        }
        console.log("Processed specialties for update:", updateData.specialties); // Debug processed value
      }
      
      if (phone) updateData.phone = phone;
      if (bio) updateData.bio = bio;
      
      // Handle availability if provided
      if (availability) {
        try {
          if (typeof availability === 'string') {
            updateData.availability = JSON.parse(availability);
          } else {
            updateData.availability = availability;
          }
        } catch (e) {
          console.error("Error parsing availability:", e);
        }
      }

      // Handle certifications if provided
      if (certifications) {
        try {
          if (typeof certifications === 'string') {
            updateData.certifications = JSON.parse(certifications);
          } else {
            updateData.certifications = certifications;
          }
          console.log("Processed certifications for update:", updateData.certifications);
        } catch (e) {
          console.error("Error parsing certifications:", e);
        }
      }

      // Handle experience if provided
      if (experience) {
        try {
          if (typeof experience === 'string') {
            updateData.experience = JSON.parse(experience);
          } else {
            updateData.experience = experience;
          }
          console.log("Processed experience for update:", updateData.experience);
        } catch (e) {
          console.error("Error parsing experience:", e);
        }
      }
  
      // First check if a direct Cloudinary URL is provided in the request body
      if (imageUrl && typeof imageUrl === 'string' && imageUrl.includes('cloudinary.com')) {
        console.log("Using provided Cloudinary URL:", imageUrl);
        updateData.image = imageUrl;
      }
      // Only try to upload image if file is provided and no Cloudinary URL was set
      else if (image && !updateData.image) {
        try {
          console.log("Attempting to upload image:", image.path);
          console.log("typeof uploadToCloudinary:", typeof uploadToCloudinary);
          
          if (typeof uploadToCloudinary !== 'function') {
            console.error("uploadToCloudinary is not a function!");
            throw new Error("Image upload utility not available");
          }
          
          const result = await uploadToCloudinary(image.path);
          console.log("Cloudinary upload result:", result);
          
          if (result && result.secure_url) {
            updateData.image = result.secure_url;
            console.log("Image uploaded successfully, URL:", result.secure_url);
          } else {
            console.error("Image upload returned no URL");
          }
        } catch (err) {
          console.error("Error during image upload:", err);
          return res.status(500).json({ error: `Error uploading image: ${err.message}` });
        }
      }
  
      console.log("Final data to update in DB:", updateData);
  
      const trainer = await Trainer.findByIdAndUpdate(
        trainerId,
        { $set: updateData }, // Use $set to ensure partial updates
        { new: true, runValidators: true }
      );
  
      if (!trainer) return res.status(404).json({ message: "Trainer not found" });
  
      console.log("Updated trainer document from DB:", trainer);
      res.status(200).json(trainer);
    } catch (error) {
      console.error("Error updating trainer profile:", error);
      res.status(500).json({ error: error.message });
    }
};

// Delete a trainer
exports.deleteTrainer = async (req, res) => {
    const { trainerId } = req.params;
    try {
        const trainer = await Trainer.findByIdAndDelete(trainerId);
        if (!trainer) return res.status(404).json({ message: 'Trainer not found' });
        res.status(200).json({ message: 'Trainer deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all clients for a trainer
exports.getClients = async (req, res) => {
    const { trainerId } = req.params;
    console.log("Fetching clients for trainerId:", trainerId);
    try {
      const appointments = await Appointment.find({ trainerId, status: "confirmed" });
      console.log("Found appointments:", appointments);
      if (appointments.length === 0) {
        console.log("No confirmed appointments found for trainerId:", trainerId);
        return res.status(200).json([]);
      }
      const clientIds = [...new Set(appointments.map((appt) => appt.userId.toString()))];
      console.log("Client IDs:", clientIds);
      const clients = await User.find({ _id: { $in: clientIds } });
      console.log("Fetched clients:", clients);
      res.status(200).json(clients);
    } catch (error) {
      console.error("Error in getClients:", error);
      res.status(500).json({ error: "Failed to fetch clients: " + error.message });
    }
  };

// Get progress data for a specific client
exports.getClientProgress = async (req, res) => {
  const { userId } = req.params;
  const { period = 'month' } = req.query;
  
  try {
    // Calculate date range based on period
    const endDate = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case '3months':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1); // Default to month
    }
    
    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    // Get workouts within date range
    const workoutLogs = await Workout.find({
      userId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });
    
    // Get goals
    const goals = await Goal.find({ userId });
    
    // Get weight logs (if available)
    let weightLogs = [];
    try {
      // This assumes you have a model for weight tracking
      // If not, you can create mock data or leave it empty
      weightLogs = [
        { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), weight: 75 },
        { date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), weight: 74 },
        { date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), weight: 73.5 },
        { date: new Date(), weight: 73 }
      ];
    } catch (error) {
      console.log('Weight logs not available');
    }
    
    // Calculate metrics
    const workoutsCompleted = workoutLogs.length;
    const averageDuration = workoutsCompleted > 0 
      ? Math.round(workoutLogs.reduce((sum, workout) => sum + workout.duration, 0) / workoutsCompleted) 
      : 0;
    
    // Estimate calories burned (very rough estimate)
    const caloriesPerMinute = 5; // Average calories burned per minute of exercise
    const caloriesBurned = workoutLogs.reduce((sum, workout) => sum + (workout.duration * caloriesPerMinute), 0);
    
    // Count completed goals
    const goalsAchieved = goals.filter(goal => goal.status === 'completed').length;
    
    // Calculate consistency (percentage of days with workouts)
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const daysWithWorkouts = new Set(workoutLogs.map(w => new Date(w.date).toDateString())).size;
    const consistency = Math.round((daysWithWorkouts / daysDiff) * 100);
    
    // Format goal progress data
    const goalProgress = goals.map(goal => ({
      id: goal._id,
      title: goal.title || goal.goalType,
      type: goal.goalType,
      targetValue: goal.targetValue,
      currentValue: goal.currentValue,
      progress: Math.round((goal.currentValue / goal.targetValue) * 100),
      status: goal.status
    }));
    
    res.status(200).json({
      clientInfo: {
        name: user.name,
        email: user.email,
        // Include other relevant user info
      },
      weightLogs,
      workoutLogs,
      goalProgress,
      metrics: {
        workoutsCompleted,
        averageDuration,
        caloriesBurned,
        goalsAchieved,
        consistency
      }
    });
  } catch (error) {
    console.error('Error fetching client progress:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get feedback for a trainer
exports.getFeedbackForTrainer = async (req, res) => {
    const { trainerId } = req.params;
    try {
        const feedback = await Feedback.find({ trainerId });
        res.status(200).json(feedback);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get trainer earnings
exports.getTrainerEarnings = async (req, res) => {
    const { trainerId } = req.params;
    try {
        const payments = await Payment.find({ trainerId });
        const totalEarnings = payments.reduce((total, payment) => total + payment.amount, 0);
        res.status(200).json({ totalEarnings });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};