// controllers/announcementController.js
const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Trainer = require('../models/Trainer');

exports.createAnnouncement = async (req, res) => {
    const { title, content, target } = req.body;
    try {
        const announcement = new Announcement({ title, content, target });
        await announcement.save();

        // Create notifications based on target
        let recipients = [];
        if (target === 'All' || target === 'Users') {
            const users = await User.find({ role: 'user' });
            recipients = recipients.concat(users.map(user => ({
                recipientId: user._id,
                recipientModel: 'User'
            })));
        }
        if (target === 'All' || target === 'Trainers') {
            const trainers = await Trainer.find({ role: 'trainer' });
            recipients = recipients.concat(trainers.map(trainer => ({
                recipientId: trainer._id,
                recipientModel: 'Trainer'
            })));
        }

        // Create Notification documents for each recipient
        const notifications = recipients.map(recipient => ({
            recipientId: recipient.recipientId,
            recipientModel: recipient.recipientModel,
            type: 'Announcement',
            message: `${title}: ${content}`,
            status: 'Unread'
        }));

        await Notification.insertMany(notifications);

        res.status(201).json({ message: 'Announcement created and notifications sent', announcement });
    } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getAnnouncements = async (req, res) => {
    try {
        const query = req.user.role === 'admin' ? {} : { 
            $or: [
                { target: 'All' },
                { target: req.user.role === 'trainer' ? 'Trainers' : 'Users' }
            ]
        };
        const announcements = await Announcement.find(query);
        res.status(200).json(announcements);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};