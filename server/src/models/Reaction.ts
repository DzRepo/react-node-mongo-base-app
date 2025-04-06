import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';

export enum ReactionType {
  LIKE = 'like',
  BOOKMARK = 'bookmark',
  FLAG = 'flag',
}

export interface IReaction extends Document {
  type: ReactionType;
  user: mongoose.Types.ObjectId | IUser;
  targetType: 'Discussion' | 'Comment';
  target: mongoose.Types.ObjectId;
  flagReason?: string; // Used when type is FLAG
  createdAt: Date;
  updatedAt: Date;
}

const reactionSchema = new Schema<IReaction>(
  {
    type: {
      type: String,
      required: true,
      enum: Object.values(ReactionType),
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetType: {
      type: String,
      required: true,
      enum: ['Discussion', 'Comment'],
    },
    target: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'targetType',
    },
    flagReason: {
      type: String,
      required: function(this: IReaction) {
        return this.type === ReactionType.FLAG;
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create compound unique index to prevent duplicate reactions
reactionSchema.index(
  { user: 1, target: 1, type: 1 },
  { unique: true }
);

// Create indexes for faster queries
reactionSchema.index({ target: 1, type: 1 });
reactionSchema.index({ user: 1, type: 1 });

export const Reaction = mongoose.model<IReaction>('Reaction', reactionSchema); 