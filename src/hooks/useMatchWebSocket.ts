'use client';

import { useCallback } from 'react';
import {
  useWebSocket,
  ActionRegisteredEvent,
  SetFinalizedEvent,
  MatchFinalizedEvent,
  LiveStatisticsUpdateEvent,
  WebSocketEventHandlers,
} from './useWebSocket';
import { showInfoToast, showSuccessToast, showErrorToast } from '@/lib/toast';

/**
 * Match-specific WebSocket hook with typed event handlers
 * Provides a simplified interface for match-related real-time updates
 * Validates: Requirements 7.1, 7.2, 7.3
 */
export interface UseMatchWebSocketOptions {
  matchId: string | null;
  onActionRegistered?: (data: ActionRegisteredEvent) => void;
  onSetFinalized?: (data: SetFinalizedEvent) => void;
  onMatchFinalized?: (data: MatchFinalizedEvent) => void;
  onLiveStatisticsUpdate?: (data: LiveStatisticsUpdateEvent) => void;
  onError?: (error: string) => void;
}

export function useMatchWebSocket(options: UseMatchWebSocketOptions) {
  const {
    matchId,
    onActionRegistered,
    onSetFinalized,
    onMatchFinalized,
    onLiveStatisticsUpdate,
    onError,
  } = options;

  // Wrap handlers to add error handling and toast notifications
  const handlers: WebSocketEventHandlers = {
    onActionRegistered: useCallback(
      (data: ActionRegisteredEvent) => {
        try {
          onActionRegistered?.(data);
          // Show info toast for action registration
          showInfoToast('Action registered successfully');
        } catch (error) {
          console.error('Error handling action_registered event:', error);
          const errorMsg = 'Failed to process action update';
          onError?.(errorMsg);
          showErrorToast(errorMsg);
        }
      },
      [onActionRegistered, onError]
    ),
    onSetFinalized: useCallback(
      (data: SetFinalizedEvent) => {
        try {
          onSetFinalized?.(data);
          // Show success toast for set finalization
          showSuccessToast('Set finalized! Statistics have been calculated.');
        } catch (error) {
          console.error('Error handling set_finalized event:', error);
          const errorMsg = 'Failed to process set finalization';
          onError?.(errorMsg);
          showErrorToast(errorMsg);
        }
      },
      [onSetFinalized, onError]
    ),
    onMatchFinalized: useCallback(
      (data: MatchFinalizedEvent) => {
        try {
          onMatchFinalized?.(data);
          // Show success toast for match finalization
          // Validates: Requirements 10.1
          showSuccessToast('Match finalized! All athletes have been notified.');
        } catch (error) {
          console.error('Error handling match_finalized event:', error);
          const errorMsg = 'Failed to process match finalization';
          onError?.(errorMsg);
          showErrorToast(errorMsg);
        }
      },
      [onMatchFinalized, onError]
    ),
    onLiveStatisticsUpdate: useCallback(
      (data: LiveStatisticsUpdateEvent) => {
        try {
          onLiveStatisticsUpdate?.(data);
        } catch (error) {
          console.error('Error handling live_statistics_update event:', error);
          const errorMsg = 'Failed to process statistics update';
          onError?.(errorMsg);
          showErrorToast(errorMsg);
        }
      },
      [onLiveStatisticsUpdate, onError]
    ),
  };

  const websocket = useWebSocket(matchId, handlers);

  // Notify about connection errors
  if (websocket.error && onError) {
    onError(websocket.error);
  }

  return {
    isConnected: websocket.isConnected,
    isConnecting: websocket.isConnecting,
    error: websocket.error,
    reconnectAttempt: websocket.reconnectAttempt,
    reconnect: websocket.reconnect,
  };
}
