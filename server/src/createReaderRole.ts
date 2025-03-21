import mongoose from 'mongoose';
import { Role } from './models/Role';
import logger from './utils/logger';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/datastore?authSource=admin&retryWrites=true&w=majority';

async function createReaderRole() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    logger.info(`Connected to MongoDB:${MONGODB_URI}`);

    // List all existing roles
    const existingRoles = await Role.find({});
    logger.info(`Found ${existingRoles.length} existing roles:`);
    existingRoles.forEach(role => {
      logger.info(`  - ${role.name}: ${role.permissions.join(', ')}`);
    });

    // Check if reader role exists
    const existingRole = await Role.findOne({ name: 'reader' });
    
    if (!existingRole) {
      logger.info('Creating reader role');
      try {
        const readerRole = await Role.create({
          name: 'reader',
          description: 'Can read all content but only modify their own',
          permissions: ['read:all', 'write:own'],
          isSystem: true,
        });
        logger.info(`Reader role created successfully with ID: ${readerRole._id}`);
      } catch (createError) {
        logger.error('Error creating reader role:', createError);
        if (createError.code === 11000) {
          logger.error('Duplicate key error - role with this name already exists');
        }
      }
    } else {
      logger.info(`Reader role already exists with ID: ${existingRole._id}`);
    }
    
    // Verify the newly created role
    const verifyRole = await Role.findOne({ name: 'reader' });
    if (verifyRole) {
      logger.info(`Verified reader role exists: ${verifyRole.name} with permissions: ${verifyRole.permissions.join(', ')}`);
    } else {
      logger.warn('Failed to verify reader role after creation');
    }
  } catch (error) {
    logger.error('Error creating reader role:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

// Run the function
createReaderRole()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Script failed:', error);
    process.exit(1);
  }); 