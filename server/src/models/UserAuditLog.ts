import mongoose, { Schema, Document } from 'mongoose';

export interface IUserAuditLog extends Document {
  userId: mongoose.Types.ObjectId;
  action: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const userAuditLogSchema = new Schema<IUserAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'login',
        'logout',
        'register',
        'password_change',
        'profile_update',
        'role_change',
        'email_verification',
        'social_auth',
      ],
    },
    details: {
      type: Schema.Types.Mixed,
      required: true,
    },
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
userAuditLogSchema.index({ userId: 1, createdAt: -1 });
userAuditLogSchema.index({ action: 1, createdAt: -1 });

export const UserAuditLog = mongoose.model<IUserAuditLog>('UserAuditLog', userAuditLogSchema); 