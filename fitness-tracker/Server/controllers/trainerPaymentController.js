const TrainerPayment = require('../models/TrainerPayment');
const Trainer = require('../models/Trainer');

// Get all payments for a trainer
exports.getTrainerPayments = async (req, res) => {
    try {
        const { trainerId } = req.params;
        
        // Verify the trainer exists
        const trainer = await Trainer.findById(trainerId);
        if (!trainer) {
            return res.status(404).json({ message: 'Trainer not found' });
        }
        
        // Get all payments for this trainer
        const payments = await TrainerPayment.find({ trainerId })
            .sort({ paymentDate: -1 }); // Sort by payment date, newest first
        
        res.status(200).json(payments);
    } catch (error) {
        console.error('Error fetching trainer payments:', error);
        res.status(500).json({ message: 'Failed to fetch payments', error: error.message });
    }
};

// Create a new payment for a trainer
exports.createTrainerPayment = async (req, res) => {
    try {
        const { trainerId, amount, paymentDate, status, description, paymentMethod, paymentPeriod } = req.body;
        
        // Verify the trainer exists
        const trainer = await Trainer.findById(trainerId);
        if (!trainer) {
            return res.status(404).json({ message: 'Trainer not found' });
        }
        
        // Create the payment
        const payment = new TrainerPayment({
            trainerId,
            amount,
            paymentDate,
            status,
            description,
            paymentMethod,
            paymentPeriod
        });
        
        await payment.save();
        
        res.status(201).json({ 
            message: 'Payment created successfully', 
            payment 
        });
    } catch (error) {
        console.error('Error creating trainer payment:', error);
        res.status(500).json({ message: 'Failed to create payment', error: error.message });
    }
};

// Generate monthly payments for all approved trainers
exports.generateMonthlyPayments = async (req, res) => {
    try {
        const { month, year } = req.body;
        
        if (!month || !year) {
            return res.status(400).json({ message: 'Month and year are required' });
        }
        
        // Get all approved trainers
        const trainers = await Trainer.find({ approved: true });
        
        if (trainers.length === 0) {
            return res.status(404).json({ message: 'No approved trainers found' });
        }
        
        const paymentDate = new Date(year, month - 1, 1); // First day of the month
        const payments = [];
        
        // Create a payment for each trainer
        for (const trainer of trainers) {
            // Skip trainers who don't have an approved salary
            if (!trainer.approvedSalary) {
                continue;
            }
            
            // Check if payment already exists for this month
            const existingPayment = await TrainerPayment.findOne({
                trainerId: trainer._id,
                'paymentPeriod.month': month,
                'paymentPeriod.year': year
            });
            
            if (existingPayment) {
                continue; // Skip if payment already exists
            }
            
            const payment = new TrainerPayment({
                trainerId: trainer._id,
                amount: trainer.approvedSalary,
                paymentDate,
                status: 'completed',
                description: `Salary payment for ${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}`,
                paymentPeriod: {
                    month,
                    year
                }
            });
            
            await payment.save();
            payments.push(payment);
        }
        
        res.status(201).json({ 
            message: `Generated ${payments.length} payments for ${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}`, 
            payments 
        });
    } catch (error) {
        console.error('Error generating monthly payments:', error);
        res.status(500).json({ message: 'Failed to generate payments', error: error.message });
    }
};

// Get payment statistics for a trainer
exports.getTrainerPaymentStats = async (req, res) => {
    try {
        const { trainerId } = req.params;
        
        // Verify the trainer exists
        const trainer = await Trainer.findById(trainerId);
        if (!trainer) {
            return res.status(404).json({ message: 'Trainer not found' });
        }
        
        // Get all completed payments
        const payments = await TrainerPayment.find({ 
            trainerId,
            status: 'completed'
        });
        
        // Calculate total earnings
        const totalEarnings = payments.reduce((sum, payment) => sum + payment.amount, 0);
        
        // Get payment count by month
        const paymentsByMonth = {};
        payments.forEach(payment => {
            const key = `${payment.paymentPeriod.year}-${payment.paymentPeriod.month}`;
            if (!paymentsByMonth[key]) {
                paymentsByMonth[key] = {
                    month: payment.paymentPeriod.month,
                    year: payment.paymentPeriod.year,
                    total: 0
                };
            }
            paymentsByMonth[key].total += payment.amount;
        });
        
        res.status(200).json({
            totalEarnings,
            paymentCount: payments.length,
            paymentsByMonth: Object.values(paymentsByMonth).sort((a, b) => {
                // Sort by year and month
                if (a.year !== b.year) return b.year - a.year;
                return b.month - a.month;
            })
        });
    } catch (error) {
        console.error('Error fetching payment statistics:', error);
        res.status(500).json({ message: 'Failed to fetch payment statistics', error: error.message });
    }
}; 