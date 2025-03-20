const mongoose = require('mongoose');

const spaServiceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: Number, required: true }, // in minutes
    price: { type: Number, required: true }, // in Indian Rupees (INR)
    image: { type: String, default: "https://res.cloudinary.com/daacjyk3d/image/upload/v1740376690/fitnessApp/spa-default.jpg" },
});

const spaBookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'SpaService', required: true },
    serviceName: { type: String, default: 'Unknown Service' }, // Store service name directly
    date: { type: Date, required: true },
    time: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'Rejected'], 
        default: 'Pending' 
    },
    isFreeSession: { type: Boolean, default: false }, // Flag for Elite members' free session
    price: { type: Number, default: 0 }, // in Indian Rupees (INR)
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
    notes: { type: String },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Create indexes for faster queries
spaBookingSchema.index({ userId: 1, date: -1 });
spaBookingSchema.index({ status: 1 });

// Export both models
const SpaService = mongoose.model('SpaService', spaServiceSchema);
const SpaBooking = mongoose.model('SpaBooking', spaBookingSchema);

module.exports = { SpaService, SpaBooking }; 