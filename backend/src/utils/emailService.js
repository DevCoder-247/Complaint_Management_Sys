import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export const sendVerificationEmail = async (email, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '1d'
  });

  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify Your Email - Complaint Management System',
    html: `
      <h2>Welcome to Complaint Management System</h2>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

export const sendEmail = async (to, subject, text) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text
  };

  await transporter.sendMail(mailOptions);
};

export const sendWarningEmail = async (user, complaint, warningType) => {
  const subject = `Warning: ${warningType} - Complaint #${complaint._id}`;
  const text = `
    Dear ${user.name},
    
    This is a warning regarding complaint "${complaint.title}".
    The deadline for this complaint is approaching/has passed.
    
    Complaint ID: ${complaint._id}
    Deadline: ${complaint.deadline}
    Current Status: ${complaint.status}
    
    Please take immediate action.
    
    Regards,
    Complaint Management System
  `;

  await sendEmail(user.email, subject, text);
};