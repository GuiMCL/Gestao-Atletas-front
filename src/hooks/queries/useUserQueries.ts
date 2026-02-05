/**
 * React Query hooks for user-related API endpoints
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateQueries } from '@/lib/query-client';
import * as userApi from '@/lib/api/user.api';
import { showSuccessToast, showErrorToast } from '@/lib/toast';

/**
 * Query: Get all users
 */
export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users.lists(),
    queryFn: () => userApi.getAllUsers(),
  });
}

/**
 * Query: Get user by ID
 */
export function useUser(userId: string) {
  return useQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: () => userApi.getUserById(userId),
    enabled: !!userId,
  });
}

/**
 * Mutation: Update user role
 */
export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: Parameters<typeof userApi.updateUserRole>[1];
    }) => userApi.updateUserRole(userId, data),
    onSuccess: (_, variables) => {
      // Invalidate user detail and list
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(variables.userId) });
      invalidateQueries.users();

      // Show success toast
      showSuccessToast('User role updated successfully!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update user role.';
      showErrorToast(message);
    },
  });
}

/**
 * Mutation: Assign credentials to athlete
 */
export function useAssignCredentials() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof userApi.assignCredentials>[0]) =>
      userApi.assignCredentials(data),
    onSuccess: () => {
      // Invalidate user and athlete lists
      invalidateQueries.users();
      invalidateQueries.athletes();

      // Show success toast
      showSuccessToast('Credentials assigned successfully!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to assign credentials.';
      showErrorToast(message);
    },
  });
}

/**
 * Mutation: Delete user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => userApi.deleteUser(userId),
    onSuccess: (_, userId) => {
      // Invalidate user detail and list
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) });
      invalidateQueries.users();

      // Show success toast
      showSuccessToast('User deleted successfully.');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete user.';
      showErrorToast(message);
    },
  });
}
