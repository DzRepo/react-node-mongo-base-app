import { Request, Response } from 'express';
import { Discussion } from '../models/Discussion';
import { Comment } from '../models/Comment';
import { Reaction, ReactionType } from '../models/Reaction';
import mongoose from 'mongoose';

// Get all discussions with pagination
export const getAllDiscussions = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Build the query based on authentication:
    // - Show all discussions (public and private) to logged in users
    // - Show only public discussions to non-logged in users
    let query: any = {};
    
    if (req.user) {
      console.log("Retrieving all discussions for user:", req.user._id);
      // User is logged in - show all discussions (both public and private)
      query = {}; // Empty query returns all discussions
      console.log('User is authenticated, returning all discussions (public and private)');
    } else {
      // User is not logged in - only show public discussions
      console.log("Retrieving all discussions for non-logged in user");
      query = { isPrivate: false };
      console.log('User is not authenticated, returning only public discussions');
    }
    
    const discussions = await Discussion.find(query)
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'firstName lastName email')
      .lean();
    
    // Count total discussions matching the query for pagination
    const total = await Discussion.countDocuments(query);
    
    console.log(`Found ${discussions.length} discussions (out of ${total} total) matching query criteria`);
    
    // Get reaction counts for each discussion
    const discussionIds = discussions.map(d => d._id);
    const reactionCounts = await Reaction.aggregate([
      { 
        $match: { 
          targetType: 'Discussion', 
          target: { $in: discussionIds },
          type: ReactionType.LIKE 
        } 
      },
      { $group: { _id: '$target', count: { $sum: 1 } } }
    ]);
    
    // Get comment counts for each discussion
    const commentCounts = await Comment.aggregate([
      { $match: { discussion: { $in: discussionIds } } },
      { $group: { _id: '$discussion', count: { $sum: 1 } } }
    ]);
    
    // Create a map for easy lookup
    const likesMap = new Map(reactionCounts.map(item => [item._id.toString(), item.count]));
    const commentsMap = new Map(commentCounts.map(item => [item._id.toString(), item.count]));
    
    // Add counts to each discussion
    const discussionsWithCounts = discussions.map(discussion => {
      const id = discussion._id.toString();
      return {
        ...discussion,
        likesCount: likesMap.get(id) || 0,
        commentsCount: commentsMap.get(id) || 0
      };
    });
    
    res.status(200).json({
      discussions: discussionsWithCounts,
      pagination: {
        totalDocs: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error getting discussions:', error);
    res.status(500).json({ message: 'Server error while fetching discussions' });
  }
};

// Get single discussion with comments
export const getDiscussion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid discussion ID' });
    }
    
    // Increment view count
    await Discussion.findByIdAndUpdate(id, { $inc: { views: 1 } });
    
    // Fetch the discussion with author details
    const discussion = await Discussion.findById(id)
      .populate('author', 'firstName lastName email')
      .lean();
      
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }
    
    // Get root-level comments
    const rootComments = await Comment.find({ 
      discussion: id,
      parent: null,
      isDeleted: false
    })
    .sort({ createdAt: -1 })
    .populate('author', 'firstName lastName email')
    .lean();
    
    // Get all replies
    const allReplies = await Comment.find({
      discussion: id,
      parent: { $ne: null },
      isDeleted: false
    })
    .populate('author', 'firstName lastName email')
    .lean();
    
    // Get reaction counts
    const likeCount = await Reaction.countDocuments({
      targetType: 'Discussion',
      target: id,
      type: ReactionType.LIKE
    });
    
    // Check if current user has reacted
    const userReactions = req.user ? await Reaction.find({
      user: req.user._id,
      targetType: 'Discussion',
      target: id
    }) : [];
    
    // Create a map of user reactions
    const userReactionsMap = userReactions.reduce((acc, reaction) => {
      acc[reaction.type] = true;
      return acc;
    }, {} as Record<string, boolean>);
    
    // Organize comments into a nested structure
    const commentMap = new Map();
    rootComments.forEach(comment => {
      commentMap.set(comment._id.toString(), { ...comment, replies: [] });
    });
    
    allReplies.forEach(reply => {
      const parentId = reply.parent?.toString();
      if (parentId && commentMap.has(parentId)) {
        commentMap.get(parentId).replies.push(reply);
      }
    });
    
    res.status(200).json({
      discussion: {
        ...discussion,
        likeCount,
        userReactions: userReactionsMap
      },
      comments: Array.from(commentMap.values())
    });
  } catch (error) {
    console.error('Error getting discussion:', error);
    res.status(500).json({ message: 'Server error while fetching discussion' });
  }
};

// Create new discussion
export const createDiscussion = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const { title, content, tags, isPrivate } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    
    const newDiscussion = new Discussion({
      title,
      content,
      author: req.user._id,
      tags: tags || [],
      isPrivate: isPrivate || false
    });
    
    const savedDiscussion = await newDiscussion.save();
    
    res.status(201).json(savedDiscussion);
  } catch (error) {
    console.error('Error creating discussion:', error);
    res.status(500).json({ message: 'Server error while creating discussion' });
  }
};

// Update discussion
export const updateDiscussion = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const { id } = req.params;
    const { title, content, tags, isPrivate } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid discussion ID' });
    }
    
    const discussion = await Discussion.findById(id);
    
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }
    
    // Check if user is author or admin
    const isAdmin = req.user.roles.includes('admin');
    const isAuthor = discussion.author.toString() === req.user._id.toString();
    
    if (!isAdmin && !isAuthor) {
      return res.status(403).json({ message: 'Not authorized to update this discussion' });
    }
    
    // Don't allow updates if discussion is locked (unless admin)
    if (discussion.isLocked && !isAdmin) {
      return res.status(403).json({ message: 'Discussion is locked' });
    }
    
    const updatedDiscussion = await Discussion.findByIdAndUpdate(
      id,
      { title, content, tags, isPrivate },
      { new: true, runValidators: true }
    );
    
    res.status(200).json(updatedDiscussion);
  } catch (error) {
    console.error('Error updating discussion:', error);
    res.status(500).json({ message: 'Server error while updating discussion' });
  }
};

// Delete discussion
export const deleteDiscussion = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid discussion ID' });
    }
    
    const discussion = await Discussion.findById(id);
    
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }
    
    // Check if user is author or admin
    const isAdmin = req.user.roles.includes('admin');
    const isAuthor = discussion.author.toString() === req.user._id.toString();
    
    if (!isAdmin && !isAuthor) {
      return res.status(403).json({ message: 'Not authorized to delete this discussion' });
    }
    
    // Delete associated comments and reactions
    await Comment.deleteMany({ discussion: id });
    await Reaction.deleteMany({ targetType: 'Discussion', target: id });
    
    // Delete the discussion
    await Discussion.findByIdAndDelete(id);
    
    res.status(200).json({ message: 'Discussion deleted successfully' });
  } catch (error) {
    console.error('Error deleting discussion:', error);
    res.status(500).json({ message: 'Server error while deleting discussion' });
  }
};

// Lock/unlock discussion (admin only)
export const toggleLockDiscussion = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.roles.includes('admin')) {
      return res.status(403).json({ message: 'Admin privileges required' });
    }
    
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid discussion ID' });
    }
    
    const discussion = await Discussion.findById(id);
    
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }
    
    discussion.isLocked = !discussion.isLocked;
    await discussion.save();
    
    res.status(200).json({
      isLocked: discussion.isLocked,
      message: discussion.isLocked ? 'Discussion locked successfully' : 'Discussion unlocked successfully'
    });
  } catch (error) {
    console.error('Error toggling discussion lock:', error);
    res.status(500).json({ message: 'Server error while updating discussion' });
  }
};

// Pin/unpin discussion (admin only)
export const togglePinDiscussion = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.roles.includes('admin')) {
      return res.status(403).json({ message: 'Admin privileges required' });
    }
    
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid discussion ID' });
    }
    
    const discussion = await Discussion.findById(id);
    
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }
    
    discussion.isPinned = !discussion.isPinned;
    await discussion.save();
    
    res.status(200).json({
      isPinned: discussion.isPinned,
      message: discussion.isPinned ? 'Discussion pinned successfully' : 'Discussion unpinned successfully'
    });
  } catch (error) {
    console.error('Error toggling discussion pin:', error);
    res.status(500).json({ message: 'Server error while updating discussion' });
  }
}; 