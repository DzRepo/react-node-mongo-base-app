const Report = require('../models/Report');
const Discussion = require('../models/Discussion');
const Comment = require('../models/Comment');
const { checkAuth, checkRole } = require('../middleware/auth');

/**
 * Create a new report
 * @route POST /api/reports
 * @access Private
 */
exports.createReport = [
  checkAuth,
  async (req, res) => {
    try {
      const { reason, details, contentType, contentId } = req.body;
      
      // Validate required fields
      if (!reason || !contentType || !contentId) {
        return res.status(400).json({ message: 'Please provide reason, content type, and content ID' });
      }
      
      // Validate content type
      if (!['discussion', 'comment'].includes(contentType)) {
        return res.status(400).json({ message: 'Invalid content type' });
      }
      
      // Verify that the content exists
      let contentExists = false;
      if (contentType === 'discussion') {
        contentExists = await Discussion.exists({ _id: contentId });
      } else if (contentType === 'comment') {
        contentExists = await Comment.exists({ _id: contentId });
      }
      
      if (!contentExists) {
        return res.status(404).json({ message: 'Content not found' });
      }
      
      // Check if the user has already reported this content
      const existingReport = await Report.findOne({
        contentType,
        contentId,
        reportedBy: req.user._id,
        status: { $in: ['pending', 'reviewed'] }
      });
      
      if (existingReport) {
        return res.status(400).json({ message: 'You have already reported this content' });
      }
      
      // Create the report
      const report = new Report({
        reason,
        details: details || '',
        contentType,
        contentId,
        reportedBy: req.user._id
      });
      
      await report.save();
      
      res.status(201).json({
        message: 'Report submitted successfully',
        reportId: report._id
      });
      
    } catch (error) {
      console.error('Error creating report:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
];

/**
 * Get all reports (for admin/moderator)
 * @route GET /api/reports
 * @access Admin, Moderator
 */
exports.getReports = [
  checkAuth,
  checkRole(['admin', 'moderator']),
  async (req, res) => {
    try {
      const { status, contentType, page = 1, limit = 10 } = req.query;
      
      const query = {};
      
      if (status) query.status = status;
      if (contentType) query.contentType = contentType;
      
      const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { createdAt: -1 },
        populate: [
          { path: 'reportedBy', select: 'firstName lastName email' },
          { path: 'reviewedBy', select: 'firstName lastName email' }
        ]
      };
      
      const reports = await Report.paginate(query, options);
      
      res.json(reports);
      
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
];

/**
 * Get a specific report by ID
 * @route GET /api/reports/:id
 * @access Admin, Moderator
 */
exports.getReportById = [
  checkAuth,
  checkRole(['admin', 'moderator']),
  async (req, res) => {
    try {
      const report = await Report.findById(req.params.id)
        .populate('reportedBy', 'firstName lastName email')
        .populate('reviewedBy', 'firstName lastName email');
      
      if (!report) {
        return res.status(404).json({ message: 'Report not found' });
      }
      
      // Populate the content based on content type
      let content;
      if (report.contentType === 'discussion') {
        content = await Discussion.findById(report.contentId)
          .populate('author', 'firstName lastName email');
      } else if (report.contentType === 'comment') {
        content = await Comment.findById(report.contentId)
          .populate('author', 'firstName lastName email');
      }
      
      res.json({
        report,
        content: content || { message: 'Content no longer exists' }
      });
      
    } catch (error) {
      console.error('Error fetching report:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
];

/**
 * Update report status (review, resolve, dismiss)
 * @route PUT /api/reports/:id
 * @access Admin, Moderator
 */
exports.updateReport = [
  checkAuth,
  checkRole(['admin', 'moderator']),
  async (req, res) => {
    try {
      const { status, reviewNotes } = req.body;
      
      if (!status || !['reviewed', 'resolved', 'dismissed'].includes(status)) {
        return res.status(400).json({ message: 'Please provide a valid status' });
      }
      
      const report = await Report.findById(req.params.id);
      
      if (!report) {
        return res.status(404).json({ message: 'Report not found' });
      }
      
      report.status = status;
      report.reviewedBy = req.user._id;
      
      if (reviewNotes) {
        report.reviewNotes = reviewNotes;
      }
      
      await report.save();
      
      res.json({
        message: 'Report updated successfully',
        report
      });
      
    } catch (error) {
      console.error('Error updating report:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
]; 