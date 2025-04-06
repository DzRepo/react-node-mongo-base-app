import React, { useEffect, useRef } from 'react';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  confirmButtonClass?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title,
  message,
  confirmText,
  cancelText,
  confirmButtonClass = 'bg-primary-600 hover:bg-primary-700',
  onConfirm,
  onCancel
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Add keydown event to close the modal on escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    
    // Focus trap within modal
    const handleFocusTrap = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleFocusTrap);
    
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    
    // Clean up event listeners
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleFocusTrap);
      document.body.style.overflow = 'auto';
    };
  }, [onCancel]);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden"
        aria-modal="true"
        role="dialog"
        aria-labelledby="modal-title"
      >
        <div className="px-6 py-4 border-b">
          <h3 id="modal-title" className="text-lg font-medium text-gray-900">
            {title}
          </h3>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700">{message}</p>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal; 