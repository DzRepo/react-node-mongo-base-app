import { Request, Response } from 'express';
import { Reaction, ReactionType } from '../models/Reaction';
import { Discussion, IDiscussion } from '../models/Discussion';
import { Comment, IComment } from '../models/Comment';
import mongoose from 'mongoose';

// Get reaction status for a target (check if user has reacted)
export const getReactionStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const { targetType, targetId } = req.params;
    
    if (!['Discussion', 'Comment'].includes(targetType)) {
      return res.status(400).json({ message: 'Invalid target type' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ message: 'Invalid target ID' });
    }
    
    // Check if target exists
    let target;
    if (targetType === 'Discussion') {
      target = await Discussion.findById(targetId);
    } else {
      target = await Comment.findById(targetId);
    }
    
    if (!target) {
      return res.status(404).json({ message: `${targetType} not found` });
    }
    
    // Check if reactions exist
    const reactions = {
      liked: false,
      bookmarked: false
    };
    
    // Check if user has liked the target
    const likeReaction = await Reaction.findOne({
      user: req.user._id,
      targetType,
      target: targetId,
      type: ReactionType.LIKE
    });
    
    if (likeReaction) {
      reactions.liked = true;
    }
    
    // Check if user has bookmarked the target (only for discussions)
    if (targetType === 'Discussion') {
      const bookmarkReaction = await Reaction.findOne({
        user: req.user._id,
        targetType,
        target: targetId,
        type: ReactionType.BOOKMARK
      });
      
      if (bookmarkReaction) {
        reactions.bookmarked = true;
      }
    }
    
    res.status(200).json(reactions);
  } catch (error) {
    console.error('Error getting reaction status:', error);
    res.status(500).json({ message: 'Server error while getting reaction status' });
  }
};

// Toggle like on discussion or comment
export const toggleLike = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const { targetType, targetId } = req.params;
    
    if (!['Discussion', 'Comment'].includes(targetType)) {
      return res.status(400).json({ message: 'Invalid target type' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ message: 'Invalid target ID' });
    }
    
    // Check if target exists
    let target;
    if (targetType === 'Discussion') {
      target = await Discussion.findById(targetId);
    } else {
      target = await Comment.findById(targetId);
    }
    
    if (!target) {
      return res.status(404).json({ message: `${targetType} not found` });
    }
    
    // Check if discussion is locked (if target is Discussion or if target is Comment in a locked discussion)
    if (targetType === 'Discussion' && (target as IDiscussion).isLocked && !req.user.roles.includes('admin')) {
      return res.status(403).json({ message: 'Discussion is locked' });
    }
    
    if (targetType === 'Comment') {
      const discussion = await Discussion.findById((target as IComment).discussion);
      if (discussion?.isLocked && !req.user.roles.includes('admin')) {
        return res.status(403).json({ message: 'Discussion is locked' });
      }
    }
    
    // Check if reaction already exists
    const existingReaction = await Reaction.findOne({
      user: req.user._id,
      targetType,
      target: targetId,
      type: ReactionType.LIKE
    });
    
    let liked = false;
    
    if (existingReaction) {
      // Remove like if it exists
      await Reaction.findByIdAndDelete(existingReaction._id);
      liked = false;
    } else {
      // Add like if it doesn't exist
      const newReaction = new Reaction({
        type: ReactionType.LIKE,
        user: req.user._id,
        targetType,
        target: targetId
      });
      
      await newReaction.save();
      liked = true;
    }
    
    // Get the updated like count
    const likeCount = await Reaction.countDocuments({
      targetType,
      target: targetId,
      type: ReactionType.LIKE
    });
    
    res.status(200).json({ 
      liked, 
      message: liked ? 'Like added' : 'Like removed',
      likeCount 
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ message: 'Server error while toggling like' });
  }
};

// Toggle bookmark on discussion
export const toggleBookmark = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const { discussionId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(discussionId)) {
      return res.status(400).json({ message: 'Invalid discussion ID' });
    }
    
    // Check if discussion exists
    const discussion = await Discussion.findById(discussionId);
    
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }
    
    // Check if bookmark already exists
    const existingBookmark = await Reaction.findOne({
      user: req.user._id,
      targetType: 'Discussion',
      target: discussionId,
      type: ReactionType.BOOKMARK
    });
    
    if (existingBookmark) {
      // Remove bookmark if it exists
      await Reaction.findByIdAndDelete(existingBookmark._id);
      res.status(200).json({ bookmarked: false, message: 'Bookmark removed' });
    } else {
      // Add bookmark if it doesn't exist
      const newBookmark = new Reaction({
        type: ReactionType.BOOKMARK,
        user: req.user._id,
        targetType: 'Discussion',
        target: discussionId
      });
      
      await newBookmark.save();
      res.status(200).json({ bookmarked: true, message: 'Bookmark added' });
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    res.status(500).json({ message: 'Server error while toggling bookmark' });
  }
};

// Get user's bookmarks
export const getUserBookmarks = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Find all the user's bookmarks
    const bookmarks = await Reaction.find({
      user: req.user._id,
      type: ReactionType.BOOKMARK,
      targetType: 'Discussion'
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
    const total = await Reaction.countDocuments({
      user: req.user._id,
      type: ReactionType.BOOKMARK,
      targetType: 'Discussion'
    });
    
    // Get the discussion details for each bookmark
    const discussionIds = bookmarks.map(bookmark => bookmark.target);
    
    const discussions = await Discussion.find({
      _id: { $in: discussionIds }
    })
    .populate('author', 'firstName lastName email')
    .lean();
    
    // Create a map for easy lookup
    const discussionMap = new Map(discussions.map(discussion => [discussion._id.toString(), discussion]));
    
    // Add discussion details to each bookmark
    const bookmarksWithDetails = bookmarks.map(bookmark => {
      const discussionId = bookmark.target.toString();
      return {
        bookmark: {
          _id: bookmark._id,
          createdAt: bookmark.createdAt
        },
        discussion: discussionMap.get(discussionId)
      };
    }).filter(item => item.discussion !== undefined);
    
    res.status(200).json({
      bookmarks: bookmarksWithDetails,
      pagination: {
        totalDocs: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error getting bookmarks:', error);
    res.status(500).json({ message: 'Server error while fetching bookmarks' });
  }
};

// Share a discussion (just returns share data, actual sharing happens on the frontend)
export const getShareData = async (req: Request, res: Response) => {
  try {
    const { discussionId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(discussionId)) {
      return res.status(400).json({ message: 'Invalid discussion ID' });
    }
    
    const discussion = await Discussion.findById(discussionId)
      .populate('author', 'firstName lastName')
      .lean();
    
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }
    
    // Cast the author to any to access the populated fields
    const author = discussion.author as any;
    
    // Generate share data for social media
    const shareData = {
      title: discussion.title,
      text: `Check out this discussion by ${author.firstName} ${author.lastName}`,
      url: `${process.env.CLIENT_URL}/discussions/${discussionId}`
    };
    
    res.status(200).json(shareData);
  } catch (error) {
    console.error('Error generating share data:', error);
    res.status(500).json({ message: 'Server error while generating share data' });
  }
}; 