import express from 'express';
import { authenticate } from '../middleware/auth';
import * as userController from '../controllers/userController';
import { upload } from '../config/upload';

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticate, userController.getAllUsers);

// Get available roles (admin only)
router.get('/roles', authenticate, userController.getAvailableRoles);

// Update user roles (admin only)
router.put('/:userId/roles', authenticate, userController.updateUserRoles);

// Profile routes
router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);
router.put('/profile/picture', authenticate, upload.single('profilePicture'), userController.updateProfilePicture);
router.put('/password', authenticate, userController.updatePassword);

export default router; 