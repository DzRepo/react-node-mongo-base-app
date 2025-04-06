import express from 'express';
import { authenticate } from '../middleware/auth';
import * as reportController from '../controllers/reportController';

const router = express.Router();

// Create a new report
router.post('/', authenticate, reportController.createReport);

// Get all reports (admin/moderator only)
router.get('/', authenticate, reportController.getAllReports);

// Update report status (admin/moderator only)
router.put('/:id/status', authenticate, reportController.updateReportStatus);

// Get report statistics (admin/moderator only)
router.get('/stats', authenticate, reportController.getReportStats);

export default router; 