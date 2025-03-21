import mongoose, { Schema, Document } from 'mongoose';

export interface IRole extends Document {
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean; // To prevent modification of system roles
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new Schema<IRole>(
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

// Prevent modification of existing system roles, but allow creating new ones
roleSchema.pre('save', function(next) {
  // For new documents (being created for the first time), always allow
  if (this.isNew) {
    return next();
  }
  
  // For existing documents, prevent changes if they are system roles
  if (this.isSystem && this.isModified()) {
    return next(new Error('System roles cannot be modified'));
  }
  
  next();
});

export const Role = mongoose.model<IRole>('Role', roleSchema);

// Default system roles
export const DEFAULT_ROLES = [
  {
    name: 'admin',
    description: 'Administrator with full access',
    permissions: ['*'], // Wildcard for all permissions
    isSystem: true,
  },
  {
    name: 'user',
    description: 'Standard user with basic access',
    permissions: ['read:own', 'write:own'],
    isSystem: true,
  },
  {
    name: 'moderator',
    description: 'Moderator with content management access',
    permissions: ['read:all', 'write:own', 'moderate:content'],
    isSystem: true,
  },
  {
    name: 'reader',
    description: 'Can read all content but only modify their own',
    permissions: ['read:all', 'write:own'],
    isSystem: true,
  },
]; 