const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// POST /api/reports - Create a new report
router.post('/', reportController.createReport);

// GET /api/reports - Get all reports (admin/moderator only)
router.get('/', reportController.getReports);

// GET /api/reports/:id - Get report by ID (admin/moderator only)
router.get('/:id', reportController.getReportById);

// PUT /api/reports/:id - Update report status (admin/moderator only)
router.put('/:id', reportController.updateReport);

module.exports = router; 