import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const sendOTP = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS
      }
    });

    const mailOptions = {
      from: `Alumni Connect ✨ <${process.env.AUTH_EMAIL}>`,
      to: email,
      subject: 'Your OTP for Email Verification',
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ccc;">
          <h2>🔐 Email Verification</h2>
          <p>Hi there! Use the following OTP to verify your email:</p>
          <h3 style="color: #2c3e50;">${otp}</h3>
          <p>This OTP is valid for only 5 minutes.</p>
          <br>
          <p>Regards,<br><strong>Alumni Connect Team</strong></p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP sent to ${email}`);
  } catch (error) {
    console.error('❌ Error sending OTP:', error);
    throw error;
  }
};

export default sendOTP;
