import mongoose from 'mongoose';
import { Role, DEFAULT_ROLES } from '../models/Role';
import dotenv from 'dotenv';

dotenv.config();

const initRoles = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/community-app');
    console.log('Connected to MongoDB');

    // Create default roles if they don't exist
    for (const role of DEFAULT_ROLES) {
      const existingRole = await Role.findOne({ name: role.name });
      if (!existingRole) {
        await Role.create(role);
        console.log(`Created role: ${role.name}`);
      } else {
        console.log(`Role already exists: ${role.name}`);
      }
    }

    console.log('Roles initialization completed');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing roles:', error);
    process.exit(1);
  }
};

initRoles(); 