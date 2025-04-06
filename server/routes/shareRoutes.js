const express = require('express');
const router = express.Router();
const shareController = require('../controllers/shareController');

// GET /api/share/discussions/:id - Get share info for a discussion
router.get('/discussions/:id', shareController.getDiscussionShareInfo);

// GET /api/share/comments/:id - Get share info for a comment
router.get('/comments/:id', shareController.getCommentShareInfo);

module.exports = router; 