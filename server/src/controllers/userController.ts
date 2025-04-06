import { Request, Response } from 'express';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { UserAuditLog } from '../models/UserAuditLog';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import path from 'path';

// Get all users with their roles (admin only)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    // Check if user has admin role
    const userRoles = req.user?.roles || [];
    if (!userRoles.includes('admin')) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find({})
      .select('firstName lastName email roles isEmailVerified createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get role names for each user
    const populatedUsers = await Promise.all(users.map(async (user) => {
      const roles = await Role.find({ _id: { $in: user.roles } }).select('name').lean();
      return {
        ...user,
        roles: roles.map(role => role.name)
      };
    }));

    const total = await User.countDocuments();

    res.status(200).json({
      users: populatedUsers,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit
      }
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
};

// Get available roles (admin only)
export const getAvailableRoles = async (req: Request, res: Response) => {
  try {
    if (!req.user?.roles?.includes('admin')) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const roles = await Role.find({})
      .select('name description permissions')
      .sort({ name: 1 })
      .lean();

    res.status(200).json(roles);
  } catch (error) {
    console.error('Error getting roles:', error);
    res.status(500).json({ message: 'Server error while fetching roles' });
  }
};

// Update user roles (admin only)
export const updateUserRoles = async (req: Request, res: Response) => {
  try {
    if (!req.user?.roles?.includes('admin')) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { userId } = req.params;
    const { roles } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    if (!Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({ message: 'Roles must be a non-empty array' });
    }

    // Verify all roles exist
    const existingRoles = await Role.find({ name: { $in: roles } }).lean();
    if (existingRoles.length !== roles.length) {
      return res.status(400).json({ message: 'One or more roles do not exist' });
    }

    // Don't allow removing admin role from the last admin
    if (!roles.includes('admin')) {
      const isLastAdmin = await User.countDocuments({
        _id: { $ne: userId },
        roles: 'admin'
      }) === 0;

      if (isLastAdmin) {
        return res.status(400).json({ message: 'Cannot remove admin role from the last admin user' });
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { roles } },
      { new: true }
    ).select('firstName lastName email roles');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get role names for the updated user
    const updatedRoles = await Role.find({ name: { $in: user.roles } }).select('name').lean();
    const userWithRoles = {
      ...user.toObject(),
      roles: updatedRoles.map(role => role.name)
    };

    // Create audit log
    await UserAuditLog.create({
      userId: req.user._id,
      action: 'role_change',
      details: {
        targetUserId: userId,
        oldRoles: user.roles,
        newRoles: roles
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(200).json(userWithRoles);
  } catch (error) {
    console.error('Error updating user roles:', error);
    res.status(500).json({ message: 'Server error while updating user roles' });
  }
};

// Get user profile
export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user?._id)
      .select('-password')
      .populate('roles', 'name');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      bio: user.bio || '',
      interests: user.interests || [],
      profilePicture: user.profilePicture ? `/uploads/${user.profilePicture}` : null,
      socialLinks: user.socialLinks || {},
      themePreference: user.themePreference || 'system'
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
};

// Update user profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, bio, interests, socialLinks, themePreference } = req.body;
    
    const user = await User.findById(req.user?._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate required fields
    if (!firstName || !lastName) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: {
          ...(!firstName && { firstName: 'First name is required' }),
          ...(!lastName && { lastName: 'Last name is required' })
        }
      });
    }

    user.firstName = firstName;
    user.lastName = lastName;
    user.bio = bio;
    user.interests = interests;
    user.socialLinks = socialLinks;
    user.themePreference = themePreference;
    
    await user.save();

    res.json({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      bio: user.bio,
      interests: user.interests,
      profilePicture: user.profilePicture,
      socialLinks: user.socialLinks,
      themePreference: user.themePreference
    });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    if (error.name === 'ValidationError') {
      const validationErrors: { [key: string]: string } = {};
      Object.keys(error.errors).forEach((key) => {
        validationErrors[key] = error.errors[key].message;
      });
      return res.status(400).json({ 
        message: 'Validation error',
        errors: validationErrors
      });
    }
    res.status(500).json({ message: 'Server error while updating profile' });
  }
};

// Update profile picture
export const updateProfilePicture = async (req: Request, res: Response) => {
  try {
    console.log('Profile picture upload request received');
    console.log('Request file:', req.file);
    
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user?._id);
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    // Store just the filename in the database
    const filename = path.basename(req.file.path);
    console.log('Storing profile picture filename:', filename);
    
    // Store the full path in the database
    user.profilePicture = filename;
    await user.save();

    // Return the full URL for the client
    const fullUrl = `/uploads/${filename}`;
    console.log('Returning URL:', fullUrl);
    
    res.json({ profilePicture: fullUrl });
  } catch (error) {
    console.error('Error updating profile picture:', error);
    res.status(500).json({ message: 'Server error while updating profile picture' });
  }
};

// Update password
export const updatePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user?._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Server error while updating password' });
  }
}; 