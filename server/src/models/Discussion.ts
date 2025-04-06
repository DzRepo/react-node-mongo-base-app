import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';

export interface IDiscussion extends Document {
  title: string;
  content: string;
  author: mongoose.Types.ObjectId | IUser;
  tags: string[];
  views: number;
  isLocked: boolean;
  isPinned: boolean;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const discussionSchema = new Schema<IDiscussion>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    views: {
      type: Number,
      default: 0,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
discussionSchema.index({ title: 'text', content: 'text' });
discussionSchema.index({ author: 1 });
discussionSchema.index({ tags: 1 });
discussionSchema.index({ createdAt: -1 });
discussionSchema.index({ views: -1 });

export const Discussion = mongoose.model<IDiscussion>('Discussion', discussionSchema); 