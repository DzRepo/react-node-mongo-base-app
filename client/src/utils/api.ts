import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import type { UserProfile, AuthResponse } from '../types/user';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`API Request to ${config.url} - Auth token set: ${token.substring(0, 10)}...`);
    } else {
      console.log(`API Request to ${config.url} - No auth token available`);
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // If it's an auth response with a token, log it
    if (response.config.url?.includes('/api/auth/') && response.data?.token) {
      console.log('Auth response received with token, setting token');
      localStorage.setItem('token', response.data.token);
    }
    
    // Log all comment API responses for debugging
    if (response.config.url?.includes('/api/discussions/') && 
        response.config.url?.includes('/comments')) {
      console.log('COMMENT API RESPONSE:', response.data);
      
      // Try to log deep nested comments
      try {
        const hasComments = response.data && response.data.comments;
        if (hasComments) {
          const extractAllComments = (comments: any[], level = 0): any[] => {
            let result: any[] = [];
            comments.forEach(comment => {
              // Add level info for debugging
              comment._debugLevel = level;
              result.push(comment);
              if (comment.replies && Array.isArray(comment.replies) && comment.replies.length > 0) {
                result = result.concat(extractAllComments(comment.replies, level + 1));
              }
            });
            return result;
          };
          
          const allExtracted = extractAllComments(response.data.comments);
          console.log(`API RETURNED ${allExtracted.length} TOTAL COMMENTS (NESTED + FLAT):`);
          console.log('FLAT COMMENT LIST:', allExtracted.map(c => ({
            id: c._id,
            level: c._debugLevel,
            parent: c.parent,
            hasReplies: (c.replies && c.replies.length > 0)
          })));
          
          // Check if we have level 3+
          const deepComments = allExtracted.filter(c => c._debugLevel >= 2);
          console.log(`DEEP COMMENTS (LEVEL 2+): ${deepComments.length}`, deepComments);
        }
      } catch (err) {
        console.error('Error extracting comments for debugging:', err);
      }
    }
    
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && originalRequest) {
      console.error('401 Unauthorized error:', originalRequest.url);
      
      // Don't redirect for auth endpoints to prevent redirect loops
      if (!originalRequest.url?.includes('/api/auth/')) {
        console.log('Not an auth endpoint, removing token and redirecting');
        // Clear token and redirect to login
        localStorage.removeItem('token');
        // Store the current location to redirect back after login
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Handle other errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error:', error.response.data);
      return Promise.reject(error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Network Error:', error.request);
      return Promise.reject({ message: 'Network error occurred' });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error:', error.message);
      return Promise.reject({ message: error.message });
    }
  }
);

// API endpoints
export const authAPI = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/api/auth/login', { email, password }),
  register: (email: string, password: string, firstName: string, lastName: string) =>
    api.post<AuthResponse>('/api/auth/register', { email, password, firstName, lastName }),
  forgotPassword: (email: string) =>
    api.post('/api/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/api/auth/reset-password', { token, password }),
  verifyEmail: (token: string) =>
    api.post('/api/auth/verify-email', { token }),
  refreshToken: () =>
    api.post<{ token: string }>('/api/auth/refresh-token'),
  logout: () =>
    api.post('/api/auth/logout'),
};

export const userAPI = {
  getProfile: () =>
    api.get<UserProfile>('/users/profile'),
  updateProfile: (data: Partial<UserProfile>) =>
    api.put<UserProfile>('/users/profile', data),
  updatePassword: (currentPassword: string, newPassword: string) =>
    api.put('/users/password', { currentPassword, newPassword }),
};

// New function to directly get all flat comments for a discussion ID
export const getAllFlatCommentsForDiscussion = async (discussionId: string) => {
  try {
    const response = await api.get(`/api/discussions/${discussionId}/comments/all`);
    return response.data;
  } catch (error) {
    console.error('Error fetching flat comments:', error);
    throw error;
  }
};

// Create a type for our extended API
interface ExtendedAPI {
  getDiscussion: (id: string) => Promise<any>;
}

// Create the extended API object
const extendedApi: typeof api & ExtendedAPI = Object.assign(api, {
  getDiscussion: (id: string) => api.get(`/api/discussions/${id}`).then(res => res.data)
});

// Export the extended api instance
export default extendedApi; 