/**
 * Tests for React Query setup and configuration
 */

import { describe, it, expect } from 'vitest';
import { queryClient, queryKeys, invalidateQueries } from '@/lib/query-client';

describe('React Query Setup', () => {
  describe('QueryClient Configuration', () => {
    it('should have a configured query client', () => {
      expect(queryClient).toBeDefined();
      expect(queryClient.getDefaultOptions()).toBeDefined();
    });

    it('should have correct default stale time', () => {
      const options = queryClient.getDefaultOptions();
      expect(options.queries?.staleTime).toBe(5 * 60 * 1000); // 5 minutes
    });

    it('should have correct default cache time', () => {
      const options = queryClient.getDefaultOptions();
      expect(options.queries?.gcTime).toBe(10 * 60 * 1000); // 10 minutes
    });

    it('should have retry configured', () => {
      const options = queryClient.getDefaultOptions();
      expect(options.queries?.retry).toBe(3);
    });
  });

  describe('Query Keys', () => {
    it('should generate athlete query keys correctly', () => {
      const athleteId = 'athlete-123';
      const key = queryKeys.athletes.detail(athleteId);
      
      expect(key).toEqual(['athletes', 'detail', athleteId]);
    });

    it('should generate match query keys correctly', () => {
      const matchId = 'match-456';
      const key = queryKeys.matches.detail(matchId);
      
      expect(key).toEqual(['matches', 'detail', matchId]);
    });

    it('should generate team query keys correctly', () => {
      const teamId = 'team-789';
      const key = queryKeys.teams.detail(teamId);
      
      expect(key).toEqual(['teams', 'detail', teamId]);
    });

    it('should generate notification query keys correctly', () => {
      const key = queryKeys.notifications.lists();
      
      expect(key).toEqual(['notifications', 'list']);
    });

    it('should generate user query keys correctly', () => {
      const userId = 'user-101';
      const key = queryKeys.users.detail(userId);
      
      expect(key).toEqual(['users', 'detail', userId]);
    });

    it('should generate live statistics query keys correctly', () => {
      const matchId = 'match-456';
      const key = queryKeys.matches.liveStatistics(matchId);
      
      expect(key).toEqual(['matches', 'detail', matchId, 'live-statistics']);
    });

    it('should generate query keys with filters', () => {
      const filters = { teamId: 'team-1', activeOnly: true };
      const key = queryKeys.athletes.list(filters);
      
      expect(key).toEqual(['athletes', 'list', filters]);
    });
  });

  describe('Cache Invalidation Helpers', () => {
    it('should have invalidation helpers for all domains', () => {
      expect(invalidateQueries.athletes).toBeDefined();
      expect(invalidateQueries.athlete).toBeDefined();
      expect(invalidateQueries.teams).toBeDefined();
      expect(invalidateQueries.team).toBeDefined();
      expect(invalidateQueries.matches).toBeDefined();
      expect(invalidateQueries.match).toBeDefined();
      expect(invalidateQueries.notifications).toBeDefined();
      expect(invalidateQueries.users).toBeDefined();
      expect(invalidateQueries.statistics).toBeDefined();
    });

    it('should be callable functions', () => {
      expect(typeof invalidateQueries.athletes).toBe('function');
      expect(typeof invalidateQueries.athlete).toBe('function');
      expect(typeof invalidateQueries.teams).toBe('function');
      expect(typeof invalidateQueries.team).toBe('function');
    });
  });

  describe('Query Key Hierarchy', () => {
    it('should maintain proper key hierarchy for athletes', () => {
      const athleteId = 'athlete-123';
      const detailKey = queryKeys.athletes.detail(athleteId);
      const matchesKey = queryKeys.athletes.matches(athleteId);
      const statisticsKey = queryKeys.athletes.statistics(athleteId);

      // All should start with the same base
      expect(detailKey[0]).toBe('athletes');
      expect(matchesKey[0]).toBe('athletes');
      expect(statisticsKey[0]).toBe('athletes');

      // Detail key should be a prefix of more specific keys
      expect(matchesKey.slice(0, detailKey.length)).toEqual(detailKey);
      expect(statisticsKey.slice(0, detailKey.length)).toEqual(detailKey);
    });

    it('should maintain proper key hierarchy for matches', () => {
      const matchId = 'match-456';
      const detailKey = queryKeys.matches.detail(matchId);
      const setsKey = queryKeys.matches.sets(matchId);
      const actionsKey = queryKeys.matches.actions(matchId);
      const statsKey = queryKeys.matches.statistics(matchId);

      // All should start with the same base
      expect(detailKey[0]).toBe('matches');
      expect(setsKey[0]).toBe('matches');
      expect(actionsKey[0]).toBe('matches');
      expect(statsKey[0]).toBe('matches');

      // Detail key should be a prefix of more specific keys
      expect(setsKey.slice(0, detailKey.length)).toEqual(detailKey);
      expect(actionsKey.slice(0, detailKey.length)).toEqual(detailKey);
      expect(statsKey.slice(0, detailKey.length)).toEqual(detailKey);
    });
  });

  describe('Query Key Uniqueness', () => {
    it('should generate unique keys for different athletes', () => {
      const key1 = queryKeys.athletes.detail('athlete-1');
      const key2 = queryKeys.athletes.detail('athlete-2');
      
      expect(key1).not.toEqual(key2);
    });

    it('should generate unique keys for different matches', () => {
      const key1 = queryKeys.matches.detail('match-1');
      const key2 = queryKeys.matches.detail('match-2');
      
      expect(key1).not.toEqual(key2);
    });

    it('should generate unique keys for different filter combinations', () => {
      const key1 = queryKeys.athletes.list({ teamId: 'team-1' });
      const key2 = queryKeys.athletes.list({ teamId: 'team-2' });
      const key3 = queryKeys.athletes.list({ teamId: 'team-1', activeOnly: true });
      
      expect(key1).not.toEqual(key2);
      expect(key1).not.toEqual(key3);
      expect(key2).not.toEqual(key3);
    });
  });
});
