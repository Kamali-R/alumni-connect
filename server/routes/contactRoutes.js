import express from 'express';
import ContactMessage from '../models/ContactMessage.js';
import nodemailer from 'nodemailer';

const router = express.Router();

router.post('/contact', async (req, res) => {
  const { firstName, lastName, email, message } = req.body;

  try {
    // 1️⃣ Save to MongoDB
    const newMessage = new ContactMessage({ firstName, lastName, email, message });
    await newMessage.save();

    // 2️⃣ Send email to admin
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // your Gmail
        pass: process.env.EMAIL_PASS, // app password
      },
    });

    const mailOptions = {
      from: email,
      to: 'joythir547@gmail.com', // change this to your actual admin email
      subject: 'New Contact Form Submission',
      text: `
        Name: ${firstName} ${lastName}
        Email: ${email}
        Message: ${message}
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Message sent and stored!' });
  } catch (error) {
    console.error('Contact form error:', error.message);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

export default router;
