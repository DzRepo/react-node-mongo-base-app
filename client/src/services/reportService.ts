import api from '../utils/api';

export interface Report {
  _id: string;
  reporter: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  targetType: 'COMMENT' | 'DISCUSSION' | 'USER';
  targetId: string;
  reason: string;
  description?: string;
  status: 'new' | 'in_process' | 'completed' | 'dismissed';
  assignedTo?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedReports {
  reports: Report[];
  pagination: {
    total: number;
    pages: number;
    currentPage: number;
    perPage: number;
  };
}

const reportService = {
  // Get all reports
  getAllReports: async (page = 1, limit = 20, status?: Report['status']): Promise<PaginatedReports> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    if (status) {
      params.append('status', status);
    }
    const response = await api.get(`/api/reports?${params.toString()}`);
    return response.data;
  },

  // Create a new report
  createReport: async (reportData: Omit<Report, '_id' | 'createdAt' | 'updatedAt' | 'status' | 'assignedTo'>): Promise<Report> => {
    const response = await api.post('/api/reports', reportData);
    return response.data;
  },

  // Update report status
  updateReportStatus: async (reportId: string, status: Report['status'], resolution?: string): Promise<Report> => {
    const response = await api.put(`/api/reports/${reportId}/status`, { status, resolution });
    return response.data;
  },

  // Get report statistics
  getReportStats: async () => {
    const response = await api.get('/api/reports/stats');
    return response.data;
  }
};

export default reportService; 