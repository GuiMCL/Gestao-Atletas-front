/**
 * React Query hooks for team-related API endpoints
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateQueries } from '@/lib/query-client';
import * as teamApi from '@/lib/api/team.api';
import { showSuccessToast, showErrorToast } from '@/lib/toast';

/**
 * Query: Get all teams
 */
export function useTeams() {
  return useQuery({
    queryKey: queryKeys.teams.lists(),
    queryFn: () => teamApi.getAllTeams(),
  });
}

/**
 * Query: Get team details
 */
export function useTeam(teamId: string) {
  return useQuery({
    queryKey: queryKeys.teams.detail(teamId),
    queryFn: () => teamApi.getTeam(teamId),
    enabled: !!teamId,
  });
}

/**
 * Query: Get team statistics
 */
export function useTeamStatistics(teamId: string) {
  return useQuery({
    queryKey: queryKeys.teams.statistics(teamId),
    queryFn: () => teamApi.getTeamStatistics(teamId),
    enabled: !!teamId,
  });
}

/**
 * Query: Get team athletes (roster)
 */
export function useTeamAthletes(teamId: string) {
  return useQuery({
    queryKey: queryKeys.athletes.list({ teamId }),
    queryFn: () => teamApi.getTeamAthletes(teamId),
    enabled: !!teamId,
  });
}

/**
 * Query: Get team athlete rankings
 */
export function useTeamRankings(
  teamId: string,
  filters?: Parameters<typeof teamApi.getTeamRankings>[1]
) {
  return useQuery({
    queryKey: queryKeys.teams.rankings(teamId),
    queryFn: () => teamApi.getTeamRankings(teamId, filters),
    enabled: !!teamId,
  });
}

/**
 * Query: Get team performance trends
 */
export function useTeamTrends(
  teamId: string,
  filters?: Parameters<typeof teamApi.getTeamTrends>[1]
) {
  return useQuery({
    queryKey: queryKeys.teams.trends(teamId, filters),
    queryFn: () => teamApi.getTeamTrends(teamId, filters),
    enabled: !!teamId,
  });
}

/**
 * Mutation: Create team
 */
export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => teamApi.createTeam(name),
    onSuccess: () => {
      // Invalidate team list
      invalidateQueries.teams();

      // Show success toast
      showSuccessToast('Team created successfully!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to create team.';
      showErrorToast(message);
    },
  });
}

/**
 * Mutation: Update team
 */
export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, name }: { teamId: string; name: string }) =>
      teamApi.updateTeam(teamId, name),
    onSuccess: (_, variables) => {
      // Invalidate team detail and list
      invalidateQueries.team(variables.teamId);
      invalidateQueries.teams();

      // Show success toast
      showSuccessToast('Team updated successfully!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update team.';
      showErrorToast(message);
    },
  });
}
