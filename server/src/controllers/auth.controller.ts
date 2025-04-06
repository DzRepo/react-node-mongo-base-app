import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '../models/User';
import { UserAuditLog } from '../models/UserAuditLog';
import { Role } from '../models/Role';
import logger from '../utils/logger';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email';

// Get JWT secret from environment variable or use a default for development
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Define JWT payload type
interface JWTPayload {
  id: string;
  roles: string[];
}

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    logger.info(`Registration attempt for email: ${email}`);

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn(`Registration failed: User with email ${email} already exists`);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Get default user role
    try {
      const userRole = await Role.findOne({ name: 'user' });
      if (!userRole) {
        logger.error('Registration failed: Default user role not found in database');
        return res.status(500).json({ message: 'Default role not found' });
      }

      // Get reader role if it exists
      const readerRole = await Role.findOne({ name: 'reader' });
      
      // Create user with appropriate roles
      const roles = readerRole ? [userRole._id, readerRole._id] : [userRole._id];
      
      // Create user
      const user = new User({
        email,
        password,
        firstName,
        lastName,
        roles,
      });

      try {
        await user.save();
        logger.info(`User saved to database: ${user._id}`);
      } catch (saveError) {
        logger.error('Error saving user to database:', saveError);
        return res.status(500).json({ message: 'Error creating user account', error: saveError.message });
      }

      // Create audit log
      try {
        await UserAuditLog.create({
          userId: user._id,
          action: 'register',
          details: { email },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        });
        logger.info(`Created audit log for new user: ${user._id}`);
      } catch (auditError) {
        logger.error('Error creating audit log:', auditError);
        // Continue despite audit log error
      }

      // Send verification email
      try {
        await sendVerificationEmail(user.email);
        logger.info(`Verification email sent to: ${user.email}`);
      } catch (emailError) {
        logger.error('Error sending verification email:', emailError);
        // Continue despite email error
      }

      // Generate token
      const payload: JWTPayload = { id: user._id.toString(), roles: user.roles.map(r => r.toString()) };
      const token = jwt.sign(
        payload,
        JWT_SECRET as jwt.Secret,
        { expiresIn: JWT_EXPIRES_IN } as SignOptions
      );

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles,
        },
      });
    } catch (roleError) {
      logger.error('Error finding user role:', roleError);
      return res.status(500).json({ message: 'Error finding user role', error: roleError.message });
    }
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ 
      message: 'An error occurred during registration',
      error: error.message
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists and populate roles
    const user = await User.findOne({ email })
      .select('+password')
      .populate('roles', 'name');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Check password match
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Create audit log
    try {
      await UserAuditLog.create({
        userId: user._id,
        action: 'login',
        details: { email },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
    } catch (error) {
      logger.error('Error creating login audit log:', error);
      // Continue despite audit log error
    }
    
    // Generate token with role names
    const payload: JWTPayload = { 
      id: user._id.toString(), 
      roles: user.roles.map((role: any) => role.name)
    };
    const token = jwt.sign(
      payload,
      JWT_SECRET as jwt.Secret,
      { expiresIn: JWT_EXPIRES_IN } as SignOptions
    );
    
    // Transform user object to include role names
    res.status(200).json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        roles: user.roles.map((role: any) => role.name)
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    // Verify token logic would go here
    // Typically you would validate the token, find the user, and set isEmailVerified to true

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    logger.error('Email verification error:', error);
    res.status(500).json({ message: 'Error verifying email' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset token logic would go here
    const resetToken = 'temporary-reset-token';

    // Send password reset email
    await sendPasswordResetEmail(email, resetToken);

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({ message: 'Error sending password reset email' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Reset password logic would go here
    // Typically you would validate the token, find the user, and update their password

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
};

// Get current user
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      console.log('No user found in request');
      return res.status(401).json({ message: 'Not authenticated' });
    }

    console.log('Getting current user data for:', req.user._id);
    
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('roles', 'name');

    console.log('User data from database:', user);

    if (!user) {
      console.log('User not found in database');
      return res.status(404).json({ message: 'User not found' });
    }

    // Transform the response to use role names instead of IDs
    const transformedUser = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles.map((role: any) => role.name)
    };

    console.log('Transformed user data:', transformedUser);
    res.json(transformedUser);
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      // Verify the existing token
      const decoded = jwt.verify(token, JWT_SECRET as string) as { id: string };
      
      // Find user and populate roles
      const user = await User.findById(decoded.id)
        .populate('roles', 'name')
        .lean();
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Generate new token
      const payload: JWTPayload = { 
        id: user._id.toString(), 
        roles: user.roles.map((role: any) => role.name)
      };
      const newToken = jwt.sign(
        payload,
        JWT_SECRET as jwt.Secret,
        { expiresIn: JWT_EXPIRES_IN } as SignOptions
      );
      
      res.json({ token: newToken });
    } catch (jwtError) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({ message: 'Error refreshing token' });
  }
}; 