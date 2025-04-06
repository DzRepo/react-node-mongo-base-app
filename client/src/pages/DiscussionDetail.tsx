import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { FaThumbsUp, FaRegThumbsUp, FaBookmark, FaRegBookmark, FaFlag, FaShare, FaEdit, FaTrash, FaLock, FaUnlock, FaThumbtack, FaReply } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import ShareModal from '../components/ShareModal';
import ConfirmModal from '../components/ConfirmModal';
import ReportModal from '../components/ReportModal';
import CommentForm from '../components/CommentForm';
import CommentList from '../components/CommentList';

interface Author {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Discussion {
  _id: string;
  title: string;
  content: string;
  author: Author;
  tags: string[];
  views: number;
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  isLocked: boolean;
  isPrivate: boolean;
  likeCount: number;
  userReactions: {
    like?: boolean;
    bookmark?: boolean;
  };
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
  hasMoreReplies: boolean;
  totalReplies: number;
}

const DiscussionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [totalComments, setTotalComments] = useState(0);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/discussions/${id}/comments`);
      console.log('COMMENT API RESPONSE:', response.data);
      
      // The response already contains the nested structure
      setComments(response.data.comments);
      setTotalComments(response.data.total);
      setHasMoreComments(response.data.hasMore);
      
      // For debugging
      const flatComments = response.data.comments.reduce((acc: Comment[], comment: Comment) => {
        acc.push(comment);
        if (comment.replies) {
          acc.push(...comment.replies);
        }
        return acc;
      }, []);
      
      console.log('API RETURNED', flatComments.length, 'TOTAL COMMENTS (NESTED + FLAT):');
      console.log('FLAT COMMENT LIST:', flatComments);
      
      // Get deep comments (level 2+)
      const deepComments = flatComments.filter((comment: Comment) => {
        let depth = 0;
        let currentComment = comment;
        while (currentComment.parent) {
          depth++;
          currentComment = flatComments.find((c: Comment) => c._id === currentComment.parent);
        }
        return depth >= 2;
      });
      
      console.log('DEEP COMMENTS (LEVEL 2+):', deepComments.length, deepComments);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  // Fetch comments asynchronously after discussion is loaded
  useEffect(() => {
    fetchComments();
  }, [id]);

  const loadMoreComments = async () => {
    try {
      setLoadingMore(true);
      const response = await api.get(`/api/discussions/${id}/comments?page=${currentPage + 1}`);
      setComments(prev => [...prev, ...response.data.comments]);
      setHasMoreComments(response.data.hasMore);
      setCurrentPage(prev => prev + 1);
    } catch (err) {
      console.error('Error loading more comments:', err);
      setError('Failed to load more comments');
    } finally {
      setLoadingMore(false);
    }
  };

  const buildCommentTree = (flatComments: any[]): Comment[] => {
    const commentMap = new Map<string, Comment>();
    
    // First pass: create comment nodes with empty replies arrays
    flatComments.forEach(comment => {
      commentMap.set(comment._id, {
        ...comment,
        replies: [],
        hasMoreReplies: false,
        totalReplies: 0
      });
    });
    
    // Second pass: build the tree structure
    const rootComments: Comment[] = [];
    
    flatComments.forEach(comment => {
      const commentNode = commentMap.get(comment._id)!;
      if (comment.parent) {
        const parent = commentMap.get(comment.parent);
        if (parent) {
          parent.replies.push(commentNode);
        }
      } else {
        rootComments.push(commentNode);
      }
    });
    
    return rootComments;
  };

  const handleCommentUpdate = async () => {
    try {
      const response = await api.get(`/api/discussions/${id}/comments`);
      if (response.data && response.data.comments) {
        // The API already returns a nested structure, so we can use it directly
        setComments(response.data.comments);
        setTotalComments(response.data.total);
        setHasMoreComments(response.data.hasMore);
      }
    } catch (err) {
      console.error('Error updating comments:', err);
      setError('Failed to update comments');
    }
  };

  const handleCommentAdded = async () => {
    setShowCommentForm(false);
    await handleCommentUpdate();
  };

  // Fetch discussion data
  useEffect(() => {
    const fetchDiscussion = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/discussions/${id}`);
        
        if (response.data && response.data.discussion) {
          setDiscussion(response.data.discussion);
          setIsLiked(!!response.data.discussion.userReactions?.like);
          setIsBookmarked(!!response.data.discussion.userReactions?.bookmark);
        } else {
          setError('Discussion not found');
        }
      } catch (err) {
        console.error('Error fetching discussion:', err);
        setError('Failed to load discussion');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDiscussion();
    }
  }, [id]);

  const handleLike = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/discussions/${id}` } });
      return;
    }

    try {
      const response = await api.post(`/api/reactions/Discussion/${id}/like`);
      setIsLiked(response.data.liked);
      if (discussion) {
        setDiscussion({
          ...discussion,
          likeCount: response.data.likeCount || discussion.likeCount
        });
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/discussions/${id}` } });
      return;
    }

    try {
      const response = await api.post(`/api/discussions/${id}/bookmark`);
      setIsBookmarked(response.data.bookmarked);
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  const handleShare = () => setShowShareModal(true);
  const handleReport = () => user ? setShowReportModal(true) : navigate('/login', { state: { from: `/discussions/${id}` } });

  const handleDeleteDiscussion = async () => {
    try {
      await api.delete(`/api/discussions/${id}`);
      navigate('/discussions');
    } catch (err) {
      console.error('Error deleting discussion:', err);
    }
  };

  const handleToggleLock = async () => {
    try {
      const response = await api.patch(`/api/discussions/${id}/lock`);
      if (discussion) {
        setDiscussion({
          ...discussion,
          isLocked: response.data.isLocked
        });
      }
    } catch (err) {
      console.error('Error toggling lock:', err);
    }
  };

  const handleTogglePin = async () => {
    try {
      const response = await api.patch(`/api/discussions/${id}/pin`);
      if (discussion) {
        setDiscussion({
          ...discussion,
          isPinned: response.data.isPinned
        });
      }
    } catch (err) {
      console.error('Error toggling pin:', err);
    }
  };

  const isAuthor = user && discussion && user.id === discussion.author._id;
  const isAdmin = user && user.roles && user.roles.includes('admin');
  const canModify = isAuthor || isAdmin;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (error || !discussion) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
          {error || 'Discussion not found'}
        </div>
        <Link to="/discussions" className="text-primary-600 hover:underline">
          &larr; Back to discussions
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/discussions" className="text-primary-600 hover:underline dark:text-primary-400 dark:hover:text-primary-300 flex items-center">
          &larr; Back to discussions
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center text-gray-900 dark:text-white">
            {discussion.isPinned && <FaThumbtack className="mr-2 text-yellow-500 dark:text-yellow-400" title="Pinned" />}
            {discussion.isLocked && <span className="mr-2 text-red-500 dark:text-red-400 text-sm border border-red-500 dark:border-red-400 rounded px-2">Locked</span>}
            {discussion.title}
          </h1>

          {canModify && (
            <div className="flex space-x-2">
              <Link
                to={`/discussions/${id}/edit`}
                className="p-2 text-gray-900 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 bg-gray-100 hover:bg-gray-200 dark:bg-transparent rounded"
                title="Edit discussion"
              >
                <FaEdit />
              </Link>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="p-2 text-gray-900 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 bg-gray-100 hover:bg-gray-200 dark:bg-transparent rounded"
                title="Delete discussion"
              >
                <FaTrash />
              </button>
              {isAdmin && (
                <>
                  <button
                    onClick={handleToggleLock}
                    className="p-2 text-gray-900 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 bg-gray-100 hover:bg-gray-200 dark:bg-transparent rounded"
                    title={discussion.isLocked ? "Unlock discussion" : "Lock discussion"}
                  >
                    {discussion.isLocked ? <FaUnlock /> : <FaLock />}
                  </button>
                  <button
                    onClick={handleTogglePin}
                    className="p-2 text-gray-900 hover:text-yellow-500 dark:text-gray-300 dark:hover:text-yellow-400 bg-gray-100 hover:bg-gray-200 dark:bg-transparent rounded"
                    title={discussion.isPinned ? "Unpin discussion" : "Pin discussion"}
                  >
                    <FaThumbtack />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
          <div>
            By {discussion.author.firstName} {discussion.author.lastName}
          </div>
          <div className="mx-2">•</div>
          <div>
            {formatDistanceToNow(new Date(discussion.createdAt), { addSuffix: true })}
          </div>
          <div className="mx-2">•</div>
          <div>
            {discussion.views} views
          </div>
        </div>

        {discussion.tags && discussion.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {discussion.tags.map(tag => (
              <span
                key={tag}
                className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div 
          className="prose max-w-none mt-6 dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: discussion.content }}
        />

        <div className="flex items-center mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLike}
            className={`flex items-center mr-4 px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-transparent ${
              isLiked 
                ? 'text-primary-600 dark:text-primary-400' 
                : 'text-gray-900 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400'
            }`}
            title={isLiked ? "Unlike this discussion" : "Like this discussion"}
          >
            {isLiked ? <FaThumbsUp className="mr-1" /> : <FaRegThumbsUp className="mr-1" />} 
            {discussion.likeCount}
          </button>
          <button
            onClick={handleBookmark}
            className={`flex items-center px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-transparent ${
              isBookmarked 
                ? 'text-primary-600 dark:text-primary-400' 
                : 'text-gray-900 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400'
            }`}
            title={isBookmarked ? "Remove bookmark" : "Bookmark this discussion"}
          >
            {isBookmarked ? <FaBookmark className="mr-1" /> : <FaRegBookmark className="mr-1" />} 
            Bookmark
          </button>
          <button
            onClick={handleShare}
            className="flex items-center mr-4 px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-transparent text-gray-900 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
            title="Share this discussion"
          >
            <FaShare className="mr-1" /> Share
          </button>
          <button
            onClick={handleReport}
            className="flex items-center px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-transparent text-gray-900 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
            title="Report this discussion"
          >
            <FaFlag className="mr-1" /> Report
          </button>
        </div>
      </div>

      {/* Comments Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Comments ({totalComments})
        </h2>
        
        {user && !discussion.isLocked && (
          <div className="mb-6">
            <CommentForm
              discussionId={id || ''}
              onSuccess={handleCommentAdded}
              onCancel={() => setShowCommentForm(false)}
            />
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
          </div>
        ) : error ? (
          <div className="text-red-600 dark:text-red-400">{error}</div>
        ) : (
          <>
            <CommentList
              comments={comments}
              discussionId={id || ''}
              currentUser={user ? {
                _id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                roles: user.roles
              } : null}
              onUpdate={handleCommentUpdate}
            />
            
            {hasMoreComments && (
              <button
                onClick={loadMoreComments}
                disabled={loadingMore}
                className="mt-4 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load More Comments'}
              </button>
            )}
          </>
        )}
      </div>

      {showDeleteModal && (
        <ConfirmModal
          title="Delete Discussion"
          message="Are you sure you want to delete this discussion? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          confirmButtonClass="bg-red-600 hover:bg-red-700"
          onConfirm={handleDeleteDiscussion}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      {showReportModal && (
        <ReportModal
          contentType="discussion"
          contentId={discussion._id}
          onClose={() => setShowReportModal(false)}
          onSuccess={() => setShowReportModal(false)}
        />
      )}

      {showShareModal && (
        <ShareModal
          discussionId={discussion._id}
          title={discussion.title}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
};

export default DiscussionDetail; 