/**
 * Axios API client with authentication, token refresh, and error handling
 * 
 * This module provides a configured Axios instance with:
 * - Automatic JWT token injection
 * - Automatic token refresh on 401 errors
 * - Consistent error handling
 * - Request/response interceptors
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import {
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
  clearAuth,
  isTokenExpired,
} from '@/lib/auth';
import { refreshAccessToken } from '@/lib/api/auth.api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Flag to prevent multiple simultaneous token refresh attempts
 */
let isRefreshing = false;

/**
 * Queue of failed requests waiting for token refresh
 */
let failedRequestsQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

/**
 * Process queued requests after token refresh
 */
const processQueue = (error: any = null, token: string | null = null) => {
  failedRequestsQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });

  failedRequestsQueue = [];
};

/**
 * Create and configure Axios instance
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  /**
   * Request interceptor: Inject authentication token
   */
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getAccessToken();

      // Inject token if available and not already present
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  /**
   * Response interceptor: Handle errors and token refresh
   */
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      // Success response - return as is
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      // Handle 401 Unauthorized errors with token refresh
      if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        const refreshToken = getRefreshToken();

        // If no refresh token, clear auth and reject
        if (!refreshToken) {
          clearAuth();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(
            new ApiError('Authentication required', 401, 'UNAUTHORIZED')
          );
        }

        // Check if token is expired before attempting refresh
        const accessToken = getAccessToken();
        if (accessToken && !isTokenExpired(accessToken)) {
          // Token is still valid, this might be a different auth issue
          return Promise.reject(
            new ApiError('Authentication failed', 401, 'UNAUTHORIZED')
          );
        }

        // If already refreshing, queue this request
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedRequestsQueue.push({
              resolve: (token: string) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                resolve(client(originalRequest));
              },
              reject: (err: any) => {
                reject(err);
              },
            });
          });
        }

        // Mark as retrying and start refresh process
        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Attempt to refresh the token
          const response = await refreshAccessToken({ refreshToken });
          const newAccessToken = response.accessToken;

          // Store new token
          setAuthTokens({
            accessToken: newAccessToken,
            refreshToken: refreshToken,
          });

          // Update authorization header
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }

          // Process queued requests
          processQueue(null, newAccessToken);

          // Retry original request
          return client(originalRequest);
        } catch (refreshError) {
          // Refresh failed - clear auth and redirect to login
          processQueue(refreshError, null);
          clearAuth();

          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }

          return Promise.reject(
            new ApiError('Session expired', 401, 'TOKEN_REFRESH_FAILED')
          );
        } finally {
          isRefreshing = false;
        }
      }

      // Handle other error responses
      return Promise.reject(transformError(error));
    }
  );

  return client;
};

/**
 * Transform Axios errors into ApiError instances
 */
const transformError = (error: AxiosError): ApiError => {
  if (error.response) {
    // Server responded with error status
    const data = error.response.data as any;
    const message = data?.message || data?.error || error.message || 'Request failed';
    const statusCode = error.response.status;
    const code = data?.code || `HTTP_${statusCode}`;

    return new ApiError(message, statusCode, code, data);
  } else if (error.request) {
    // Request made but no response received
    return new ApiError(
      'No response from server',
      0,
      'NETWORK_ERROR',
      { originalError: error.message }
    );
  } else {
    // Error setting up the request
    return new ApiError(
      error.message || 'Request setup failed',
      0,
      'REQUEST_ERROR'
    );
  }
};

/**
 * Singleton API client instance
 */
export const apiClient = createApiClient();

/**
 * Helper function to check if an error is an ApiError
 */
export const isApiError = (error: any): error is ApiError => {
  return error instanceof ApiError;
};

/**
 * Helper function to extract error message from any error type
 */
export const getErrorMessage = (error: any): string => {
  if (isApiError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
};
