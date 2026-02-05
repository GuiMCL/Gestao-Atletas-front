/**
 * React Query hooks for athlete-related API endpoints
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateQueries } from '@/lib/query-client';
import * as athleteApi from '@/lib/api/athlete.api';
import { showSuccessToast, showErrorToast } from '@/lib/toast';

/**
 * Query: Get athlete profile
 */
export function useAthleteProfile(athleteId: string) {
  return useQuery({
    queryKey: queryKeys.athletes.detail(athleteId),
    queryFn: () => athleteApi.getAthleteProfile(athleteId),
    enabled: !!athleteId,
  });
}

/**
 * Query: Get athlete matches
 */
export function useAthleteMatches(
  athleteId: string,
  page: number = 1,
  pageSize: number = 10
) {
  return useQuery({
    queryKey: queryKeys.athletes.matches(athleteId),
    queryFn: () => athleteApi.getAthleteMatches(athleteId, page, pageSize),
    enabled: !!athleteId,
  });
}

/**
 * Query: Get all athletes
 */
export function useAthletes(params?: {
  teamId?: string;
  activeOnly?: boolean;
  search?: string;
}) {
  return useQuery({
    queryKey: queryKeys.athletes.list(params),
    queryFn: () => athleteApi.getAllAthletes(params),
  });
}

/**
 * Mutation: Update athlete profile
 */
export function useUpdateAthleteProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      athleteId,
      data,
    }: {
      athleteId: string;
      data: Parameters<typeof athleteApi.updateAthleteProfile>[1];
    }) => athleteApi.updateAthleteProfile(athleteId, data),
    onSuccess: (_, variables) => {
      // Invalidate athlete detail query
      invalidateQueries.athlete(variables.athleteId);
      // Invalidate athlete list
      invalidateQueries.athletes();

      // Show success toast
      showSuccessToast('Athlete profile updated successfully!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update athlete profile.';
      showErrorToast(message);
    },
  });
}

/**
 * Mutation: Upload athlete photo
 */
export function useUploadAthletePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ athleteId, file }: { athleteId: string; file: File }) =>
      athleteApi.uploadAthletePhoto(athleteId, file),
    onSuccess: (_, variables) => {
      // Invalidate athlete detail query
      invalidateQueries.athlete(variables.athleteId);

      // Show success toast
      showSuccessToast('Photo uploaded successfully!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to upload photo.';
      showErrorToast(message);
    },
  });
}

/**
 * Mutation: Create athlete
 */
export function useCreateAthlete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof athleteApi.createAthlete>[0]) =>
      athleteApi.createAthlete(data),
    onSuccess: () => {
      // Invalidate athlete list
      invalidateQueries.athletes();

      // Show success toast
      showSuccessToast('Athlete created successfully!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to create athlete.';
      showErrorToast(message);
    },
  });
}

/**
 * Mutation: Deactivate athlete
 */
export function useDeactivateAthlete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (athleteId: string) => athleteApi.deactivateAthlete(athleteId),
    onSuccess: (_, athleteId) => {
      // Invalidate athlete detail and list
      invalidateQueries.athlete(athleteId);
      invalidateQueries.athletes();

      // Show success toast
      showSuccessToast('Athlete deactivated successfully.');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to deactivate athlete.';
      showErrorToast(message);
    },
  });
}
