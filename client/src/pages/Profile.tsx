import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { FaUser, FaLock, FaGlobe, FaCamera, FaSave, FaTimes } from 'react-icons/fa';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
  interests: string[];
  profilePicture?: string;
  socialLinks: {
    website?: string;
    github?: string;
    twitter?: string;
    linkedin?: string;
  };
  themePreference: 'light' | 'dark' | 'system';
}

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    bio: '',
    interests: [],
    socialLinks: {},
    themePreference: 'system'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/api/users/profile');
        setProfileData(response.data);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSocialLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [name]: value }
    }));
  };

  const handleInterestsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const interests = e.target.value.split(',').map(interest => interest.trim());
    setProfileData(prev => ({ ...prev, interests }));
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setProfileData(prev => ({ ...prev, themePreference: e.target.value as 'light' | 'dark' | 'system' }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.put('/api/users/profile', profileData);
      setProfileData(response.data);
      updateUser(response.data);
      setSuccess('Profile updated successfully');
      setError(null);
      setFieldErrors({});
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err.errors);
      if (err.errors) {
        console.log("Field Errors:", err.errors);
        setFieldErrors(err.errors);
        setError('Please fix the errors below');
      } else {
        setError(err.response?.data?.message || 'Failed to update profile');
        setFieldErrors({});
      }
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      await api.put('/api/users/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setSuccess('Password updated successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating password:', err);
      setError('Failed to update password');
    }
  };

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      const response = await api.put('/api/users/profile/picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('Profile picture response:', response.data);
      const newProfilePicture = response.data.profilePicture;
      console.log('Setting new profile picture URL:', newProfilePicture);
      setProfileData(prev => ({ ...prev, profilePicture: newProfilePicture }));
      updateUser({ ...user, profilePicture: newProfilePicture });
      setSuccess('Profile picture updated successfully');
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating profile picture:', err);
      setError('Failed to update profile picture');
    }
  };

  // Add logging for the current profile picture URL
  console.log('Current profile picture URL:', profileData.profilePicture);
  console.log('API base URL:', api.defaults.baseURL);
  
  // Construct the image URL
  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return null;
    // If the path is already a full URL, return it
    if (path.startsWith('http')) return path;
    // Otherwise, prepend the API base URL
    return `${api.defaults.baseURL}${path}`;
  };

  const imageUrl = getImageUrl(profileData.profilePicture);
  console.log('Image URL:', imageUrl);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 dark:border-primary-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Profile Settings</h1>

        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-6">
            <div className="flex justify-between items-start">
              <div>{error}</div>
              <button
                onClick={() => setError(null)}
                className="text-red-700 dark:text-red-200 hover:text-red-900 dark:hover:text-red-100 ml-4"
              >
                <FaTimes />
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-200 px-4 py-3 rounded mb-6">
            {success}
            <button
              onClick={() => setSuccess(null)}
              className="float-right text-green-700 dark:text-green-200 hover:text-green-900 dark:hover:text-green-100"
            >
              <FaTimes />
            </button>
          </div>
        )}

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'profile'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <FaUser className="inline mr-2" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'password'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <FaLock className="inline mr-2" />
            Password
          </button>
        </div>

        {activeTab === 'profile' ? (
          <form onSubmit={handleProfileSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Profile Picture
              </label>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover"
                      onError={(e) => {
                        const img = e.currentTarget;
                        console.error('Error loading profile picture:', {
                          attemptedUrl: img.src,
                          profilePicture: profileData.profilePicture,
                          apiBaseUrl: api.defaults.baseURL
                        });
                        // Remove the image and show the placeholder div instead
                        img.style.display = 'none';
                        const placeholder = document.createElement('div');
                        placeholder.className = 'w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center';
                        placeholder.innerHTML = '<span class="text-gray-500 dark:text-gray-400">No Image</span>';
                        img.parentNode?.insertBefore(placeholder, img);
                        img.parentNode?.removeChild(img);
                      }}
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-gray-500 dark:text-gray-400">No Image</span>
                    </div>
                  )}
                  <label
                    htmlFor="profilePicture"
                    className="absolute bottom-0 right-0 bg-primary-600 text-white p-1 rounded-full cursor-pointer hover:bg-primary-700"
                  >
                    <FaCamera />
                  </label>
                  <input
                    type="file"
                    id="profilePicture"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click the camera icon to change your profile picture
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  First Name {fieldErrors.firstName && (
                    <span className="text-red-500 dark:text-red-400 ml-2">{fieldErrors.firstName}</span>
                  )}
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={profileData.firstName}
                  onChange={handleProfileChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    fieldErrors.firstName ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Last Name {fieldErrors.lastName && (
                    <span className="text-red-500 dark:text-red-400 ml-2">{fieldErrors.lastName}</span>
                  )}
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={profileData.lastName}
                  onChange={handleProfileChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    fieldErrors.lastName ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={profileData.email}
                onChange={handleProfileChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="mt-4">
              <label htmlFor="bio" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={profileData.bio}
                onChange={handleProfileChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div className="mt-4">
              <label htmlFor="interests" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                Interests (comma-separated)
              </label>
              <input
                type="text"
                id="interests"
                value={profileData.interests.join(', ')}
                onChange={handleInterestsChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="e.g. programming, photography, hiking"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                Social Links
              </label>
              <div className="space-y-2">
                <input
                  type="url"
                  name="website"
                  value={profileData.socialLinks.website || ''}
                  onChange={handleSocialLinkChange}
                  placeholder="Website"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <input
                  type="url"
                  name="github"
                  value={profileData.socialLinks.github || ''}
                  onChange={handleSocialLinkChange}
                  placeholder="GitHub"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <input
                  type="url"
                  name="twitter"
                  value={profileData.socialLinks.twitter || ''}
                  onChange={handleSocialLinkChange}
                  placeholder="Twitter"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <input
                  type="url"
                  name="linkedin"
                  value={profileData.socialLinks.linkedin || ''}
                  onChange={handleSocialLinkChange}
                  placeholder="LinkedIn"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="themePreference" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                Theme Preference
              </label>
              <select
                id="themePreference"
                value={profileData.themePreference}
                onChange={handleThemeChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-md hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors duration-200"
              >
                <FaSave className="inline mr-2" />
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-md hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors duration-200"
              >
                <FaSave className="inline mr-2" />
                Change Password
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile; 