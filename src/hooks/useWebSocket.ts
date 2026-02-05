'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAccessToken, isTokenExpired } from '@/lib/auth';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Reconnection configuration
const RECONNECTION_CONFIG = {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
};

/**
 * WebSocket event data types
 * Validates: Requirements 7.1, 7.2, 7.3
 */
export interface ActionRegisteredEvent {
  action: any;
  updatedStatistics?: any;
  timestamp: string;
}

export interface SetFinalizedEvent {
  setId: string;
  setStatistics: any;
  timestamp: string;
}

export interface MatchFinalizedEvent {
  matchId: string;
  finalStatistics: any;
  timestamp: string;
}

export interface LiveStatisticsUpdateEvent {
  liveStatistics: any;
  timestamp: string;
}

export interface SetScoreUpdatedEvent {
  setId: string;
  homeScore: number;
  awayScore: number;
  timestamp: string;
}

export interface ActionUndoneEvent {
  deletedAction: any;
  updatedStatistics?: any;
  timestamp: string;
}

export interface MatchJoinedEvent {
  matchId: string;
  message: string;
}

export interface MatchLeftEvent {
  matchId: string;
  message: string;
}

export interface UserJoinedEvent {
  userId: string;
  username: string;
  matchId: string;
}

export interface UserLeftEvent {
  userId: string;
  username: string;
  matchId: string;
}

/**
 * WebSocket event handlers type
 */
export interface WebSocketEventHandlers {
  onActionRegistered?: (data: ActionRegisteredEvent) => void;
  onSetFinalized?: (data: SetFinalizedEvent) => void;
  onMatchFinalized?: (data: MatchFinalizedEvent) => void;
  onLiveStatisticsUpdate?: (data: LiveStatisticsUpdateEvent) => void;
  onSetScoreUpdated?: (data: SetScoreUpdatedEvent) => void;
  onActionUndone?: (data: ActionUndoneEvent) => void;
  onMatchJoined?: (data: MatchJoinedEvent) => void;
  onMatchLeft?: (data: MatchLeftEvent) => void;
  onUserJoined?: (data: UserJoinedEvent) => void;
  onUserLeft?: (data: UserLeftEvent) => void;
}

/**
 * WebSocket connection state
 */
export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  reconnectAttempt: number;
}

/**
 * Custom hook for WebSocket connection with authentication and reconnection logic
 * Implements: Socket.io client connection, authentication, event hooks, reconnection
 * Validates: Requirements 7.1, 7.2, 7.3
 */
export function useWebSocket(matchId: string | null, handlers?: WebSocketEventHandlers) {
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    reconnectAttempt: 0,
  });
  const handlersRef = useRef(handlers);

  // Update handlers ref when they change
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  /**
   * Initialize WebSocket connection with authentication
   */
  const connect = useCallback(() => {
    if (!matchId) return;

    const token = getAccessToken();
    if (!token) {
      setState((prev) => ({
        ...prev,
        error: 'No authentication token available',
        isConnecting: false,
      }));
      return;
    }

    // Check if token is expired
    if (isTokenExpired(token)) {
      setState((prev) => ({
        ...prev,
        error: 'Authentication token expired. Please log in again.',
        isConnecting: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    // Initialize socket connection with authentication
    const socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      ...RECONNECTION_CONFIG,
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('WebSocket connected, Socket ID:', socket.id);
      setState({
        isConnected: true,
        isConnecting: false,
        error: null,
        reconnectAttempt: 0,
      });

      // Join the match room
      socket.emit('join_match', { matchId });
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setState((prev) => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
      }));
    });

    socket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err.message);
      setState((prev) => ({
        ...prev,
        error: err.message,
        isConnected: false,
        isConnecting: false,
      }));
    });

    // Reconnection event handlers
    socket.io.on('reconnect_attempt', (attempt) => {
      console.log(`WebSocket reconnection attempt ${attempt}`);
      setState((prev) => ({
        ...prev,
        reconnectAttempt: attempt,
        isConnecting: true,
      }));
    });

    socket.io.on('reconnect', (attempt) => {
      console.log(`WebSocket reconnected after ${attempt} attempts`);
      setState({
        isConnected: true,
        isConnecting: false,
        error: null,
        reconnectAttempt: 0,
      });
    });

    socket.io.on('reconnect_error', (err) => {
      console.error('WebSocket reconnection error:', err.message);
      setState((prev) => ({
        ...prev,
        error: `Reconnection failed: ${err.message}`,
      }));
    });

    socket.io.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed after maximum attempts');
      setState((prev) => ({
        ...prev,
        error: 'Failed to reconnect after maximum attempts',
        isConnecting: false,
      }));
    });

    // Match room event handlers
    socket.on('match_joined', (data: MatchJoinedEvent) => {
      console.log('Successfully joined match room:', data);
      handlersRef.current?.onMatchJoined?.(data);
    });

    socket.on('match_left', (data: MatchLeftEvent) => {
      console.log('Successfully left match room:', data);
      handlersRef.current?.onMatchLeft?.(data);
    });

    socket.on('user_joined', (data: UserJoinedEvent) => {
      console.log('User joined match room:', data);
      handlersRef.current?.onUserJoined?.(data);
    });

    socket.on('user_left', (data: UserLeftEvent) => {
      console.log('User left match room:', data);
      handlersRef.current?.onUserLeft?.(data);
    });

    // Match event handlers
    socket.on('action_registered', (data: ActionRegisteredEvent) => {
      console.log('Action registered:', data);
      handlersRef.current?.onActionRegistered?.(data);
    });

    socket.on('set_finalized', (data: SetFinalizedEvent) => {
      console.log('Set finalized:', data);
      handlersRef.current?.onSetFinalized?.(data);
    });

    socket.on('match_finalized', (data: MatchFinalizedEvent) => {
      console.log('Match finalized:', data);
      handlersRef.current?.onMatchFinalized?.(data);
    });

    socket.on('live_statistics_update', (data: LiveStatisticsUpdateEvent) => {
      console.log('Live statistics update:', data);
      handlersRef.current?.onLiveStatisticsUpdate?.(data);
    });

    socket.on('set_score_updated', (data: SetScoreUpdatedEvent) => {
      console.log('Set score updated:', data);
      handlersRef.current?.onSetScoreUpdated?.(data);
    });

    socket.on('action_undone', (data: ActionUndoneEvent) => {
      console.log('Action undone:', data);
      handlersRef.current?.onActionUndone?.(data);
    });
  }, [matchId]);

  /**
   * Disconnect WebSocket connection
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      if (matchId) {
        socketRef.current.emit('leave_match', { matchId });
      }
      socketRef.current.disconnect();
      socketRef.current = null;
      setState({
        isConnected: false,
        isConnecting: false,
        error: null,
        reconnectAttempt: 0,
      });
    }
  }, [matchId]);

  /**
   * Manually trigger reconnection
   */
  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      connect();
    }, 100);
  }, [connect, disconnect]);

  // Initialize connection when matchId changes
  useEffect(() => {
    if (matchId) {
      connect();
    }

    // Cleanup on unmount or matchId change
    return () => {
      disconnect();
    };
  }, [matchId, connect, disconnect]);

  /**
   * Subscribe to a specific event
   */
  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }
  }, []);

  /**
   * Unsubscribe from a specific event
   */
  const off = useCallback((event: string, handler: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, handler);
    }
  }, []);

  /**
   * Emit an event to the server
   */
  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current && state.isConnected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn(`Cannot emit event "${event}": WebSocket not connected`);
    }
  }, [state.isConnected]);

  return {
    socket: socketRef.current,
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    error: state.error,
    reconnectAttempt: state.reconnectAttempt,
    connect,
    disconnect,
    reconnect,
    on,
    off,
    emit,
  };
}
