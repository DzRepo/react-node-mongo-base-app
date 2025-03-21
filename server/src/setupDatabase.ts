import mongoose from 'mongoose';
import { Role, DEFAULT_ROLES } from './models/Role';
import logger from './utils/logger';
import dotenv from 'dotenv';

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
      } else {
        logger.info(`Default role already exists: ${roleData.name}`);
      }
    }

    logger.info('Database setup completed successfully');
    
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