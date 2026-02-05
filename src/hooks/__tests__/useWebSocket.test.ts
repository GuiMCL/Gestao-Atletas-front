import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWebSocket } from '../useWebSocket';
import * as authLib from '@/lib/auth';

// Mock socket.io-client
vi.mock('socket.io-client');

// Mock auth library
vi.mock('@/lib/auth', () => ({
  getAccessToken: vi.fn(),
  isTokenExpired: vi.fn(),
}));

describe('useWebSocket', () => {
  const mockMatchId = 'test-match-123';
  const mockToken = 'mock-jwt-token';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not connect when matchId is null', () => {
    const { result } = renderHook(() => useWebSocket(null));

    expect(result.current.isConnected).toBe(false);
    expect(result.current.socket).toBeNull();
  });

  it('should set error when no authentication token is available', () => {
    vi.mocked(authLib.getAccessToken).mockReturnValue(null);

    const { result } = renderHook(() => useWebSocket(mockMatchId));

    expect(result.current.error).toBe('No authentication token available');
    expect(result.current.isConnected).toBe(false);
  });

  it('should set error when token is expired', () => {
    vi.mocked(authLib.getAccessToken).mockReturnValue(mockToken);
    vi.mocked(authLib.isTokenExpired).mockReturnValue(true);

    const { result } = renderHook(() => useWebSocket(mockMatchId));

    expect(result.current.error).toBe('Authentication token expired. Please log in again.');
    expect(result.current.isConnected).toBe(false);
  });

  it('should provide on, off, and emit methods', () => {
    vi.mocked(authLib.getAccessToken).mockReturnValue(mockToken);
    vi.mocked(authLib.isTokenExpired).mockReturnValue(false);

    const { result } = renderHook(() => useWebSocket(mockMatchId));

    expect(typeof result.current.on).toBe('function');
    expect(typeof result.current.off).toBe('function');
    expect(typeof result.current.emit).toBe('function');
  });

  it('should provide reconnect method', () => {
    vi.mocked(authLib.getAccessToken).mockReturnValue(mockToken);
    vi.mocked(authLib.isTokenExpired).mockReturnValue(false);

    const { result } = renderHook(() => useWebSocket(mockMatchId));

    expect(typeof result.current.reconnect).toBe('function');
  });

  it('should track connection state', () => {
    vi.mocked(authLib.getAccessToken).mockReturnValue(mockToken);
    vi.mocked(authLib.isTokenExpired).mockReturnValue(false);

    const { result } = renderHook(() => useWebSocket(mockMatchId));

    expect(result.current).toHaveProperty('isConnected');
    expect(result.current).toHaveProperty('isConnecting');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('reconnectAttempt');
  });

  it('should accept event handlers', () => {
    vi.mocked(authLib.getAccessToken).mockReturnValue(mockToken);
    vi.mocked(authLib.isTokenExpired).mockReturnValue(false);

    const mockHandlers = {
      onActionRegistered: vi.fn(),
      onSetFinalized: vi.fn(),
      onMatchFinalized: vi.fn(),
    };

    const { result } = renderHook(() => useWebSocket(mockMatchId, mockHandlers));

    // Verify hook returns expected interface
    expect(result.current).toHaveProperty('isConnected');
    expect(result.current).toHaveProperty('on');
    expect(result.current).toHaveProperty('off');
  });
});
