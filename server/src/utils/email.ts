import nodemailer from 'nodemailer';
import logger from './logger';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.example.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || 'your-email@example.com';
const SMTP_PASS = process.env.SMTP_PASS || 'your-email-password';

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export const sendVerificationEmail = async (email: string) => {
  try {
    const verificationToken = 'temporary-verification-token'; // This should be generated and passed in
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

    // Skip actual email sending in development
    if (process.env.NODE_ENV === 'production') {
      await transporter.sendMail({
        from: SMTP_USER,
        to: email,
        subject: 'Verify your email',
        html: `
          <h1>Welcome to React Node App!</h1>
          <p>Please click the link below to verify your email address:</p>
          <a href="${verificationUrl}">${verificationUrl}</a>
          <p>This link will expire in 24 hours.</p>
        `,
      });
    } else {
      // Just log the verification URL in development
      logger.info(`[DEV MODE] Verification URL for ${email}: ${verificationUrl}`);
    }

    logger.info(`Verification email handled for ${email}`);
    return true;
  } catch (error) {
    logger.error('Error handling verification email:', error);
    // Don't throw the error - just log it and let registration continue
    return false;
  }
};

export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
  try {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // Skip actual email sending in development
    if (process.env.NODE_ENV === 'production') {
      await transporter.sendMail({
        from: SMTP_USER,
        to: email,
        subject: 'Reset your password',
        html: `
          <h1>Password Reset Request</h1>
          <p>Click the link below to reset your password:</p>
          <a href="${resetUrl}">${resetUrl}</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
      });
    } else {
      // Just log the reset URL in development
      logger.info(`[DEV MODE] Password reset URL for ${email}: ${resetUrl}`);
    }

    logger.info(`Password reset email handled for ${email}`);
    return true;
  } catch (error) {
    logger.error('Error handling password reset email:', error);
    // Don't throw the error - just log it and let the process continue
    return false;
  }
}; 