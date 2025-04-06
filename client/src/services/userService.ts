import api from '../utils/api';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  isEmailVerified: boolean;
  createdAt: string;
}

export interface Role {
  _id: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface PaginatedUsers {
  users: User[];
  pagination: {
    total: number;
    pages: number;
    currentPage: number;
    perPage: number;
  };
}

const userService = {
  // Get all users with pagination
  getAllUsers: async (page = 1, limit = 20): Promise<PaginatedUsers> => {
    const response = await api.get(`/api/users?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get available roles
  getAvailableRoles: async (): Promise<Role[]> => {
    const response = await api.get('/api/users/roles');
    return response.data;
  },

  // Update user roles
  updateUserRoles: async (userId: string, roles: string[]): Promise<User> => {
    const response = await api.put(`/api/users/${userId}/roles`, { roles });
    return response.data;
  }
};

export default userService; 