import express from 'express';

const router = express.Router();

// Import controller functions from shareController
const shareController = {
  getDiscussionShareInfo: async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      
      // Placeholder for fetching discussion info
      const shareUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/discussions/${id}`;
      const shareText = `Check out this discussion!`;
      
      res.json({
        url: shareUrl,
        text: shareText,
        title: 'Discussion Title',
        author: 'Author Name'
      });
      
    } catch (error) {
      console.error('Error getting discussion share info:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },
  
  getCommentShareInfo: async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      
      // Placeholder for fetching comment info
      const discussionId = 'placeholderId';
      const shareUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/discussions/${discussionId}?comment=${id}`;
      const shareText = `Check out this comment!`;
      
      res.json({
        url: shareUrl,
        text: shareText,
        title: 'Discussion Title',
        author: 'Comment Author'
      });
      
    } catch (error) {
      console.error('Error getting comment share info:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

// GET /api/share/discussions/:id - Get share info for a discussion
router.get('/discussions/:id', shareController.getDiscussionShareInfo);

// GET /api/share/comments/:id - Get share info for a comment
router.get('/comments/:id', shareController.getCommentShareInfo);

export default router; 