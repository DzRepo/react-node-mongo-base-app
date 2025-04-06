import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaFacebook, FaTwitter, FaLinkedin, FaEnvelope, FaLink, FaExclamationCircle } from 'react-icons/fa';

interface ShareModalProps {
  discussionId: string;
  title: string;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ discussionId, title, onClose }) => {
  const [shareUrl, setShareUrl] = useState('');
  const [shareText, setShareText] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Get share data from the API
    const fetchShareData = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/share/discussions/${discussionId}`);
        setShareUrl(response.data.url);
        setShareText(response.data.text);
      } catch (err) {
        console.error('Error fetching share data:', err);
        setError('Failed to load sharing information.');
      }
    };
    
    fetchShareData();
    
    // Add keydown event to close the modal on escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    
    // Clean up
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [discussionId, onClose]);
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {
        setError('Failed to copy link. Please try again.');
      }
    );
  };
  
  const handleShareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };
  
  const handleShareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };
  
  const handleShareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
  };
  
  const handleShareEmail = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Share This Discussion</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            &times;
          </button>
        </div>
        
        <div className="p-6">
          {error ? (
            <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
              <FaExclamationCircle className="mr-2" />
              {error}
            </div>
          ) : (
            <>
              <div className="mb-6">
                <label htmlFor="share-url" className="block text-sm font-medium text-gray-700 mb-1">
                  Share Link
                </label>
                <div className="flex">
                  <input
                    type="text"
                    id="share-url"
                    value={shareUrl}
                    readOnly
                    className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              
              <div>
                <span className="block text-sm font-medium text-gray-700 mb-2">
                  Share on Social Media
                </span>
                <div className="flex space-x-4">
                  <button
                    onClick={handleShareFacebook}
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                    title="Share on Facebook"
                  >
                    <FaFacebook size={20} />
                  </button>
                  <button
                    onClick={handleShareTwitter}
                    className="p-2 bg-sky-500 text-white rounded-full hover:bg-sky-600"
                    title="Share on Twitter"
                  >
                    <FaTwitter size={20} />
                  </button>
                  <button
                    onClick={handleShareLinkedIn}
                    className="p-2 bg-blue-700 text-white rounded-full hover:bg-blue-800"
                    title="Share on LinkedIn"
                  >
                    <FaLinkedin size={20} />
                  </button>
                  <button
                    onClick={handleShareEmail}
                    className="p-2 bg-gray-600 text-white rounded-full hover:bg-gray-700"
                    title="Share via Email"
                  >
                    <FaEnvelope size={20} />
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="p-2 bg-gray-500 text-white rounded-full hover:bg-gray-600"
                    title="Copy Link"
                  >
                    <FaLink size={20} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="px-6 py-4 bg-gray-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal; 