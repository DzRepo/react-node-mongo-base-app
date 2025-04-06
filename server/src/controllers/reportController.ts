import { Request, Response } from 'express';
import { Report, ReportStatus, ReportType } from '../models/Report';
import mongoose from 'mongoose';

// Create a new report
export const createReport = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { targetType, targetId, reason, description } = req.body;

    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ message: 'Target type, target ID, and reason are required' });
    }

    if (!Object.values(ReportType).includes(targetType)) {
      return res.status(400).json({ message: 'Invalid target type' });
    }

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ message: 'Invalid target ID' });
    }

    const newReport = new Report({
      reporter: req.user._id,
      targetType,
      targetId,
      reason,
      description,
      status: ReportStatus.NEW
    });

    await newReport.save();

    res.status(201).json(newReport);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ message: 'Server error while creating report' });
  }
};

// Get all reports (admin/moderator only)
export const getAllReports = async (req: Request, res: Response) => {
  try {
    // Check if user has admin or moderator role
    const userRoles = req.user?.roles || [];
    if (!userRoles.some(role => role === 'admin' || role === 'moderator')) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as ReportStatus;
    const skip = (page - 1) * limit;

    // Build query based on filters
    const query: any = {};
    if (status) {
      query.status = status;
    }

    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('reporter', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .lean();

    const total = await Report.countDocuments(query);

    res.status(200).json({
      reports,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit
      }
    });
  } catch (error) {
    console.error('Error getting reports:', error);
    res.status(500).json({ message: 'Server error while fetching reports' });
  }
};

// Update report status (admin/moderator only)
export const updateReportStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user?.roles?.some((role: string) => ['admin', 'moderator'].includes(role))) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { id } = req.params;
    const { status, resolution, assignedTo } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid report ID' });
    }

    if (!Object.values(ReportStatus).includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.status = status;
    if (resolution) report.resolution = resolution;
    if (assignedTo) report.assignedTo = assignedTo;

    await report.save();

    res.status(200).json(report);
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ message: 'Server error while updating report' });
  }
};

// Get report statistics (admin/moderator only)
export const getReportStats = async (req: Request, res: Response) => {
  try {
    if (!req.user?.roles?.some((role: string) => ['admin', 'moderator'].includes(role))) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const stats = await Report.aggregate([
      {
        $group: {
          _id: {
            status: '$status',
            targetType: '$targetType'
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Format stats into a more usable structure
    const formattedStats = {
      byStatus: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      byStatusAndType: {} as Record<string, Record<string, number>>
    };

    stats.forEach(stat => {
      const { status, targetType } = stat._id;
      
      // Count by status
      formattedStats.byStatus[status] = (formattedStats.byStatus[status] || 0) + stat.count;
      
      // Count by type
      formattedStats.byType[targetType] = (formattedStats.byType[targetType] || 0) + stat.count;
      
      // Count by status and type
      if (!formattedStats.byStatusAndType[status]) {
        formattedStats.byStatusAndType[status] = {};
      }
      formattedStats.byStatusAndType[status][targetType] = stat.count;
    });

    res.status(200).json(formattedStats);
  } catch (error) {
    console.error('Error getting report stats:', error);
    res.status(500).json({ message: 'Server error while fetching report statistics' });
  }
}; 