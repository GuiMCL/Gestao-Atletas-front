/**
 * API client functions for team-related endpoints
 */

import { getAccessToken } from '@/lib/auth';
import type { TeamDTO, TeamStatisticsDTO } from '@/types/athlete';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Get team details
 */
export async function getTeam(teamId: string): Promise<TeamDTO> {
  const token = getAccessToken();
  
  const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch team details');
  }

  return response.json();
}

/**
 * Get team statistics
 */
export async function getTeamStatistics(teamId: string): Promise<TeamStatisticsDTO> {
  const token = getAccessToken();
  
  console.log('Fetching team statistics for:', teamId);
  const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/statistics`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch team statistics' }));
    console.error('Team statistics error:', error);
    throw new Error(error.error || error.message || 'Failed to fetch team statistics');
  }

  const data = await response.json();
  console.log('Team statistics response:', data);
  return data.statistics || data;
}

/**
 * Get team athletes (roster)
 */
export async function getTeamAthletes(teamId: string): Promise<import('@/types/athlete').AthleteDTO[]> {
  const token = getAccessToken();
  
  const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/athletes`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch team athletes');
  }

  const data = await response.json();
  return data.athletes || data;
}

/**
 * Get team athlete rankings
 */
export async function getTeamRankings(
  teamId: string,
  filters?: import('@/types/athlete').TeamAnalyticsFilters
): Promise<import('@/types/athlete').AthleteRankingDTO[]> {
  const token = getAccessToken();
  
  const queryParams = new URLSearchParams();
  // metric is required for rankings endpoint
  queryParams.append('metric', 'totalPoints');
  if (filters?.startDate) queryParams.append('startDate', filters.startDate);
  if (filters?.endDate) queryParams.append('endDate', filters.endDate);
  if (filters?.opponent) queryParams.append('opponentTeamId', filters.opponent);
  
  const url = `${API_BASE_URL}/api/teams/${teamId}/rankings?${queryParams.toString()}`;
  
  console.log('Fetching team rankings:', url);
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch team rankings' }));
    console.error('Team rankings error:', error);
    throw new Error(error.error || error.message || 'Failed to fetch team rankings');
  }

  const data = await response.json();
  console.log('Team rankings response:', data);
  return data.rankings || data;
}

/**
 * Get team performance trends
 */
export async function getTeamTrends(
  teamId: string,
  filters?: import('@/types/athlete').TeamAnalyticsFilters
): Promise<import('@/types/athlete').TrendDataDTO[]> {
  const token = getAccessToken();
  
  const queryParams = new URLSearchParams();
  // Add default metric if no fundamental is specified
  if (!filters?.fundamental) {
    queryParams.append('metric', 'attackEfficiency');
  }
  if (filters?.startDate) queryParams.append('startDate', filters.startDate);
  if (filters?.endDate) queryParams.append('endDate', filters.endDate);
  if (filters?.opponent) queryParams.append('opponentTeamId', filters.opponent);
  if (filters?.fundamental) queryParams.append('fundamental', filters.fundamental);
  
  const url = `${API_BASE_URL}/api/teams/${teamId}/trends${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  console.log('Fetching team trends:', url);
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch team trends' }));
    console.error('Team trends error:', error);
    throw new Error(error.error || error.message || 'Failed to fetch team trends');
  }

  const data = await response.json();
  console.log('Team trends response:', data);
  return data.trends || data;
}

/**
 * Get all teams
 */
export async function getAllTeams(): Promise<TeamDTO[]> {
  const token = getAccessToken();
  
  const response = await fetch(`${API_BASE_URL}/api/teams`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch teams');
  }

  const data = await response.json();
  return data.teams;
}

/**
 * Create a new team
 */
export async function createTeam(name: string): Promise<TeamDTO> {
  const token = getAccessToken();
  
  const response = await fetch(`${API_BASE_URL}/api/teams`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw new Error('Failed to create team');
  }

  const data = await response.json();
  return data.team;
}

/**
 * Update team information
 */
export async function updateTeam(teamId: string, name: string): Promise<TeamDTO> {
  const token = getAccessToken();
  
  const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw new Error('Failed to update team');
  }

  const data = await response.json();
  return data.team;
}
