import { getAccessToken } from '../auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface NotificationDTO {
  id: string;
  userId: string;
  type: 'MATCH_REPORT' | 'SYSTEM_UPDATE' | 'TEAM_ANNOUNCEMENT';
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  expiresAt: string;
}

export interface GetNotificationsResponse {
  notifications: NotificationDTO[];
  unreadCount: number;
}

/**
 * Get user notifications
 */
export async function getUserNotifications(
  includeRead: boolean = true,
  includeExpired: boolean = false
): Promise<GetNotificationsResponse> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const params = new URLSearchParams();
  if (includeRead !== undefined) {
    params.append('includeRead', includeRead.toString());
  }
  if (includeExpired !== undefined) {
    params.append('includeExpired', includeExpired.toString());
  }

  const response = await fetch(
    `${API_BASE_URL}/notifications?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch notifications' }));
    throw new Error(error.error || 'Failed to fetch notifications');
  }

  return response.json();
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<NotificationDTO> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(
    `${API_BASE_URL}/notifications/${notificationId}/read`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to mark notification as read' }));
    throw new Error(error.error || 'Failed to mark notification as read');
  }

  const data = await response.json();
  return data.notification;
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(
    `${API_BASE_URL}/notifications/${notificationId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to delete notification' }));
    throw new Error(error.error || 'Failed to delete notification');
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(): Promise<number> {
  const data = await getUserNotifications(false, false);
  return data.unreadCount;
}
