import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';
import { IDiscussion } from './Discussion';

export interface IComment extends Document {
  content: string;
  author: mongoose.Types.ObjectId | IUser;
  discussion: mongoose.Types.ObjectId | IDiscussion;
  parent?: mongoose.Types.ObjectId | IComment; // For threaded comments (replies)
  isEdited: boolean;
  isDeleted: boolean;
  isFlagged: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    content: {
      type: String,
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    discussion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Discussion',
      required: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
commentSchema.index({ discussion: 1, createdAt: -1 });
commentSchema.index({ parent: 1 });
commentSchema.index({ author: 1 });

export const Comment = mongoose.model<IComment>('Comment', commentSchema); 