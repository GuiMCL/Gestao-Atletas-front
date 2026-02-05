/**
 * API client functions for match-related endpoints
 */

import { getAccessToken } from '@/lib/auth';
import type { MatchDTO, MatchSummaryDTO } from '@/types/athlete';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Get all matches with optional filters
 */
export async function getMatches(params?: {
  status?: string;
  teamId?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ matches: MatchSummaryDTO[]; pagination: any }> {
  const token = getAccessToken();
  
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.teamId) queryParams.append('teamId', params.teamId);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  
  const url = `${API_BASE_URL}/api/matches${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch matches');
  }

  return response.json();
}

/**
 * Get match details
 */
export async function getMatch(matchId: string): Promise<MatchDTO> {
  const token = getAccessToken();
  
  const response = await fetch(`${API_BASE_URL}/api/matches/${matchId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch match details');
  }

  const data = await response.json();
  return data.match;
}

/**
 * Create a new match
 */
export async function createMatch(data: {
  date: string;
  location: string;
  myTeamId: string;
  opponentTeamName: string;
  athleteIds: string[];
}): Promise<{ matchId: string; match: MatchDTO }> {
  const token = getAccessToken();
  
  const response = await fetch(`${API_BASE_URL}/api/matches`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create match' }));
    throw new Error(error.error || error.message || 'Failed to create match');
  }

  return response.json();
}

/**
 * Start a match
 */
export async function startMatch(matchId: string): Promise<{ matchId: string; firstSetId: string }> {
  const token = getAccessToken();
  
  const response = await fetch(`${API_BASE_URL}/api/matches/${matchId}/start`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error('Failed to start match');
  }

  return response.json();
}

/**
 * Register a match action
 */
export async function registerAction(data: {
  matchId: string;
  setId: string;
  athleteId: string;
  actionType: string;
  result: string;
  timestamp?: string;
}): Promise<{ actionId: string; updatedStatistics: any }> {
  const token = getAccessToken();
  
  const response = await fetch(`${API_BASE_URL}/api/matches/${data.matchId}/actions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to register action' }));
    throw new Error(error.message || 'Failed to register action');
  }

  return response.json();
}

/**
 * Get live match statistics
 */
export async function getLiveStatistics(matchId: string): Promise<any> {
  const token = getAccessToken();
  
  const response = await fetch(`${API_BASE_URL}/api/statistics/match/${matchId}/live`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch live statistics' }));
    console.error('Live statistics error:', error);
    throw new Error(error.error || error.message || 'Failed to fetch live statistics');
  }

  const data = await response.json();
  console.log('Live statistics response:', data);
  return data.liveStatistics || data;
}

/**
 * Create a new set for a match
 */
export async function createSet(matchId: string): Promise<{ set: any }> {
  const token = getAccessToken();
  
  const response = await fetch(`${API_BASE_URL}/api/matches/${matchId}/sets`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create set' }));
    throw new Error(error.error || error.message || 'Failed to create set');
  }

  const data = await response.json();
  return { set: data.set || data };
}

/**
 * Finalize a set
 */
export async function finalizeSet(setId: string): Promise<{ setId: string; statistics: any }> {
  const token = getAccessToken();
  
  const response = await fetch(`${API_BASE_URL}/api/sets/${setId}/finalize`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to finalize set' }));
    throw new Error(error.error || error.message || 'Failed to finalize set');
  }

  return response.json();
}

/**
 * Update set score
 */
export async function updateSetScore(setId: string, homeScore: number, awayScore: number): Promise<any> {
  const token = getAccessToken();
  
  const response = await fetch(`${API_BASE_URL}/api/sets/${setId}/score`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ homeScore, awayScore }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update score' }));
    throw new Error(error.error || error.message || 'Failed to update score');
  }

  return response.json();
}

/**
 * Get all sets for a match
 */
export async function getMatchSets(matchId: string): Promise<any[]> {
  const token = getAccessToken();
  
  const response = await fetch(`${API_BASE_URL}/api/matches/${matchId}/sets`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch match sets');
  }

  const data = await response.json();
  return data.sets || data;
}

/**
 * Finalize a match
 */
export async function endMatch(matchId: string): Promise<{ matchId: string; finalStatistics: any }> {
  const token = getAccessToken();
  
  const response = await fetch(`${API_BASE_URL}/api/matches/${matchId}/finalize`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to finalize match' }));
    throw new Error(error.error || error.message || 'Failed to finalize match');
  }

  return response.json();
}

/**
 * Finalize a match (alias for endMatch)
 */
export async function finalizeMatch(matchId: string): Promise<{ matchId: string; finalStatistics: any }> {
  return endMatch(matchId);
}

/**
 * Get match statistics
 */
export async function getMatchStatistics(matchId: string): Promise<any> {
  const token = getAccessToken();
  
  console.log('Fetching match statistics for:', matchId);
  const response = await fetch(`${API_BASE_URL}/api/statistics/match/${matchId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch match statistics' }));
    console.error('Match statistics error:', error);
    throw new Error(error.error || error.message || 'Failed to fetch match statistics');
  }

  const data = await response.json();
  console.log('Match statistics response:', data);
  // Backend returns { matchId, statistics }, so we return statistics
  return data.statistics || data;
}

/**
 * Undo the last action in a match
 */
export async function undoLastAction(matchId: string): Promise<{
  success: boolean;
  deletedAction: any;
  updatedStatistics: any;
}> {
  const token = getAccessToken();
  
  const response = await fetch(`${API_BASE_URL}/api/matches/${matchId}/actions/last`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to undo action' }));
    throw new Error(error.error || error.message || 'Failed to undo action');
  }

  return response.json();
}

/**
 * Export match statistics
 */
export async function exportMatchStatistics(matchId: string, format: 'pdf' | 'xlsx' | 'json'): Promise<Blob> {
  const token = getAccessToken();
  
  if (!token) {
    throw new Error('No authentication token available. Please log in again.');
  }
  
  // Check if token is expired
  try {
    const tokenParts = token.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(atob(tokenParts[1]));
      const currentTime = Date.now() / 1000;
      if (payload.exp && payload.exp < currentTime) {
        throw new Error('Authentication token has expired. Please log in again.');
      }
    }
  } catch (e) {
    // If we can't decode the token, proceed with the request and let the backend handle validation
    console.warn('Could not validate token expiration:', e);
  }
  
  const response = await fetch(`${API_BASE_URL}/api/statistics/match/${matchId}/export?format=${format}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    // Try to get the error message from the response
    const errorText = await response.text().catch(() => `Failed to export match statistics as ${format}`);
    let errorMessage = `Failed to export match statistics as ${format}`;
    
    try {
      // Try to parse as JSON to get detailed error message
      const errorObj = JSON.parse(errorText);
      errorMessage = errorObj.error || errorObj.message || errorMessage;
    } catch {
      // If not JSON, use the text as is or fallback to default message
      errorMessage = errorText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }

  return response.blob();
}
