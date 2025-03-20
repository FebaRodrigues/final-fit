// //routes/auth.js
// const express = require('express');
// const router = express.Router();
// const User = require('../models/User');
// const Admin = require('../models/Admin');
// const Trainer = require('../models/Trainer');
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');

// // User Registration
// router.post('/register', async (req, res) => {
//     const { name, email, password, role, specialties } = req.body;

//     try {
//         const hashedPassword = await bcrypt.hash(password, 10);

//         if (role === 'admin') {
//             const existingAdmin = await Admin.findOne({ email });
//             if (existingAdmin) {
//                 return res.status(400).json({ message: 'Admin with this email already exists' });
//             }
//             const newAdmin = new Admin({ name, email, password: hashedPassword });
//             await newAdmin.save();
//             return res.status(201).json({ message: 'Admin registered successfully' });
//         } else if (role === 'trainer') {
//             const existingTrainer = await Trainer.findOne({ email });
//             if (existingTrainer) {
//                 return res.status(400).json({ message: 'Trainer with this email already exists' });
//             }
//             const newTrainer = new Trainer({ name, email, password: hashedPassword, specialties });
//             await newTrainer.save();
//             return res.status(201).json({ message: 'Trainer registered successfully' });
//         } else {
//             const existingUser  = await User.findOne({ email });
//             if (existingUser ) {
//                 return res.status(400).json({ message: 'User  with this email already exists' });
//             }
//             const newUser  = new User({ name, email, password: hashedPassword });
//             await newUser .save();
//             return res.status(201).json({ message: 'User  registered successfully' });
//         }
//     } catch (error) {
//         return res.status(500).json({ message: 'Error registering user', error });
//     }
// });

// // User Login
// router.post('/login', async (req, res) => {
//     const { email, password } = req.body;

//     try {
//         // Check for user in User, Admin, and Trainer collections
//         const user = await User.findOne({ email }) || await Admin.findOne({ email }) || await Trainer.findOne({ email });
        
//         if (!user) {
//             return res.status(404).json({ message: 'User  not found' }); // Specific error for user not found
//         }

//         // Check if the password is correct
//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) {
//             return res.status(401).json({ message: 'Invalid password' }); // Specific error for invalid password
//         }

//         // Generate token and return role
//         const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
//         return res.status(200).json({ token, role: user.role });
//     } catch (error) {
//         return res.status(500).json({ message: 'Error logging in', error });
//     }
// });
// module.exports = router;