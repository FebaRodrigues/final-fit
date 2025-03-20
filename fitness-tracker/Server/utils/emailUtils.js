// utils/emailUtils.js
const nodemailer = require('nodemailer');

// Function to send email notifications
exports.sendEmailNotification = async (email, subject, message) => {
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

    return await transporter.sendMail(mailOptions);
}; 