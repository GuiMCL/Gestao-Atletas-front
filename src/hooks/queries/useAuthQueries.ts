/**
 * React Query hooks for authentication-related API endpoints
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import * as authApi from '@/lib/api/auth.api';
import { setAuthTokens, clearAuth } from '@/lib/auth';
import { showSuccessToast, showErrorToast } from '@/lib/toast';

/**
 * Mutation: Login
 * Validates: Requirements 1.2
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: Parameters<typeof authApi.login>[0]) =>
      authApi.login(credentials),
    onSuccess: (data) => {
      // Store tokens
      setAuthTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });

      // Cache user data
      queryClient.setQueryData(queryKeys.auth.user(), data.user);

      // Show success toast
      showSuccessToast('Successfully logged in!');
    },
    onError: (error: any) => {
      // Show error toast for invalid credentials
      const message = error?.response?.data?.message || 'Invalid credentials. Please try again.';
      showErrorToast(message);
    },
  });
}

/**
 * Mutation: Logout
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Clear auth tokens
      clearAuth();
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();

      // Show success toast
      showSuccessToast('Successfully logged out');
    },
    onError: () => {
      showErrorToast('Failed to logout. Please try again.');
    },
  });
}

/**
 * Mutation: Forgot password
 */
export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: Parameters<typeof authApi.forgotPassword>[0]) =>
      authApi.forgotPassword(data),
    onSuccess: () => {
      showSuccessToast('Password reset email sent. Please check your inbox.');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to send password reset email.';
      showErrorToast(message);
    },
  });
}

/**
 * Mutation: Reset password
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: (data: Parameters<typeof authApi.resetPassword>[0]) =>
      authApi.resetPassword(data),
    onSuccess: () => {
      showSuccessToast('Password successfully reset. You can now log in with your new password.');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to reset password. The link may have expired.';
      showErrorToast(message);
    },
  });
}

/**
 * Mutation: Register user
 */
export function useRegisterUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof authApi.registerUser>[0]) =>
      authApi.registerUser(data),
    onSuccess: () => {
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });

      // Show success toast
      showSuccessToast('User successfully registered!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to register user.';
      showErrorToast(message);
    },
  });
}
