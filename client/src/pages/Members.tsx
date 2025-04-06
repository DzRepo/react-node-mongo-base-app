import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Members: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Welcome, {user?.firstName} {user?.lastName}!
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            This is your exclusive members area. Here you can access all your member benefits and features.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Discussion Forum Card */}
            <Link 
              to="/discussions" 
              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mb-4">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Discussion Forum</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Join conversations, share ideas, and connect with the community.
              </p>
            </Link>

            {/* Dashboard Card */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mb-4">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Dashboard</h3>
              <p className="text-gray-500 dark:text-gray-400">
                View your account overview and manage your settings.
              </p>
            </div>

            {/* Profile Card */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mb-4">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Profile</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Update your personal information and preferences.
              </p>
            </div>

            {/* Resources Card */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mb-4">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Resources</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Access exclusive member resources and content.
              </p>
            </div>

            {/* Support Card */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mb-4">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Support</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Get help and support from our dedicated team.
              </p>
            </div>

            {/* Activity Card */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mb-4">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Activity</h3>
              <p className="text-gray-500 dark:text-gray-400">
                View your recent activity and history.
              </p>
            </div>

            {/* Notifications Card */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mb-4">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Notifications</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Manage your notification preferences.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Members; 