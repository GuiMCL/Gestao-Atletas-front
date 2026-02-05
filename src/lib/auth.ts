'use client';

/**
 * Authentication utility functions for client-side JWT storage and management
 */

const ACCESS_TOKEN_KEY = 'volleyball_access_token';
const REFRESH_TOKEN_KEY = 'volleyball_refresh_token';
const USER_KEY = 'volleyball_user';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'ATHLETE' | 'COACH' | 'ADMIN';
  teamId?: string;
  createdAt?: string;
  isFirstLogin?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Store authentication tokens in localStorage
 */
export const setAuthTokens = (tokens: AuthTokens): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
};

/**
 * Get access token from localStorage
 */
export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Get refresh token from localStorage
 */
export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Store user data in localStorage
 */
export const setUser = (user: User): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * Get user data from localStorage
 */
export const getUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

/**
 * Clear all authentication data from localStorage
 */
export const clearAuth = (): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};

/**
 * Decode JWT token (basic implementation without verification)
 * Note: This is for client-side display only. Server must verify tokens.
 */
export const decodeToken = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};

/**
 * Mark user as no longer on first login
 */
export const markFirstLoginComplete = (): void => {
  if (typeof window === 'undefined') return;
  
  const user = getUser();
  if (user) {
    user.isFirstLogin = false;
    setUser(user);
  }
};
