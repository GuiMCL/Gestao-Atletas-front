import { describe, it, expect, beforeEach } from 'vitest';
import {
  setAuthTokens,
  getAccessToken,
  getRefreshToken,
  setUser,
  getUser,
  clearAuth,
  isAuthenticated,
  decodeToken,
  isTokenExpired,
  User,
} from '../auth';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

describe('Auth utilities', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('Token management', () => {
    it('should store and retrieve auth tokens', () => {
      const tokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      };

      setAuthTokens(tokens);

      expect(getAccessToken()).toBe('test-access-token');
      expect(getRefreshToken()).toBe('test-refresh-token');
    });

    it('should return null when no tokens are stored', () => {
      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
    });
  });

  describe('User management', () => {
    it('should store and retrieve user data', () => {
      const user: User = {
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'ATHLETE',
        createdAt: '2024-01-01T00:00:00Z',
      };

      setUser(user);

      const retrievedUser = getUser();
      expect(retrievedUser).toEqual(user);
    });

    it('should return null when no user is stored', () => {
      expect(getUser()).toBeNull();
    });

    it('should return null when user data is invalid JSON', () => {
      localStorageMock.setItem('volleyball_user', 'invalid-json');
      expect(getUser()).toBeNull();
    });
  });

  describe('clearAuth', () => {
    it('should clear all authentication data', () => {
      const tokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      };
      const user: User = {
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'ATHLETE',
        createdAt: '2024-01-01T00:00:00Z',
      };

      setAuthTokens(tokens);
      setUser(user);

      clearAuth();

      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
      expect(getUser()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when access token exists', () => {
      setAuthTokens({
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
      });

      expect(isAuthenticated()).toBe(true);
    });

    it('should return false when no access token exists', () => {
      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('decodeToken', () => {
    it('should decode a valid JWT token', () => {
      // Create a simple JWT token (header.payload.signature)
      const payload = { sub: '123', exp: 9999999999 };
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;

      const decoded = decodeToken(token);
      expect(decoded.sub).toBe('123');
      expect(decoded.exp).toBe(9999999999);
    });

    it('should return null for invalid token', () => {
      const decoded = decodeToken('invalid-token');
      expect(decoded).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for non-expired token', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const payload = { exp: futureTime };
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;

      expect(isTokenExpired(token)).toBe(false);
    });

    it('should return true for expired token', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const payload = { exp: pastTime };
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;

      expect(isTokenExpired(token)).toBe(true);
    });

    it('should return true for token without exp claim', () => {
      const payload = { sub: '123' };
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;

      expect(isTokenExpired(token)).toBe(true);
    });

    it('should return true for invalid token', () => {
      expect(isTokenExpired('invalid-token')).toBe(true);
    });
  });
});
