import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

interface CommentFormProps {
  discussionId: string;
  parentId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const CommentForm: React.FC<CommentFormProps> = ({ discussionId, parentId, onSuccess, onCancel }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus the textarea when the component mounts or when parentId changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [parentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const commentData: any = {
        content: content.trim(),
        discussionId
      };

      // Only add parentId if it's provided
      if (parentId) {
        commentData.parentId = parentId;
      }

      await api.post('/api/comments', commentData);

      setContent('');
      onSuccess();
    } catch (err) {
      console.error('Error posting comment:', err);
      setError('Failed to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
        <p className="text-gray-600 dark:text-gray-300">
          Please <a href="/login" className="text-primary-600 hover:underline dark:text-primary-400">login</a> to comment.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your comment..."
        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-gray-900 bg-white"
        rows={3}
        disabled={isSubmitting}
      />
      {error && (
        <div className="mt-2 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      <div className="flex justify-end mt-3 space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          disabled={isSubmitting || !content.trim()}
        >
          {isSubmitting ? 'Posting...' : 'Post Comment'}
        </button>
      </div>
    </form>
  );
};

export default CommentForm; 