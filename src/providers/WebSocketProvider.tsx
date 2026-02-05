'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

/**
 * WebSocket context for managing global WebSocket state
 * Validates: Requirements 7.1, 7.2, 7.3
 */
interface WebSocketContextValue {
  currentMatchId: string | null;
  setCurrentMatchId: (matchId: string | null) => void;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  reconnectAttempt: number;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined);

/**
 * WebSocket Provider component
 * Provides global WebSocket state management across the application
 */
export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [currentMatchId, setCurrentMatchId] = useState<string | null>(null);

  const {
    isConnected,
    isConnecting,
    error,
    reconnectAttempt,
    reconnect,
  } = useWebSocket(currentMatchId);

  const value: WebSocketContextValue = {
    currentMatchId,
    setCurrentMatchId,
    isConnected,
    isConnecting,
    error,
    reconnectAttempt,
    reconnect,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

/**
 * Hook to access WebSocket context
 */
export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
}
