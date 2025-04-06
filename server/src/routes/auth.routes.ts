import { Router } from 'express';
import { register, login, verifyEmail, forgotPassword, resetPassword, getCurrentUser, refreshToken } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Authentication routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', authenticate, refreshToken);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Get current user route - requires authentication
router.get('/me', authenticate, getCurrentUser);

export default router; 