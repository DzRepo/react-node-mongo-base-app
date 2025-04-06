import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import api from '../utils/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  profilePicture?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  error: string | null;
  isAuthenticated: boolean;
  refreshToken: () => Promise<boolean>;
  updateUser: (userData: Partial<User>) => void;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const checkAuthStatus = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.log('No token found in local storage');
      setLoading(false);
      return;
    }
    
    try {
      console.log('Checking auth status with token:', token.substring(0, 10) + '...');
      
      const response = await api.get('/api/auth/me');
      console.log('Auth check response:', response.data);
      console.log('User roles from response:', response.data?.roles);
      
      setUser(response.data);
    } catch (err) {
      console.error('Authentication error:', err);
      if (axios.isAxiosError(err)) {
        console.error('Status:', err.response?.status);
        console.error('Response data:', err.response?.data);
        
        if (err.response?.status === 401) {
          console.log('Clearing invalid token due to 401 error');
          localStorage.removeItem('token');
        }
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Run auth check on mount and when token changes
  useEffect(() => {
    console.log('Running auth check...');
    checkAuthStatus();
    
    // We don't need a periodic check anymore - it causes too many re-renders
    // The storage event listener below will handle changes to the token in other tabs
    
    // Add event listener to detect storage changes (like in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        console.log('Token changed in storage, rechecking auth');
        checkAuthStatus();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // No dependencies needed
  
  // Force an immediate auth check when the user changes
  useEffect(() => {
    console.log('Auth state changed, user:', user ? user.firstName : 'null');
  }, [user]);
  
  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const response = await api.post('/api/auth/login', {
        email,
        password
      });
      
      console.log('Login response:', response.data);
      console.log('User roles from login:', response.data.user?.roles);
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };
  
  const register = async (userData: RegisterData) => {
    setError(null);
    try {
      const response = await api.post('/api/auth/register', userData);
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };
  
  // Add a function to refresh the token when it's expired
  const refreshToken = async (): Promise<boolean> => {
    try {
      const response = await api.post('/api/auth/refresh-token');
      const { token } = response.data;
      
      if (token) {
        localStorage.setItem('token', token);
        // Update the user state with fresh data
        const userResponse = await api.get('/api/auth/me');
        setUser(userResponse.data);
        return true;
      }
    } catch (err) {
      console.error('Error refreshing token:', err);
    }
    
    // If refresh fails, clear the token and return false
    localStorage.removeItem('token');
    setUser(null);
    return false;
  };
  
  // Add global axios interceptor to handle auth errors
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;
        
        // If the error is 401 and not from auth endpoints, try to refresh the token
        if (
          error.response?.status === 401 && 
          !originalRequest._retry &&
          !originalRequest.url.includes('/api/auth/')
        ) {
          originalRequest._retry = true;
          
          // Try to refresh the token
          const refreshed = await refreshToken();
          
          if (refreshed && localStorage.getItem('token')) {
            // Update the authorization header
            originalRequest.headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
            return axios(originalRequest);
          }
        }
        
        return Promise.reject(error);
      }
    );
    
    // Clean up the interceptor on unmount
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);
  
  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        error,
        isAuthenticated: !!user,
        refreshToken,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 