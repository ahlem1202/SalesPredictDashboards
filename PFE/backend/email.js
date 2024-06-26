const nodemailer = require('nodemailer');

const sendPasswordResetEmail = (email, token) => {
    // Create a Nodemailer transporter using SMTP credentials
    const transporter = nodemailer.createTransport({
        host: 'smtp.office365.com', // Microsoft 365 SMTP server
        port: 587, // Port for secure SMTP
        secure: false, // true for 465, false for other ports
        auth: {
            user: 'zaghouani.ahlem@esprit.tn', // Your Microsoft 365 email address
            pass: '191jFT1544' // Your Microsoft 365 password
        }
    });

    const mailOptions = {
        from:  'zaghouani.ahlem@esprit.tn', // Sender email address
        to: email,
        subject: 'Password Reset',
        html: `<p>Click <a href="http://localhost:4200/reset-password?token=${token}">here</a> to reset your password.</p>`
    };

    return transporter.sendMail(mailOptions);
};

module.exports = {
    sendPasswordResetEmail
};
