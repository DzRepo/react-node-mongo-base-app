import React, { useState, useEffect, ChangeEvent } from 'react';
import userService, { User, Role } from '../services/userService';
import { useAuth } from '../contexts/AuthContext';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string[]>>({});
  const { user: currentUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [currentPage]);

  const loadData = async () => {
    try {
      const [usersData, rolesData] = await Promise.all([
        userService.getAllUsers(currentPage),
        userService.getAvailableRoles()
      ]);

      setUsers(usersData.users);
      setRoles(rolesData);
      setTotalPages(usersData.pagination.pages);

      // Initialize selected roles for each user
      const initialSelectedRoles: Record<string, string[]> = {};
      usersData.users.forEach(user => {
        initialSelectedRoles[user._id] = [...user.roles];
      });
      setSelectedRoles(initialSelectedRoles);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (userId: string, roleName: string, isChecked: boolean) => {
    setSelectedRoles(prev => {
      const currentRoles = [...(prev[userId] || [])];
      if (isChecked && !currentRoles.includes(roleName)) {
        currentRoles.push(roleName);
      } else if (!isChecked) {
        const index = currentRoles.indexOf(roleName);
        if (index > -1) {
          currentRoles.splice(index, 1);
        }
      }
      return { ...prev, [userId]: currentRoles };
    });
  };

  const handleSaveRoles = async (userId: string) => {
    try {
      const newRoles = selectedRoles[userId];
      await userService.updateUserRoles(userId, newRoles);
      setError(null);
      
      // Refresh data to ensure we have the latest state
      loadData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
    }
  };

  const hasRolesChanged = (userId: string) => {
    const user = users.find(u => u._id === userId);
    if (!user) return false;
    
    const originalRoles = user.roles.sort();
    const currentRoles = [...(selectedRoles[userId] || [])].sort();
    
    return JSON.stringify(originalRoles) !== JSON.stringify(currentRoles);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">User Management</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Roles
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {users.map(user => (
              <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {`${user.firstName} ${user.lastName}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-900 dark:text-gray-100">{user.email}</span>
                    {!user.isEmailVerified && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                        Unverified
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {roles.map(role => (
                      <label
                        key={role.name}
                        className="inline-flex items-center"
                        title={role.description}
                      >
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 dark:border-gray-600 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 dark:bg-gray-700"
                          checked={selectedRoles[user._id]?.includes(role.name)}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => 
                            handleRoleChange(user._id, role.name, e.target.checked)
                          }
                          disabled={
                            role.name === 'admin' &&
                            user.roles.includes('admin') &&
                            users.filter(u => u.roles.includes('admin')).length === 1
                          }
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{role.name}</span>
                      </label>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    className={`px-4 py-2 rounded text-sm font-medium ${
                      hasRolesChanged(user._id)
                        ? 'bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600'
                        : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                    }`}
                    onClick={() => handleSaveRoles(user._id)}
                    disabled={!hasRolesChanged(user._id)}
                  >
                    Save Changes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <button
          className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed"
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span className="inline-flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed"
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default UserManagement; 