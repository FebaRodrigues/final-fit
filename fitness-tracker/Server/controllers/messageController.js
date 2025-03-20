// const mongoose = require('mongoose');
// const Message = require('../models/Message');

// // Send a message
// const sendMessage = async (req, res) => {
//     const { senderId, receiverId, content } = req.body;
  
//     if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
//       return res.status(400).json({ message: 'Invalid senderId or receiverId' });
//     }
  
//     const senderModel = req.user.role === 'trainer' ? 'Trainer' : 'User';
//     const receiverModel = senderModel === 'Trainer' ? 'User' : 'Trainer';
  
//     const message = new Message({
//       senderId,
//       receiverId,
//       senderModel,
//       receiverModel,
//       content,
//       read: false,
//     });
  
//     try {
//       await message.save();
//       res.status(201).json({ message: 'Message sent successfully', message });
//     } catch (error) {
//       res.status(500).json({ error: 'Failed to send message: ' + error.message });
//     }
//   };

// // Get messages between user and trainer
// const getMessages = async (req, res) => {
//     const { userId, trainerId } = req.params;
  
//     try {
//       const messages = await Message.find({
//         $or: [
//           { senderId: userId, receiverId: trainerId },
//           { senderId: trainerId, receiverId: userId },
//         ],
//       })
//         .populate('senderId', 'name email')
//         .populate('receiverId', 'name email')
//         .sort({ createdAt: 1 });
  
//       res.status(200).json(messages);
//     } catch (error) {
//       res.status(500).json({ error: 'Failed to fetch messages: ' + error.message });
//     }
//   };

// // Get all messages for a trainer (simplified)
// const getMessagesByTrainer = async (req, res) => {
//     const { trainerId } = req.params;
  
//     try {
//       if (!mongoose.Types.ObjectId.isValid(trainerId)) {
//         return res.status(400).json({ message: 'Invalid trainerId' });
//       }
  
//       const messages = await Message.find({
//         $or: [
//           { senderId: trainerId, senderModel: 'Trainer' },
//           { receiverId: trainerId, receiverModel: 'Trainer' },
//         ],
//       })
//         .populate('senderId', 'name email')
//         .populate('receiverId', 'name email')
//         .sort({ createdAt: 1 });
  
//       res.status(200).json(messages);
//     } catch (error) {
//       res.status(500).json({ error: 'Failed to fetch trainer messages: ' + error.message });
//     }
//   };
//   module.exports = { sendMessage, getMessages, getMessagesByTrainer };