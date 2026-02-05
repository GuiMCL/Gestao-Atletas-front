/**
 * React Query hooks for match-related API endpoints
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateQueries } from '@/lib/query-client';
import * as matchApi from '@/lib/api/match.api';
import { showSuccessToast, showErrorToast } from '@/lib/toast';

/**
 * Query: Get all matches
 */
export function useMatches(params?: {
  status?: string;
  teamId?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: queryKeys.matches.list(params),
    queryFn: () => matchApi.getMatches(params),
  });
}

/**
 * Query: Get match details
 */
export function useMatch(matchId: string) {
  return useQuery({
    queryKey: queryKeys.matches.detail(matchId),
    queryFn: () => matchApi.getMatch(matchId),
    enabled: !!matchId,
  });
}

/**
 * Query: Get match sets
 */
export function useMatchSets(matchId: string) {
  return useQuery({
    queryKey: queryKeys.matches.sets(matchId),
    queryFn: () => matchApi.getMatchSets(matchId),
    enabled: !!matchId,
  });
}

/**
 * Query: Get live match statistics
 */
export function useLiveStatistics(matchId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.matches.liveStatistics(matchId),
    queryFn: () => matchApi.getLiveStatistics(matchId),
    enabled: !!matchId && enabled,
    // Refetch more frequently for live data
    refetchInterval: 5000, // 5 seconds
    staleTime: 0, // Always consider stale for real-time updates
  });
}

/**
 * Query: Get match statistics
 */
export function useMatchStatistics(matchId: string) {
  return useQuery({
    queryKey: queryKeys.matches.statistics(matchId),
    queryFn: () => matchApi.getMatchStatistics(matchId),
    enabled: !!matchId,
  });
}

/**
 * Mutation: Create match
 */
export function useCreateMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof matchApi.createMatch>[0]) =>
      matchApi.createMatch(data),
    onSuccess: () => {
      // Invalidate match list
      invalidateQueries.matches();

      // Show success toast
      showSuccessToast('Match created successfully!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to create match.';
      showErrorToast(message);
    },
  });
}

/**
 * Mutation: Start match
 */
export function useStartMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (matchId: string) => matchApi.startMatch(matchId),
    onSuccess: (_, matchId) => {
      // Invalidate match detail and sets
      invalidateQueries.match(matchId);

      // Show success toast
      showSuccessToast('Match started! First set is now active.');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to start match.';
      showErrorToast(message);
    },
  });
}

/**
 * Mutation: Register action
 */
export function useRegisterAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      matchId,
      data,
    }: {
      matchId: string;
      data: Omit<Parameters<typeof matchApi.registerAction>[0], 'matchId'>;
    }) => matchApi.registerAction({ ...data, matchId }),
    onMutate: async ({ matchId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.matches.liveStatistics(matchId),
      });

      // Snapshot previous value
      const previousStats = queryClient.getQueryData(
        queryKeys.matches.liveStatistics(matchId)
      );

      // Optimistically update live statistics
      queryClient.setQueryData(
        queryKeys.matches.liveStatistics(matchId),
        (old: any) => {
          if (!old) return old;
          // Return optimistic update (simplified - actual implementation would update stats)
          return { ...old, lastAction: data };
        }
      );

      return { previousStats };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousStats) {
        queryClient.setQueryData(
          queryKeys.matches.liveStatistics(variables.matchId),
          context.previousStats
        );
      }

      // Show error toast
      const message = (err as any)?.response?.data?.message || 'Failed to register action.';
      showErrorToast(message);
    },
    onSettled: (_, __, variables) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: queryKeys.matches.liveStatistics(variables.matchId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.matches.actions(variables.matchId),
      });
    },
  });
}

/**
 * Mutation: Create set
 */
export function useCreateSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (matchId: string) => matchApi.createSet(matchId),
    onSuccess: (_, matchId) => {
      // Invalidate match sets and details
      invalidateQueries.match(matchId);

      // Show success toast
      showSuccessToast('New set created successfully!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to create new set.';
      showErrorToast(message);
    },
  });
}

/**
 * Mutation: Finalize set
 */
export function useFinalizeSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (setId: string) => matchApi.finalizeSet(setId),
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.sets.detail(data.setId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.matches.all });

      // Show success toast
      showSuccessToast('Set finalized! Statistics have been calculated.');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to finalize set.';
      showErrorToast(message);
    },
  });
}

/**
 * Mutation: Finalize match
 * Validates: Requirements 10.1
 */
export function useFinalizeMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (matchId: string) => matchApi.finalizeMatch(matchId),
    onSuccess: (_, matchId) => {
      // Invalidate match and related queries
      invalidateQueries.match(matchId);
      invalidateQueries.matches();
      invalidateQueries.statistics();
      invalidateQueries.notifications();

      // Show success toast
      showSuccessToast('Match finalized! Reports have been generated and athletes notified.');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to finalize match.';
      showErrorToast(message);
    },
  });
}

/**
 * Mutation: Export match statistics
 */
export function useExportMatchStatistics() {
  return useMutation({
    mutationFn: ({
      matchId,
      format,
    }: {
      matchId: string;
      format: 'pdf' | 'xlsx' | 'json';
    }) => matchApi.exportMatchStatistics(matchId, format),
    onSuccess: (blob, variables) => {
      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `match-${variables.matchId}.${variables.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Show success toast
      showSuccessToast(`Match statistics exported as ${variables.format.toUpperCase()}`);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to export match statistics.';
      showErrorToast(message);
    },
  });
}
