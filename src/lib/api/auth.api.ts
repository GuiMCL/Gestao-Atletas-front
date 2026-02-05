/**
 * Authentication API client
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: 'ATHLETE' | 'COACH' | 'ADMIN';
    createdAt: string;
    isFirstLogin?: boolean;
  };
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

/**
 * Login with username and password
 */
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Login failed' }));
    throw new Error(error.message || 'Invalid credentials');
  }

  return response.json();
};

/**
 * Request password reset
 */
export const forgotPassword = async (data: ForgotPasswordRequest): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Failed to send password reset email');
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (data: ResetPasswordRequest): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Reset failed' }));
    throw new Error(error.message || 'Failed to reset password');
  }
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (
  data: RefreshTokenRequest
): Promise<RefreshTokenResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Refresh failed' }));
    throw new Error(error.message || 'Failed to refresh token');
  }

  return response.json();
};

/**
 * Register a new user (admin only)
 */
export async function registerUser(data: {
  username: string;
  email: string;
  password: string;
  role: 'ATHLETE' | 'COACH' | 'ADMIN';
}): Promise<{ id: string; username: string; email: string; role: string }> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to register user');
  }

  const result = await response.json();
  return result.user;
}

/**
 * Check if user needs to change password on first login
 */
export async function checkPasswordChange(token: string): Promise<{ needsPasswordChange: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/auth/check-password-change`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Check failed' }));
    throw new Error(error.message || 'Failed to check password change requirement');
  }

  return response.json();
}

/**
 * Change password on first login (without validating current password)
 */
export async function changePasswordFirstLogin(
  token: string,
  newPassword: string
): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/auth/change-password-first-login`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ newPassword }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Change failed' }));
    throw new Error(error.message || 'Failed to change password');
  }

  return response.json();
}

/**
 * Change password (with current password validation)
 */
export async function changePassword(
  token: string,
  currentPassword: string,
  newPassword: string
): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Change failed' }));
    throw new Error(error.message || 'Failed to change password');
  }

  return response.json();
}
