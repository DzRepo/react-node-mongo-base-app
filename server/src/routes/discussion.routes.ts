import { Router } from 'express';
import * as discussionController from '../controllers/discussionController';
import * as commentController from '../controllers/commentController';
import * as reactionController from '../controllers/reactionController';
import { authenticate } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

// Public routes (accessible to non-members)
router.get('/discussions', discussionController.getAllDiscussions);
router.get('/discussions/:id', discussionController.getDiscussion);
router.get('/discussions/:discussionId/comments', commentController.getDiscussionComments);

// Share data route
router.get('/share/discussions/:discussionId', reactionController.getShareData);

// Protected routes (members only)
router.post('/discussions', authenticate, discussionController.createDiscussion);
router.put('/discussions/:id', authenticate, discussionController.updateDiscussion);
router.delete('/discussions/:id', authenticate, discussionController.deleteDiscussion);

// Comment routes
router.post('/comments', authenticate, (req, res) => {
  logger.info(`Creating comment for discussion: ${req.body.discussionId}`);
  logger.info(`User object in request: ${req.user ? req.user._id : 'No user'}`);
  logger.info(`Request headers: ${JSON.stringify(req.headers)}`);
  return commentController.createComment(req, res);
});
router.put('/comments/:id', authenticate, commentController.updateComment);
router.delete('/comments/:id', authenticate, commentController.deleteComment);
router.post('/comments/:id/flag', authenticate, commentController.flagComment);

// Get more replies for a specific comment
router.get('/discussions/:discussionId/comments/replies', commentController.getCommentReplies);

// Reaction routes
router.post('/reactions/:targetType/:targetId/like', authenticate, reactionController.toggleLike);
router.post('/discussions/:discussionId/bookmark', authenticate, reactionController.toggleBookmark);
router.get('/user/bookmarks', authenticate, reactionController.getUserBookmarks);
router.get('/reactions/:targetType/:targetId/status', authenticate, reactionController.getReactionStatus);

// Admin-only routes
router.patch('/discussions/:id/lock', authenticate, discussionController.toggleLockDiscussion);
router.patch('/discussions/:id/pin', authenticate, discussionController.togglePinDiscussion);

// Add the debug route for flat comments
router.get('/discussions/:discussionId/comments/all', commentController.getFlatDiscussionComments);

export default router; 