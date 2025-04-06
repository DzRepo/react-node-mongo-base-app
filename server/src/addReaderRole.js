// Simple script to add reader role to MongoDB
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/datastore?authSource=admin&retryWrites=true&w=majority';

// Role schema (simplified version of what's in the models)
const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    permissions: [{
      type: String,
      required: true,
    }],
    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Role = mongoose.model('Role', roleSchema);

async function addReaderRole() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    // console.log('Connected to MongoDB');

    // List existing roles
    const roles = await Role.find({});
    console.log(`Found ${roles.length} roles:`);
    roles.forEach(role => {
      console.log(` - ${role.name}: ${role.permissions.join(', ')}`);
    });

    // Check if reader role exists
    const existingReader = await Role.findOne({ name: 'reader' });
    
    if (existingReader) {
      console.log(`Reader role already exists with ID: ${existingReader._id}`);
    } else {
      // Create reader role
      console.log('Creating reader role...');
      const readerRole = new Role({
        name: 'reader',
        description: 'Can read all content but only modify their own',
        permissions: ['read:all', 'write:own'],
        isSystem: true,
      });
      
      await readerRole.save();
      console.log(`Reader role created with ID: ${readerRole._id}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
addReaderRole()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 