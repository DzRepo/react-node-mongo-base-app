import mongoose from 'mongoose';
import { Role, DEFAULT_ROLES } from './models/Role';
import { User } from './models/User';
import { Discussion } from './models/Discussion';
import { Report, ReportStatus, ReportType } from './models/Report';
import logger from './utils/logger';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/datastore?authSource=admin&retryWrites=true&w=majority';

async function setupDatabase(shouldConnect = false, shouldDisconnect = false) {
  try {
    // Connect to MongoDB if requested
    if (shouldConnect) {
      await mongoose.connect(MONGODB_URI);
      logger.info(`Connected to MongoDB from setupDatabase:${MONGODB_URI}`);
    }

    // Check if default roles exist, create them if they don't
    // Use the DEFAULT_ROLES from the Role model
    for (const roleData of DEFAULT_ROLES) {
      const existingRole = await Role.findOne({ name: roleData.name });
      
      if (!existingRole) {
        logger.info(`Creating default role: ${roleData.name}`);
        await Role.create(roleData);
        logger.info(`Default role created: ${roleData.name}`);
      } 
    }

    // Check if admin user exists, create if it doesn't
    const adminExists = await User.findOne({ email: 'admin@example.com' });
    
    if (!adminExists) {
      logger.info('Creating admin user');
      
      // Get admin role
      const adminRole = await Role.findOne({ name: 'admin' });
      if (!adminRole) {
        throw new Error('Admin role not found');
      }
      
      // Create the admin user with plain password
      await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: 'password123',  // The pre-save hook will hash this
        roles: [adminRole._id],
        isEmailVerified: true
      });
      
      logger.info('Admin user created');
    } else {
      // Update existing admin password
      logger.info('Updating admin user password');
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.updateOne(
        { email: 'admin@example.com' },
        { $set: { password: hashedPassword } }
      );
      logger.info('Admin user password updated');
    }

    // Create sample discussions if none exist
    const discussionsCount = await Discussion.countDocuments();
    
    if (discussionsCount === 0) {
      logger.info('Creating sample discussions');
      
      // Get admin user
      const adminUser = await User.findOne({ email: 'admin@example.com' });
      
      if (adminUser) {
        // Create sample discussions
        await Discussion.create([
          {
            title: 'Welcome to the Discussion Forum!',
            content: '<p>This is our community discussion forum. Here you can ask questions, share ideas, and connect with other members.</p><p>Feel free to post your thoughts and engage with others!</p>',
            author: adminUser._id,
            tags: ['welcome', 'introduction'],
            views: 10,
            isPinned: true
          },
          {
            title: 'How to use the forum features',
            content: '<p>This forum has several features to enhance your experience:</p><ul><li>Create discussions</li><li>Comment on posts</li><li>Like discussions and comments</li><li>Bookmark important posts</li><li>Report inappropriate content</li></ul><p>Try them out!</p>',
            author: adminUser._id,
            tags: ['help', 'tutorial'],
            views: 5
          }
        ]);
        
        logger.info('Sample discussions created');
      }
    }

    // Create sample reports if none exist
    const reportsCount = await Report.countDocuments();
    
    if (reportsCount === 0) {
      logger.info('Creating sample reports');
      
      // Get admin user
      const adminUser = await User.findOne({ email: 'admin@example.com' });
      
      if (adminUser) {
        // Create sample reports
        await Report.create([
          {
            reporter: adminUser._id,
            targetType: ReportType.DISCUSSION,
            targetId: new mongoose.Types.ObjectId(), // This would be a real discussion ID in production
            reason: 'Inappropriate content',
            description: 'Contains offensive language',
            status: ReportStatus.NEW
          },
          {
            reporter: adminUser._id,
            targetType: ReportType.COMMENT,
            targetId: new mongoose.Types.ObjectId(), // This would be a real comment ID in production
            reason: 'Spam',
            description: 'Repeated promotional content',
            status: ReportStatus.IN_PROCESS
          },
          {
            reporter: adminUser._id,
            targetType: ReportType.USER,
            targetId: new mongoose.Types.ObjectId(), // This would be a real user ID in production
            reason: 'Harassment',
            description: 'User engaging in personal attacks',
            status: ReportStatus.COMPLETED,
            resolution: 'User warned and content removed'
          }
        ]);
        
        logger.info('Sample reports created');
      }
    }

    // Disconnect from MongoDB if requested (only when running as standalone script)
    if (shouldDisconnect) {
      await mongoose.disconnect();
      logger.info('Disconnected from MongoDB');
    }
  } catch (error) {
    logger.error('Database setup error:', error);
    if (shouldDisconnect) {
      await mongoose.disconnect();
      logger.info('Disconnected from MongoDB after error');
    }
    throw error;
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupDatabase(true, true)
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Setup failed:', error);
      process.exit(1);
    });
}

export default setupDatabase; 