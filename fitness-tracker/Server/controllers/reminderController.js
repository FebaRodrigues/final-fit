//controller/reminderController.js

const Reminder = require('../models/Reminder');

// Set a reminder
exports.setReminder = async (req, res) => {
    const { userId, type, time } = req.body;
    const reminder = new Reminder({ userId, type, time });
    try {
        await reminder.save();
        res.status(201).json({ message: 'Reminder set successfully', reminder });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get reminders for a user
exports.getReminders = async (req, res) => {
    const { userId } = req.params;
    try {
        const reminders = await Reminder.find({ userId });
        res.status(200).json(reminders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};