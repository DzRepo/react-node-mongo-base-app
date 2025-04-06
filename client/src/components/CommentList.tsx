import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FaReply, FaEdit, FaTrash, FaFlag, FaChevronDown, FaThumbsUp, FaRegThumbsUp } from 'react-icons/fa';
import CommentForm from './CommentForm';
import ConfirmModal from './ConfirmModal';
import ReportModal from './ReportModal';
import api from '../utils/api';

interface Author {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles?: string[];
}

interface Comment {
  _id: string;
  content: string;
  author: Author;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  parent?: string | null;
  replies: Comment[];
  hasMoreReplies?: boolean;
  totalReplies?: number;
  likeCount?: number;
  userReactions?: {
    like: boolean;
  };
}

interface CommentListProps {
  comments: Comment[];
  discussionId: string;
  currentUser: Author | null;
  onUpdate: () => void;
}

const CommentList: React.FC<CommentListProps> = ({ comments: initialComments, discussionId, currentUser, onUpdate }) => {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [commentToReport, setCommentToReport] = useState<string | undefined>(undefined);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [loadingMore, setLoadingMore] = useState<Set<string>>(new Set());

  // Update local comments when props change
  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  const handleDelete = async () => {
    if (!commentToDelete) return;

    try {
      await api.delete(`/api/comments/${commentToDelete}`);
      setShowDeleteModal(false);
      setCommentToDelete(null);
      onUpdate();
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  const handleReport = async (reason: string) => {
    if (!commentToReport) return;

    try {
      await api.post(`/api/reports`, {
        contentType: 'comment',
        contentId: commentToReport,
        reason
      });
      setShowReportModal(false);
      setCommentToReport(undefined);
    } catch (err) {
      console.error('Error reporting comment:', err);
    }
  };

  const handleLike = async (commentId: string) => {
    try {
      await api.post(`/api/reactions/Comment/${commentId}/like`);
      onUpdate();
    } catch (err) {
      console.error('Error liking comment:', err);
    }
  };

  const renderComment = (comment: Comment, level: number = 0, parentId: string | null = null, position: number = 0) => {
    const isAuthor = currentUser && currentUser._id === comment.author._id;
    const isAdmin = currentUser?.roles?.includes('admin');
    const canModify = isAuthor || isAdmin;
    const isExpanded = expandedReplies.has(comment._id);
    const isLoadingMore = loadingMore.has(comment._id);
    const hasReplies = (comment.totalReplies || 0) > 0;
    const hasActualReplies = comment.replies && comment.replies.length > 0;
    const isReplying = replyingTo === comment._id;
    const shouldShowReplies = hasActualReplies;
    const isEditing = editingComment === comment._id;
    const isReporting = commentToReport === comment._id;
    const isDeleting = commentToDelete === comment._id;
    const bgShade = level % 2 === 0 ? 'bg-white' : 'bg-gray-100';
    const darkBgShade = level % 2 === 0 ? 'dark:bg-gray-800' : 'dark:bg-gray-700';

    // Generate a unique key that includes all context
    const uniqueKey = `${comment._id}-${parentId || 'root'}-${position}-${level}`;

    return (
      <div key={uniqueKey} className={`${level > 0 ? 'ml-4' : ''} ${bgShade} ${darkBgShade} rounded-lg p-2 mb-0.5`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center">
                <span className="font-medium text-gray-900 dark:text-white">
                  {comment.author.firstName} {comment.author.lastName}
                </span>
                <span className="mx-1 text-gray-400 dark:text-gray-500">•</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
                {comment.isEdited && (
                  <>
                    <span className="mx-1 text-gray-400 dark:text-gray-500">•</span>
                    <span className="text-gray-500 dark:text-gray-400">edited</span>
                  </>
                )}
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleLike(comment._id)}
                  className="p-0.5 text-gray-900 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 flex items-center bg-gray-100 hover:bg-gray-200 dark:bg-transparent rounded"
                  title="Like"
                >
                  {comment.userReactions?.like ? (
                    <FaThumbsUp className="text-primary-600 dark:text-primary-400" />
                  ) : (
                    <FaRegThumbsUp />
                  )}
                  <span className="ml-0.5">{comment.likeCount || 0}</span>
                </button>
                <button
                  onClick={() => setReplyingTo(comment._id)}
                  className="p-0.5 text-gray-900 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 bg-gray-100 hover:bg-gray-200 dark:bg-transparent rounded"
                  title="Reply"
                >
                  <FaReply />
                </button>
                <button
                  onClick={() => {
                    setCommentToReport(comment._id);
                    setShowReportModal(true);
                  }}
                  className="p-0.5 text-gray-900 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 bg-gray-100 hover:bg-gray-200 dark:bg-transparent rounded"
                  title="Report"
                >
                  <FaFlag />
                </button>
                {canModify && (
                  <>
                    <button
                      onClick={() => setEditingComment(comment._id)}
                      className="p-0.5 text-gray-900 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 bg-gray-100 hover:bg-gray-200 dark:bg-transparent rounded"
                      title="Edit comment"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => {
                        setCommentToDelete(comment._id);
                        setShowDeleteModal(true);
                      }}
                      className="p-0.5 text-gray-900 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 bg-gray-100 hover:bg-gray-200 dark:bg-transparent rounded"
                      title="Delete comment"
                    >
                      <FaTrash />
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="text-gray-700 dark:text-gray-200 mt-0.5">
              {comment.content}
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="mt-1">
            <CommentForm
              discussionId={discussionId}
              parentId={comment.parent || undefined}
              onSuccess={() => {
                setEditingComment(null);
                onUpdate();
              }}
              onCancel={() => setEditingComment(null)}
            />
          </div>
        )}

        {isReplying && (
          <div className="mt-1">
            <CommentForm
              discussionId={discussionId}
              parentId={comment._id}
              onSuccess={() => {
                setReplyingTo(null);
                onUpdate();
              }}
              onCancel={() => setReplyingTo(null)}
            />
          </div>
        )}

        {hasReplies && (
          <div className="mt-1">
            {hasActualReplies && (
              <div className="space-y-0.5">
                {comment.replies.map((reply, index) => 
                  renderComment(reply, level + 1, comment._id, index)
                )}
              </div>
            )}
            
            {!isExpanded && hasReplies && level >= 0 && comment.hasMoreReplies && (
              <button
                onClick={() => toggleReplies(comment._id)}
                disabled={isLoadingMore}
                className="flex items-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 disabled:opacity-50 mt-0.5"
              >
                {isLoadingMore ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 dark:border-primary-400 mr-0.5"></div>
                ) : (
                  <span className="text-lg font-bold mr-0.5">+</span>
                )}
                {isLoadingMore 
                  ? 'Loading...' 
                  : `${(comment.totalReplies || 0)} ${(comment.totalReplies || 0) === 1 ? 'reply' : 'replies'}`}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6">
      {comments.map((comment, index) => (
        <div key={`root-${comment._id}-${index}`}>
          {renderComment(comment, 0, null, index)}
        </div>
      ))}

      {showDeleteModal && (
        <ConfirmModal
          title="Delete Comment"
          message="Are you sure you want to delete this comment? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          confirmButtonClass="bg-red-600 hover:bg-red-700"
          onConfirm={handleDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setCommentToDelete(null);
          }}
        />
      )}

      {showReportModal && commentToReport && (
        <ReportModal
          contentType="comment"
          contentId={commentToReport}
          onClose={() => {
            setShowReportModal(false);
            setCommentToReport(undefined);
          }}
          onSuccess={() => {
            setShowReportModal(false);
            setCommentToReport(undefined);
          }}
        />
      )}
    </div>
  );
};

export default CommentList; 