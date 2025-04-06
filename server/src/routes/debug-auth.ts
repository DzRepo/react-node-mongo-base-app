import { Router } from 'express';
import { User } from '../models/User';
import logger from '../utils/logger';

const router = Router();

router.post('/debug-login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        logger.info(`Debug login attempt for email: ${email}`);
        
        // Find user
        const user = await User.findOne({ email }).select('+password');
        logger.info(`User found: ${!!user}`);
        
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        
        // Log user data (excluding sensitive info)
        logger.info('User data:', {
            id: user._id,
            email: user.email,
            hasPassword: !!user.password,
            roles: user.roles,
            isEmailVerified: user.isEmailVerified
        });
        
        // Check password
        const isMatch = await user.comparePassword(password);
        logger.info(`Password match: ${isMatch}`);
        
        if (!isMatch) {
            return res.status(401).json({ message: 'Password does not match' });
        }
        
        res.json({ message: 'Debug login successful' });
    } catch (error) {
        logger.error('Debug login error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router; 