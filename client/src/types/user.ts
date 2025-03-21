export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
  isEmailVerified: boolean;
  roles: string[];
  permissions: string[];
}

export interface User {
  id: string;
  profile: UserProfile;
}

export interface AuthResponse {
  token: string;
  user: User;
} 