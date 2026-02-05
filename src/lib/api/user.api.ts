/**
 * User Management API client
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface UserDTO {
  id: string;
  username: string;
  email: string;
  role: 'ATHLETE' | 'COACH' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
  athlete?: {
    id: string;
    name: string;
    position: string;
    jerseyNumber: number;
    teamId: string;
    isActive: boolean;
  };
}

export interface AssignCredentialsRequest {
  athleteId: string;
  username: string;
  email: string;
  password: string;
}

export interface UpdateUserRoleRequest {
  role: 'ATHLETE' | 'COACH' | 'ADMIN';
}

/**
 * Get authentication token from localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('volleyball_access_token');
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers(): Promise<UserDTO[]> {
  const token = getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/api/users`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch users' }));
    throw new Error(error.error || 'Failed to fetch users');
  }

  return response.json();
}

/**
 * Get user by ID (admin only)
 */
export async function getUserById(userId: string): Promise<UserDTO> {
  const token = getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch user' }));
    throw new Error(error.error || 'Failed to fetch user');
  }

  return response.json();
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(
  userId: string,
  data: UpdateUserRoleRequest
): Promise<UserDTO> {
  const token = getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/api/users/${userId}/role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update user role' }));
    throw new Error(error.error || 'Failed to update user role');
  }

  return response.json();
}

/**
 * Assign credentials to an athlete (admin only)
 */
export async function assignCredentials(
  data: AssignCredentialsRequest
): Promise<{ id: string; username: string; email: string; role: string; athleteId: string }> {
  const token = getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/api/users/assign-credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to assign credentials' }));
    throw new Error(error.error || 'Failed to assign credentials');
  }

  return response.json();
}

/**
 * Delete user (admin only)
 */
export async function deleteUser(userId: string): Promise<void> {
  const token = getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to delete user' }));
    throw new Error(error.error || 'Failed to delete user');
  }
}
