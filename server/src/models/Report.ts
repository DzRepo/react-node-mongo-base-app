import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';

export enum ReportStatus {
  NEW = 'new',
  IN_PROCESS = 'in_process',
  COMPLETED = 'completed',
  DISMISSED = 'dismissed'
}

export enum ReportType {
  COMMENT = 'Comment',
  DISCUSSION = 'Discussion',
  USER = 'User'
}

export interface IReport extends Document {
  reporter: mongoose.Types.ObjectId | IUser;
  targetType: ReportType;
  targetId: mongoose.Types.ObjectId;
  reason: string;
  description?: string;
  status: ReportStatus;
  assignedTo?: mongoose.Types.ObjectId | IUser;
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetType: {
      type: String,
      enum: Object.values(ReportType),
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: Object.values(ReportStatus),
      default: ReportStatus.NEW,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolution: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ targetType: 1, targetId: 1 });
reportSchema.index({ reporter: 1 });
reportSchema.index({ assignedTo: 1 });

export const Report = mongoose.model<IReport>('Report', reportSchema); 