import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password?: string; // Optional for social auth
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
  roles: string[];
  bio?: string;
  interests?: string[];
  profilePicture?: string;
  socialLinks?: {
    website?: string;
    github?: string;
    twitter?: string;
    linkedin?: string;
  };
  themePreference?: 'light' | 'dark' | 'system';
  socialAuth?: {
    provider: string; // 'google', 'github', etc.
    providerId: string;
    accessToken?: string;
    refreshToken?: string;
  };
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: function(this: IUser) {
        return !this.socialAuth; // Password is required only for local auth
      },
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    roles: [{
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
    }],
    bio: {
      type: String,
    },
    interests: [{
      type: String,
    }],
    profilePicture: {
      type: String,
    },
    socialLinks: {
      website: {
        type: String,
      },
      github: {
        type: String,
      },
      twitter: {
        type: String,
      },
      linkedin: {
        type: String,
      }
    },
    themePreference: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    },
    socialAuth: {
      provider: {
        type: String,
      },
      providerId: {
        type: String,
      },
      accessToken: {
        type: String,
      },
      refreshToken: {
        type: String,
      }
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    if (this.password) {
      this.password = await bcrypt.hash(this.password, salt);
    }
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema); 