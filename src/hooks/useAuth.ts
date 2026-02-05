'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, getAccessToken, clearAuth, isTokenExpired, User } from '@/lib/auth';

/**
 * Custom hook for managing authentication state
 */
export const useAuth = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = getAccessToken();
      const userData = getUser();

      if (token && userData) {
        // Check if token is expired
        if (isTokenExpired(token)) {
          // Token expired, clear auth and redirect to login
          clearAuth();
          setUser(null);
          setIsAuthenticated(false);
          router.push('/login');
        } else {
          setUser(userData);
          setIsAuthenticated(true);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  const logout = () => {
    clearAuth();
    setUser(null);
    setIsAuthenticated(false);
    router.push('/login');
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    logout,
  };
};
