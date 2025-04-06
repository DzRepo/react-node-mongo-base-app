import React, { useState, useRef, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { AxiosError } from 'axios';

interface ReportModalProps {
  contentId: string;
  contentType: 'discussion' | 'comment';
  onClose: () => void;
  onSuccess?: () => void;
}

const REPORT_REASONS = [
  'Spam',
  'Harassment',
  'Hate speech',
  'Misinformation',
  'Inappropriate content',
  'Copyright violation',
  'Other'
];

const ReportModal: React.FC<ReportModalProps> = ({ 
  contentId, 
  contentType, 
  onClose,
  onSuccess 
}) => {
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [otherReason, setOtherReason] = useState<string>('');
  const [additionalDetails, setAdditionalDetails] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Focus the first input when the modal opens
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
    
    // Add keydown event to close the modal on escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    // Create focus trap
    const handleFocusTrap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return;
      
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };
    
    document.addEventListener('keydown', handleFocusTrap);
    
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    
    // Clean up
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleFocusTrap);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to submit a report.');
      return;
    }
    
    if (!selectedReason) {
      setError('Please select a reason for reporting.');
      return;
    }
    
    if (selectedReason === 'Other' && !otherReason) {
      setError('Please provide a reason for reporting.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const payload = {
        reason: selectedReason === 'Other' ? otherReason : selectedReason,
        details: additionalDetails,
        contentType,
        contentId
      };
      
      await api.post('/api/reports', payload);
      
      setSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
      
      // Close after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (err) {
      console.error('Error submitting report:', err);
      if (err instanceof AxiosError && err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError('Failed to submit report. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden"
      >
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Report Content</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            &times;
          </button>
        </div>
        
        {success ? (
          <div className="p-6">
            <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
              Thank you for your report. We will review it shortly.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="p-6">
              {error && (
                <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Why are you reporting this content?
                </label>
                <div className="space-y-2">
                  {REPORT_REASONS.map((reason) => (
                    <div key={reason} className="flex items-center">
                      <input
                        type="radio"
                        id={`reason-${reason}`}
                        name="report-reason"
                        value={reason}
                        checked={selectedReason === reason}
                        onChange={() => setSelectedReason(reason)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                        ref={reason === REPORT_REASONS[0] ? firstInputRef : undefined}
                      />
                      <label htmlFor={`reason-${reason}`} className="ml-2 block text-sm text-gray-700">
                        {reason}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedReason === 'Other' && (
                <div className="mb-4">
                  <label htmlFor="other-reason" className="block text-sm font-medium text-gray-700 mb-1">
                    Please specify
                  </label>
                  <input
                    type="text"
                    id="other-reason"
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              )}
              
              <div className="mb-4">
                <label htmlFor="additional-details" className="block text-sm font-medium text-gray-700 mb-1">
                  Additional details (optional)
                </label>
                <textarea
                  id="additional-details"
                  value={additionalDetails}
                  onChange={(e) => setAdditionalDetails(e.target.value)}
                  rows={3}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Provide any additional context that might help in reviewing this report."
                ></textarea>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportModal; 