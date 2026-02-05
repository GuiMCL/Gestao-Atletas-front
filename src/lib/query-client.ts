/**
 * React Query (TanStack Query) configuration
 * 
 * This module provides:
 * - QueryClient configuration with default options
 * - Cache invalidation strategies
 * - Error handling defaults
 */

import { QueryClient, DefaultOptions } from '@tanstack/react-query';

/**
 * Default options for React Query
 */
const queryConfig: DefaultOptions = {
  queries: {
    // Stale time: how long data is considered fresh (5 minutes)
    staleTime: 5 * 60 * 1000,
    
    // Cache time: how long unused data stays in cache (10 minutes)
    gcTime: 10 * 60 * 1000,
    
    // Retry failed requests (3 times with exponential backoff)
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Refetch on window focus for real-time data
    refetchOnWindowFocus: true,
    
    // Don't refetch on mount if data is fresh
    refetchOnMount: false,
    
    // Refetch on reconnect
    refetchOnReconnect: true,
  },
  mutations: {
    // Retry mutations once on failure
    retry: 1,
    retryDelay: 1000,
  },
};

/**
 * Create and export QueryClient instance
 */
export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});

/**
 * Query keys for cache management and invalidation
 * Organized by domain for easy invalidation
 */
export const queryKeys = {
  // Authentication
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
  },
  
  // Athletes
  athletes: {
    all: ['athletes'] as const,
    lists: () => [...queryKeys.athletes.all, 'list'] as const,
    list: (filters?: Record<string, any>) => 
      [...queryKeys.athletes.lists(), filters] as const,
    details: () => [...queryKeys.athletes.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.athletes.details(), id] as const,
    matches: (id: string) => [...queryKeys.athletes.detail(id), 'matches'] as const,
    statistics: (id: string, filters?: Record<string, any>) => 
      [...queryKeys.athletes.detail(id), 'statistics', filters] as const,
  },
  
  // Teams
  teams: {
    all: ['teams'] as const,
    lists: () => [...queryKeys.teams.all, 'list'] as const,
    list: (filters?: Record<string, any>) => 
      [...queryKeys.teams.lists(), filters] as const,
    details: () => [...queryKeys.teams.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.teams.details(), id] as const,
    statistics: (id: string, filters?: Record<string, any>) => 
      [...queryKeys.teams.detail(id), 'statistics', filters] as const,
    rankings: (id: string) => [...queryKeys.teams.detail(id), 'rankings'] as const,
    trends: (id: string, filters?: Record<string, any>) => 
      [...queryKeys.teams.detail(id), 'trends', filters] as const,
  },
  
  // Matches
  matches: {
    all: ['matches'] as const,
    lists: () => [...queryKeys.matches.all, 'list'] as const,
    list: (filters?: Record<string, any>) => 
      [...queryKeys.matches.lists(), filters] as const,
    details: () => [...queryKeys.matches.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.matches.details(), id] as const,
    sets: (id: string) => [...queryKeys.matches.detail(id), 'sets'] as const,
    actions: (id: string) => [...queryKeys.matches.detail(id), 'actions'] as const,
    statistics: (id: string) => [...queryKeys.matches.detail(id), 'statistics'] as const,
    liveStatistics: (id: string) => 
      [...queryKeys.matches.detail(id), 'live-statistics'] as const,
  },
  
  // Sets
  sets: {
    all: ['sets'] as const,
    details: () => [...queryKeys.sets.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.sets.details(), id] as const,
    actions: (id: string) => [...queryKeys.sets.detail(id), 'actions'] as const,
  },
  
  // Notifications
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    list: (filters?: Record<string, any>) => 
      [...queryKeys.notifications.lists(), filters] as const,
  },
  
  // Users
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters?: Record<string, any>) => 
      [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
  
  // Statistics
  statistics: {
    all: ['statistics'] as const,
    athlete: (id: string, filters?: Record<string, any>) => 
      [...queryKeys.statistics.all, 'athlete', id, filters] as const,
    team: (id: string, filters?: Record<string, any>) => 
      [...queryKeys.statistics.all, 'team', id, filters] as const,
    match: (id: string) => 
      [...queryKeys.statistics.all, 'match', id] as const,
  },
} as const;

/**
 * Cache invalidation helpers
 */
export const invalidateQueries = {
  /**
   * Invalidate all athlete-related queries
   */
  athletes: () => queryClient.invalidateQueries({ queryKey: queryKeys.athletes.all }),
  
  /**
   * Invalidate specific athlete queries
   */
  athlete: (id: string) => 
    queryClient.invalidateQueries({ queryKey: queryKeys.athletes.detail(id) }),
  
  /**
   * Invalidate all team-related queries
   */
  teams: () => queryClient.invalidateQueries({ queryKey: queryKeys.teams.all }),
  
  /**
   * Invalidate specific team queries
   */
  team: (id: string) => 
    queryClient.invalidateQueries({ queryKey: queryKeys.teams.detail(id) }),
  
  /**
   * Invalidate all match-related queries
   */
  matches: () => queryClient.invalidateQueries({ queryKey: queryKeys.matches.all }),
  
  /**
   * Invalidate specific match queries
   */
  match: (id: string) => 
    queryClient.invalidateQueries({ queryKey: queryKeys.matches.detail(id) }),
  
  /**
   * Invalidate all notification queries
   */
  notifications: () => 
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  
  /**
   * Invalidate all user queries
   */
  users: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
  
  /**
   * Invalidate all statistics queries
   */
  statistics: () => 
    queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all }),
};
