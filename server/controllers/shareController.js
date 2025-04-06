const Discussion = require('../models/Discussion');
const Comment = require('../models/Comment');

/**
 * Get share information for a discussion
 * @route GET /api/share/discussions/:id
 * @access Public
 */
exports.getDiscussionShareInfo = async (req, res) => {
  try {
    const { id } = req.params;
    
    const discussion = await Discussion.findById(id)
      .populate('author', 'firstName lastName');
    
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }
    
    // Check if discussion is public or if the user has access
    if (!discussion.isPublic) {
      return res.status(403).json({ message: 'This discussion is not public and cannot be shared' });
    }
    
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/discussions/${discussion._id}`;
    
    // Create a share text that includes the title and author
    const authorName = `${discussion.author.firstName} ${discussion.author.lastName}`;
    const shareText = `Check out "${discussion.title}" by ${authorName}`;
    
    res.json({
      url: shareUrl,
      text: shareText,
      title: discussion.title,
      author: authorName
    });
    
  } catch (error) {
    console.error('Error getting discussion share info:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get share information for a comment
 * @route GET /api/share/comments/:id
 * @access Public
 */
exports.getCommentShareInfo = async (req, res) => {
  try {
    const { id } = req.params;
    
    const comment = await Comment.findById(id)
      .populate('author', 'firstName lastName')
      .populate('discussion');
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Check if the parent discussion is public
    const discussion = comment.discussion;
    if (!discussion.isPublic) {
      return res.status(403).json({ message: 'This comment belongs to a non-public discussion and cannot be shared' });
    }
    
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/discussions/${discussion._id}?comment=${comment._id}`;
    
    // Create a share text
    const authorName = `${comment.author.firstName} ${comment.author.lastName}`;
    const shareText = `Check out this comment by ${authorName} on "${discussion.title}"`;
    
    res.json({
      url: shareUrl,
      text: shareText,
      title: discussion.title,
      author: authorName
    });
    
  } catch (error) {
    console.error('Error getting comment share info:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 