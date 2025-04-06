import { Request, Response } from 'express';
import { Comment } from '../models/Comment';
import { Discussion } from '../models/Discussion';
import { Reaction, ReactionType } from '../models/Reaction';
import mongoose from 'mongoose';

// Create a new comment
export const createComment = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const { content, discussionId, parentId } = req.body;
    
    if (!content || !discussionId) {
      return res.status(400).json({ message: 'Content and discussion ID are required' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(discussionId)) {
      return res.status(400).json({ message: 'Invalid discussion ID' });
    }
    
    // Check if discussion exists and is not locked
    const discussion = await Discussion.findById(discussionId);
    
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }
    
    if (discussion.isLocked && !req.user.roles.includes('admin')) {
      return res.status(403).json({ message: 'Discussion is locked' });
    }
    
    // Check if parent comment exists if parentId is provided
    if (parentId) {
      if (!mongoose.Types.ObjectId.isValid(parentId)) {
        return res.status(400).json({ message: 'Invalid parent comment ID' });
      }
      
      const parentComment = await Comment.findById(parentId);
      
      if (!parentComment) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }
      
      if (parentComment.discussion.toString() !== discussionId) {
        return res.status(400).json({ message: 'Parent comment does not belong to this discussion' });
      }
    }
    
    const newComment = new Comment({
      content,
      author: req.user._id,
      discussion: discussionId,
      parent: parentId || null
    });
    
    const savedComment = await newComment.save();
    
    // Populate author information
    await savedComment.populate('author', 'firstName lastName email');
    
    res.status(201).json(savedComment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Server error while creating comment' });
  }
};

// Update a comment
export const updateComment = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const { id } = req.params;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }
    
    const comment = await Comment.findById(id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Check if user is author or admin
    const isAdmin = req.user.roles.includes('admin');
    const isAuthor = comment.author.toString() === req.user._id.toString();
    
    if (!isAdmin && !isAuthor) {
      return res.status(403).json({ message: 'Not authorized to update this comment' });
    }
    
    // Check if discussion is locked
    const discussion = await Discussion.findById(comment.discussion);
    
    if (discussion?.isLocked && !isAdmin) {
      return res.status(403).json({ message: 'Discussion is locked' });
    }
    
    comment.content = content;
    comment.isEdited = true;
    await comment.save();
    
    // Populate author information
    await comment.populate('author', 'firstName lastName email');
    
    res.status(200).json(comment);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ message: 'Server error while updating comment' });
  }
};

// Delete a comment (soft delete)
export const deleteComment = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }
    
    const comment = await Comment.findById(id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Check if user is author or admin/moderator
    const isAdminOrMod = req.user.roles.some((role: string) => ['admin', 'moderator'].includes(role));
    const isAuthor = comment.author.toString() === req.user._id.toString();
    
    if (!isAdminOrMod && !isAuthor) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }
    
    // Soft delete - mark as deleted instead of removing from DB
    comment.isDeleted = true;
    comment.content = '[Comment deleted]';
    await comment.save();
    
    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Server error while deleting comment' });
  }
};

// Flag a comment
export const flagComment = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ message: 'Reason for flagging is required' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }
    
    const comment = await Comment.findById(id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Check if user has already flagged this comment
    const existingFlag = await Reaction.findOne({
      user: req.user._id,
      targetType: 'Comment',
      target: id,
      type: ReactionType.FLAG
    });
    
    if (existingFlag) {
      return res.status(400).json({ message: 'You have already flagged this comment' });
    }
    
    // Create new flag reaction
    const flagReaction = new Reaction({
      type: ReactionType.FLAG,
      user: req.user._id,
      targetType: 'Comment',
      target: id,
      flagReason: reason
    });
    
    await flagReaction.save();
    
    // Mark comment as flagged after a certain threshold
    const flagCount = await Reaction.countDocuments({
      targetType: 'Comment',
      target: id,
      type: ReactionType.FLAG
    });
    
    const FLAG_THRESHOLD = 3; // Configurable threshold
    
    if (flagCount >= FLAG_THRESHOLD) {
      comment.isFlagged = true;
      await comment.save();
    }
    
    res.status(200).json({ message: 'Comment flagged successfully' });
  } catch (error) {
    console.error('Error flagging comment:', error);
    res.status(500).json({ message: 'Server error while flagging comment' });
  }
};

// Get comments for a discussion with a hierarchical loading approach
export const getDiscussionComments = async (req: Request, res: Response) => {
  try {
    const { discussionId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Max number of replies to load per level
    const MAX_REPLIES_PER_LEVEL = 5;
    
    if (!mongoose.Types.ObjectId.isValid(discussionId)) {
      return res.status(400).json({ message: 'Invalid discussion ID' });
    }
    
    // Check if discussion exists
    const discussion = await Discussion.findById(discussionId);
    
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }
    
    // Step 1: Fetch root-level comments with pagination
    const rootComments = await Comment.find({
      discussion: discussionId,
      parent: null,
      isDeleted: false
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'firstName lastName email')
    .lean();
    
    // Get total count of root comments for pagination
    const total = await Comment.countDocuments({
      discussion: discussionId,
      parent: null,
      isDeleted: false
    });
    
    // Recursive function to load replies for a comment
    const loadReplies = async (commentId: string): Promise<any[]> => {
      const replies = await Comment.find({
        discussion: discussionId,
        parent: commentId,
        isDeleted: false
      })
      .sort({ createdAt: 1 })
      .limit(MAX_REPLIES_PER_LEVEL)
      .populate('author', 'firstName lastName email')
      .lean();
      
      // Get total count of replies
      const totalReplies = await Comment.countDocuments({
        discussion: discussionId,
        parent: commentId,
        isDeleted: false
      });
      
      // Get like counts for these replies
      const replyIds = replies.map(reply => reply._id);
      const likeCountsData = await Reaction.aggregate([
        { 
          $match: { 
            targetType: 'Comment', 
            target: { $in: replyIds },
            type: ReactionType.LIKE 
          } 
        },
        { $group: { _id: '$target', count: { $sum: 1 } } }
      ]);
      
      // Create a map of like counts
      const likesMap = new Map();
      likeCountsData.forEach(item => {
        likesMap.set(item._id.toString(), item.count);
      });
      
      // Load nested replies for each reply
      const repliesWithNested = await Promise.all(
        replies.map(async (reply) => {
          const nestedReplies = await loadReplies(reply._id.toString());
          return {
            ...reply,
            likeCount: likesMap.get(reply._id.toString()) || 0,
            replies: nestedReplies,
            hasMoreReplies: totalReplies > MAX_REPLIES_PER_LEVEL,
            totalReplies
          };
        })
      );
      
      return repliesWithNested;
    };
    
    // Step 2: For each root comment, get its replies recursively
    const commentTree = await Promise.all(
      rootComments.map(async (comment) => {
        // Get like count for the root comment
        const rootLikeCount = await Reaction.countDocuments({
          targetType: 'Comment',
          target: comment._id,
          type: ReactionType.LIKE
        });
        
        // Get total count of replies for this comment
        const totalReplies = await Comment.countDocuments({
          discussion: discussionId,
          parent: comment._id,
          isDeleted: false
        });
        
        // Load replies recursively
        const replies = await loadReplies(comment._id.toString());
        
        return {
          ...comment,
          likeCount: rootLikeCount,
          replies,
          hasMoreReplies: totalReplies > MAX_REPLIES_PER_LEVEL,
          totalReplies
        };
      })
    );
    
    res.status(200).json({
      comments: commentTree,
      total,
      page,
      limit,
      hasMore: total > skip + limit
    });
  } catch (error) {
    console.error('Error getting discussion comments:', error);
    res.status(500).json({ message: 'Server error while fetching comments' });
  }
};

// Get ALL comments for a discussion in flat structure (for debugging)
export const getFlatDiscussionComments = async (req: Request, res: Response) => {
  try {
    const { discussionId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(discussionId)) {
      return res.status(400).json({ message: 'Invalid discussion ID' });
    }

    // Helper function to get IDs of comments that have replies
    const getCommentsWithReplies = async (): Promise<string[]> => {
      interface ReplyComment {
        parent: mongoose.Types.ObjectId;
      }
      
      // Get all comments that are replies
      const replies = await Comment.find({
        discussion: discussionId,
        parent: { $ne: null }
      }).lean() as ReplyComment[];
      
      // Get unique parent IDs
      const parentIds = new Set(replies.map(reply => reply.parent.toString()));
      
      return Array.from(parentIds);
    };

    // Get the list of comments that have replies
    const commentsWithReplies = await getCommentsWithReplies();
    
    // Get ALL comments for this discussion 
    const allComments = await Comment.find({
      discussion: discussionId,
      $or: [
        { isDeleted: false },
        // Include deleted comments only if they have replies
        { isDeleted: true, _id: { $in: commentsWithReplies } }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('author', 'firstName lastName email')
    .lean();
    
    // Get like counts for each comment
    const commentIds = allComments.map(comment => comment._id);
    const likeCountsData = await Reaction.aggregate([
      { 
        $match: { 
          targetType: 'Comment', 
          target: { $in: commentIds },
          type: ReactionType.LIKE 
        } 
      },
      { $group: { _id: '$target', count: { $sum: 1 } } }
    ]);
    
    // Create a map of like counts
    const likesMap = new Map();
    likeCountsData.forEach(data => {
      likesMap.set(data._id.toString(), data.count);
    });
    
    // Add like counts to each comment
    const commentsWithLikes = allComments.map(comment => ({
      ...comment,
      likeCount: likesMap.get(comment._id.toString()) || 0
    }));
    
    // Return flat list
    res.status(200).json({
      totalComments: commentsWithLikes.length,
      comments: commentsWithLikes
    });
  } catch (error) {
    console.error('Error getting flat comments:', error);
    res.status(500).json({ message: 'Server error while fetching flat comments' });
  }
};

// Get more replies for a specific comment
export const getCommentReplies = async (req: Request, res: Response) => {
  try {
    const { discussionId } = req.params;
    const { parentId } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;
    const skip = (page - 1) * limit;
    
    if (!mongoose.Types.ObjectId.isValid(discussionId) || !mongoose.Types.ObjectId.isValid(parentId as string)) {
      return res.status(400).json({ message: 'Invalid discussion or comment ID' });
    }
    
    // Check if parent comment exists
    const parentComment = await Comment.findById(parentId);
    
    if (!parentComment) {
      return res.status(404).json({ message: 'Parent comment not found' });
    }
    
    // Get replies for this comment
    const replies = await Comment.find({
      discussion: discussionId,
      parent: parentId,
      isDeleted: false
    })
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'firstName lastName email')
    .lean();
    
    // Get total count of replies for pagination
    const total = await Comment.countDocuments({
      discussion: discussionId,
      parent: parentId,
      isDeleted: false
    });
    
    // Get like counts for these replies
    const replyIds = replies.map(reply => reply._id);
    const likeCountsData = await Reaction.aggregate([
      { 
        $match: { 
          targetType: 'Comment', 
          target: { $in: replyIds },
          type: ReactionType.LIKE 
        } 
      },
      { $group: { _id: '$target', count: { $sum: 1 } } }
    ]);
    
    // Create a map of like counts
    const likesMap = new Map();
    likeCountsData.forEach(item => {
      likesMap.set(item._id.toString(), item.count);
    });
    
    // Add like counts to replies
    const repliesWithLikes = replies.map(reply => ({
      ...reply,
      likeCount: likesMap.get(reply._id.toString()) || 0
    }));
    
    res.status(200).json({
      replies: repliesWithLikes,
      total,
      page,
      limit,
      hasMore: total > skip + limit
    });
  } catch (error) {
    console.error('Error getting comment replies:', error);
    res.status(500).json({ message: 'Server error while fetching replies' });
  }
}; 