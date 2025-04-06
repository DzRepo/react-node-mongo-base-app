import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';
import { FaUser, FaSignOutAlt } from 'react-icons/fa';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Members from './pages/Members';
import About from './pages/About';
import Unauthorized from './pages/Unauthorized';
import Discussions from './pages/Discussions';
import DiscussionDetail from './pages/DiscussionDetail';
import NewDiscussion from './pages/NewDiscussion';
import Admin from './pages/Admin';
import Profile from './pages/Profile';

// Components
import ProtectedRoute from './components/ProtectedRoute';

const queryClient = new QueryClient();

// Navigation component with auth status
const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  
  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-gray-900 dark:text-white">Logo</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link to="/" className="text-gray-900 dark:text-white hover:text-gray-500 dark:hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium">
                Home
              </Link>
              <Link to="/about" className="text-gray-900 dark:text-white hover:text-gray-500 dark:hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium">
                About
              </Link>
              <Link to="/members" className="text-gray-900 dark:text-white hover:text-gray-500 dark:hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium">
                Members
              </Link>
              <Link to="/discussions" className="text-gray-900 dark:text-white hover:text-gray-500 dark:hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium">
                Discussions
              </Link>
              {user?.roles?.includes('admin') && (
                <Link to="/admin" className="text-gray-900 dark:text-white hover:text-gray-500 dark:hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium">
                  Admin
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center">
            <ThemeToggle />
            {user && (
              <div className="flex items-center space-x-4">
                <Link
                  to="/profile"
                  className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  <FaUser className="inline mr-1" />
                  Profile
                </Link>
                <button
                  onClick={logout}
                  className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                  title="Logout from your account"
                >
                  <FaSignOutAlt className="inline mr-1" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

// Auth refresher component
const AuthRefresher: React.FC = () => {
  const { refreshToken } = useAuth();
  const token = localStorage.getItem('token');
  const { loading } = useAuth();
  
  React.useEffect(() => {
    if (!token || loading) return;

    // Check token expiration every minute
    const interval = setInterval(async () => {
      try {
        // Get the token payload
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        
        // If token expires in less than 5 minutes, refresh it
        if (expirationTime - currentTime < 5 * 60 * 1000) {
          console.log('Token expiring soon, refreshing...');
          await refreshToken();
        }
      } catch (err) {
        console.error('Error checking token expiration:', err);
      }
    }, 60 * 1000); // Check every minute

    return () => clearInterval(interval);
  }, [token, loading, refreshToken]);
  
  return null;
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <AuthRefresher />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
              <Navigation />
              <main className="min-h-[calc(100vh-4rem)]">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/unauthorized" element={<Unauthorized />} />
                  <Route path="/discussions" element={<Discussions />} />
                  <Route path="/discussions/:id" element={<DiscussionDetail />} />
                  
                  {/* Protected Routes */}
                  <Route
                    path="/members"
                    element={
                      <ProtectedRoute>
                        <Members />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/discussions/new"
                    element={
                      <ProtectedRoute>
                        <NewDiscussion />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute requiredRoles={['admin']}>
                        <Admin />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/profile" element={<Profile />} />
                </Routes>
              </main>
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
