import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { FaPlus, FaComment, FaThumbsUp, FaEye, FaTag, FaBookmark, FaThumbtack } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

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
  likesCount: number;
  commentsCount: number;
}

interface Pagination {
  totalDocs: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const Discussions: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    totalDocs: 0,
    totalPages: 0,
    currentPage: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  // Extract unique tags from all discussions
  const allTags = [...new Set(discussions.flatMap(d => d.tags))];
  
  const fetchDiscussions = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      let url = `/api/discussions?page=${page}`;
      if (selectedTag) {
        url += `&tag=${selectedTag}`;
      }
      
      console.log('Fetching discussions from:', url);
      const response = await api.get(url);
      console.log('Discussions API response:', response.data);
      
      if (!response.data || !response.data.discussions) {
        console.error('Unexpected API response format:', response.data);
        setError('Received invalid data format from the server.');
        setDiscussions([]);
        return;
      }
      
      // Ensure discussions is always an array
      setDiscussions(response.data.discussions);
      setPagination(response.data.pagination || {
        totalDocs: 0,
        totalPages: 0,
        currentPage: 1,
        hasNext: false,
        hasPrev: false,
      });
    } catch (err: any) {
      console.error('Error fetching discussions:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load discussions. Please try again later.';
      setError(errorMessage);
      setDiscussions([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchDiscussions();
  }, [selectedTag]);
  
  const handlePageChange = (page: number) => {
    fetchDiscussions(page);
  };
  
  const handleTagFilter = (tag: string) => {
    if (selectedTag === tag) {
      setSelectedTag(null);
    } else {
      setSelectedTag(tag);
    }
  };
  
  const renderPagination = () => {
    const { totalPages, currentPage, hasNext, hasPrev } = pagination;
    
    return (
      <div className="flex justify-center mt-8">
        <div className="flex space-x-1">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!hasPrev}
            className={`px-3 py-1 rounded ${
              !hasPrev 
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                : 'bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600'
            }`}
          >
            Previous
          </button>
          
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => handlePageChange(index + 1)}
              className={`px-3 py-1 rounded ${
                currentPage === index + 1 
                  ? 'bg-primary-600 text-white dark:bg-primary-500' 
                  : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              {index + 1}
            </button>
          ))}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!hasNext}
            className={`px-3 py-1 rounded ${
              !hasNext 
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                : 'bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Community Discussions</h1>
        {user && (
          <button
            onClick={() => navigate('/discussions/new')}
            className="bg-primary-600 text-white px-4 py-2 rounded flex items-center hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
          >
            <FaPlus className="mr-2" /> New Discussion
          </button>
        )}
      </div>
      
      {/* Tags filter */}
      {allTags.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm uppercase text-gray-500 dark:text-gray-400 mb-2">Filter by tag:</h3>
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagFilter(tag)}
                className={`px-3 py-1 text-sm rounded-full ${
                  selectedTag === tag 
                    ? 'bg-primary-600 text-white dark:bg-primary-500' 
                    : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 dark:border-primary-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded mb-6">{error}</div>
      ) : discussions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <h3 className="text-xl font-medium text-gray-700 dark:text-gray-200 mb-4">No discussions found</h3>
          
          {selectedTag ? (
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No discussions with tag "{selectedTag}". Try selecting a different tag or viewing all discussions.
            </p>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              There are no discussions yet. Be the first to start a conversation!
            </p>
          )}
          
          {selectedTag && (
            <button
              onClick={() => setSelectedTag(null)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 mr-4"
            >
              Clear filter
            </button>
          )}
          
          {user && (
            <button
              onClick={() => navigate('/discussions/new')}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
            >
              <FaPlus className="inline mr-2" />
              Start a new discussion
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {discussions.map((discussion, index) => (
            <div 
              key={discussion._id}
              className={`p-6 ${index < discussions.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''} ${
                discussion.isPinned ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
              }`}
            >
              <div className="flex items-start">
                {/* Vote count */}
                <div className="flex flex-col items-center mr-4">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2 text-center">
                    <div className="text-xl font-bold text-primary-600 dark:text-primary-400">{discussion.likesCount}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">likes</div>
                  </div>
                </div>
                
                {/* Main content */}
                <div className="flex-1">
                  <Link to={`/discussions/${discussion._id}`} className="block">
                    <h2 className="text-xl font-semibold hover:text-primary-600 dark:text-white dark:hover:text-primary-400 flex items-center">
                      {discussion.isPinned && <FaThumbtack className="mr-2 text-yellow-500 dark:text-yellow-400" title="Pinned" />}
                      {discussion.isLocked && <span className="mr-2 text-red-500 dark:text-red-400 text-sm border border-red-500 dark:border-red-400 rounded px-2">Locked</span>}
                      {discussion.title}
                    </h2>
                  </Link>
                  
                  <div className="mt-2 text-gray-600 dark:text-gray-300 line-clamp-2">
                    {discussion.content.replace(/<[^>]*>?/gm, '')}
                  </div>
                  
                  {/* Tags */}
                  {discussion.tags && discussion.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {discussion.tags.map((tag) => (
                        <span 
                          key={tag} 
                          className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded"
                        >
                          <FaTag className="inline mr-1" size={10} />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Meta information */}
                  <div className="mt-4 flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-4">
                    <span>
                      By {discussion.author.firstName} {discussion.author.lastName}
                    </span>
                    <span>
                      {formatDistanceToNow(new Date(discussion.createdAt), { addSuffix: true })}
                    </span>
                    <span className="flex items-center">
                      <FaComment className="mr-1" /> {discussion.commentsCount} comments
                    </span>
                    <span className="flex items-center">
                      <FaThumbsUp className="mr-1" /> {discussion.likesCount} likes
                    </span>
                    <span className="flex items-center">
                      <FaEye className="mr-1" /> {discussion.views} views
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!loading && discussions.length > 0 && pagination.totalPages > 1 && renderPagination()}
    </div>
  );
};

export default Discussions; 