import React, { useEffect, useState } from 'react';
import reportService, { Report, PaginatedReports } from '../../services/reportService';

const ReportManagement = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<Report['status'] | 'ALL'>('ALL');

  useEffect(() => {
    fetchReports();
  }, [currentPage, selectedStatus]);

  const fetchReports = async () => {
    try {
      const data = await reportService.getAllReports(currentPage, 20, selectedStatus === 'ALL' ? undefined : selectedStatus);
      setReports(data.reports);
      setTotalPages(data.pagination.pages);
      setError(null);
    } catch (err) {
      setError('Failed to fetch reports');
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId: string, status: Report['status'], resolution?: string) => {
    try {
      await reportService.updateReportStatus(reportId, status, resolution);
      await fetchReports(); // Refresh the list
      setError(null);
    } catch (err) {
      setError('Failed to update report status');
      console.error('Error updating report:', err);
    }
  };

  if (loading) return <div>Loading reports...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Content Reports</h2>
        <div className="flex gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value as Report['status'] | 'ALL');
              setCurrentPage(1); // Reset to first page when changing filter
            }}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <option value="ALL">All Statuses</option>
            <option value="new">New</option>
            <option value="in_process">In Process</option>
            <option value="completed">Completed</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      {!reports || reports.length === 0 ? (
        <div className="text-gray-600 dark:text-gray-400">No reports found for the selected status.</div>
      ) : (
        <>
          <div className="grid gap-4">
            {reports.map((report) => (
              <div key={report._id} className="border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Report by {report.reporter.firstName} {report.reporter.lastName} - {report.targetType.toLowerCase()}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                    <p className="mt-2 text-gray-700 dark:text-gray-300">{report.reason}</p>
                    {report.description && (
                      <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{report.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-sm ${
                      report.status === 'new' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                      report.status === 'in_process' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                      report.status === 'completed' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                      'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                </div>
                
                {report.status === 'new' && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => updateReportStatus(report._id, 'in_process')}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                    >
                      Take Action
                    </button>
                    <button
                      onClick={() => updateReportStatus(report._id, 'dismissed', 'No action needed')}
                      className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
                
                {report.status === 'in_process' && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => updateReportStatus(report._id, 'completed', 'Action taken')}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
                    >
                      Mark Complete
                    </button>
                    <button
                      onClick={() => updateReportStatus(report._id, 'dismissed', 'No action needed')}
                      className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex justify-between items-center">
              <button
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="inline-flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReportManagement; 