/**
 * React Query hooks for notification-related API endpoints
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateQueries } from '@/lib/query-client';
import * as notificationApi from '@/lib/api/notification.api';
import { showSuccessToast, showErrorToast } from '@/lib/toast';

/**
 * Query: Get user notifications
 */
export function useNotifications(
  includeRead: boolean = true,
  includeExpired: boolean = false
) {
  return useQuery({
    queryKey: queryKeys.notifications.list({ includeRead, includeExpired }),
    queryFn: () => notificationApi.getUserNotifications(includeRead, includeExpired),
    // Refetch notifications periodically
    refetchInterval: 30000, // 30 seconds
  });
}

/**
 * Query: Get unread notification count
 */
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: [...queryKeys.notifications.all, 'unread-count'],
    queryFn: () => notificationApi.getUnreadNotificationCount(),
    // Refetch count frequently
    refetchInterval: 15000, // 15 seconds
  });
}

/**
 * Mutation: Mark notification as read
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationApi.markNotificationAsRead(notificationId),
    onMutate: async (notificationId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });

      // Snapshot previous value
      const previousNotifications = queryClient.getQueryData(
        queryKeys.notifications.lists()
      );

      // Optimistically update notification
      queryClient.setQueriesData(
        { queryKey: queryKeys.notifications.all },
        (old: any) => {
          if (!old?.notifications) return old;
          return {
            ...old,
            notifications: old.notifications.map((n: any) =>
              n.id === notificationId ? { ...n, isRead: true } : n
            ),
            unreadCount: Math.max(0, (old.unreadCount || 0) - 1),
          };
        }
      );

      return { previousNotifications };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          queryKeys.notifications.lists(),
          context.previousNotifications
        );
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      invalidateQueries.notifications();
    },
  });
}

/**
 * Mutation: Delete notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationApi.deleteNotification(notificationId),
    onMutate: async (notificationId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });

      // Snapshot previous value
      const previousNotifications = queryClient.getQueryData(
        queryKeys.notifications.lists()
      );

      // Optimistically remove notification
      queryClient.setQueriesData(
        { queryKey: queryKeys.notifications.all },
        (old: any) => {
          if (!old?.notifications) return old;
          const notification = old.notifications.find((n: any) => n.id === notificationId);
          return {
            ...old,
            notifications: old.notifications.filter((n: any) => n.id !== notificationId),
            unreadCount: notification?.isRead
              ? old.unreadCount
              : Math.max(0, (old.unreadCount || 0) - 1),
          };
        }
      );

      return { previousNotifications };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          queryKeys.notifications.lists(),
          context.previousNotifications
        );
      }

      // Show error toast
      const message = (err as any)?.response?.data?.message || 'Failed to delete notification.';
      showErrorToast(message);
    },
    onSuccess: () => {
      // Show success toast
      showSuccessToast('Notification deleted.');
    },
    onSettled: () => {
      // Refetch to ensure consistency
      invalidateQueries.notifications();
    },
  });
}
