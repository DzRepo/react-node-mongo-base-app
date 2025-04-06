import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { Role } from '../models/Role';
import logger from '../utils/logger';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser | any;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Authentication failed: No bearer token provided');
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      logger.warn('Authentication failed: Empty token');
      return res.status(401).json({ message: 'Invalid token format' });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
      
      if (!decoded || !decoded.id) {
        logger.warn('Authentication failed: Invalid token payload');
        return res.status(401).json({ message: 'Invalid token' });
      }
      
      // Find user and populate roles
      const user = await User.findById(decoded.id)
        .populate('roles', 'name')
        .lean();
      
      if (!user) {
        logger.warn(`Authentication failed: User not found with ID ${decoded.id}`);
        return res.status(401).json({ message: 'User not found' });
      }

      // Transform roles to role names
      user.roles = user.roles.map((role: any) => role.name);
      
      // Attach user to request object
      req.user = user;
      
      next();
    } catch (jwtError) {
      logger.warn('Authentication failed: JWT verification error', jwtError);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// Optional authentication - attaches user if token is valid, but continues even if not
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next();
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
      
      if (!decoded || !decoded.id) {
        return next();
      }
      
      // Find user and populate roles
      const user = await User.findById(decoded.id).lean();
      
      if (user) {
        // Get role names for the user
        const roles = await Role.find({ _id: { $in: user.roles } }).select('name').lean();
        user.roles = roles.map(role => role.name);
        req.user = user;
      }
    } catch (jwtError) {
      // JWT verification failed, but we continue anyway for optional auth
      logger.debug('Optional auth: JWT verification failed', jwtError);
    }
    
    next();
  } catch (error) {
    // On any error, just continue without authentication
    logger.debug('Optional auth error:', error);
    next();
  }
};

// Check if user has specific role
export const hasRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const userRoles = req.user.roles;
    const hasRequiredRole = roles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    next();
  };
}; 