import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMatchWebSocket } from '../useMatchWebSocket';
import * as authLib from '@/lib/auth';

// Mock the base useWebSocket hook
vi.mock('../useWebSocket', () => ({
  useWebSocket: vi.fn(() => ({
    socket: null,
    isConnected: false,
    isConnecting: false,
    error: null,
    reconnectAttempt: 0,
    connect: vi.fn(),
    disconnect: vi.fn(),
    reconnect: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  })),
}));

// Mock auth library
vi.mock('@/lib/auth', () => ({
  getAccessToken: vi.fn(),
  isTokenExpired: vi.fn(),
}));

describe('useMatchWebSocket', () => {
  const mockMatchId = 'test-match-123';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should initialize with match ID', () => {
    const { result } = renderHook(() =>
      useMatchWebSocket({
        matchId: mockMatchId,
      })
    );

    expect(result.current).toHaveProperty('isConnected');
    expect(result.current).toHaveProperty('isConnecting');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('reconnectAttempt');
    expect(result.current).toHaveProperty('reconnect');
  });

  it('should accept event handlers', () => {
    const mockHandlers = {
      onActionRegistered: vi.fn(),
      onSetFinalized: vi.fn(),
      onMatchFinalized: vi.fn(),
      onLiveStatisticsUpdate: vi.fn(),
      onError: vi.fn(),
    };

    const { result } = renderHook(() =>
      useMatchWebSocket({
        matchId: mockMatchId,
        ...mockHandlers,
      })
    );

    expect(result.current).toBeDefined();
  });

  it('should handle null matchId', () => {
    const { result } = renderHook(() =>
      useMatchWebSocket({
        matchId: null,
      })
    );

    expect(result.current.isConnected).toBe(false);
  });

  it('should provide reconnect functionality', () => {
    const { result } = renderHook(() =>
      useMatchWebSocket({
        matchId: mockMatchId,
      })
    );

    expect(typeof result.current.reconnect).toBe('function');
  });
});
