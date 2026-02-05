/**
 * API client functions for athlete-related endpoints
 */

import { getAccessToken } from '@/lib/auth';
import type { AthleteProfileResponse, MatchSummaryDTO } from '@/types/athlete';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Get current user's athlete profile
 */
export async function getMyAthleteProfile(): Promise<AthleteProfileResponse> {
  const token = getAccessToken();
  
  console.log('[getMyAthleteProfile] API_BASE_URL:', API_BASE_URL);
  console.log('[getMyAthleteProfile] Fetching:', `${API_BASE_URL}/api/athletes/me`);
  
  const response = await fetch(`${API_BASE_URL}/api/athletes/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  console.log('[getMyAthleteProfile] Response status:', response.status);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch athlete profile' }));
    console.error('[getMyAthleteProfile] Error:', error);
    throw new Error(error.error || error.message || 'Failed to fetch athlete profile');
  }

  const data = await response.json();
  console.log('[getMyAthleteProfile] Data received:', data);
  
  return data;
}

/**
 * Get athlete profile and statistics
 */
export async function getAthleteProfile(athleteId: string): Promise<AthleteProfileResponse> {
  const token = getAccessToken();
  
  const response = await fetch(`${API_BASE_URL}/api/athletes/${athleteId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch athlete profile');
  }

  return response.json();
}

/**
 * Get athlete match history
 */
export async function getAthleteMatches(
  athleteId: string,
  page: number = 1,
  pageSize: number = 10
): Promise<{ matches: MatchSummaryDTO[]; pagination: any }> {
  const token = getAccessToken();
  
  const response = await fetch(
    `${API_BASE_URL}/api/athletes/${athleteId}/matches?page=${page}&pageSize=${pageSize}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch athlete matches');
  }

  return response.json();
}

/**
 * Get detailed match information with statistics
 */
export async function getMatchDetail(matchId: string): Promise<import('@/types/athlete').MatchDetailResponse> {
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

  return response.json();
}

/**
 * Update athlete profile information
 */
export async function updateAthleteProfile(
  athleteId: string,
  data: {
    name?: string;
    position?: import('@/types/athlete').Position;
    jerseyNumber?: number;
    bio?: string;
    photoUrl?: string;
  }
): Promise<import('@/types/athlete').AthleteDTO> {
  const token = getAccessToken();
  
  const response = await fetch(`${API_BASE_URL}/api/athletes/${athleteId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update athlete profile');
  }

  return response.json();
}

/**
 * Upload athlete photo
 */
export async function uploadAthletePhoto(
  athleteId: string,
  file: File
): Promise<string> {
  const token = getAccessToken();
  
  const formData = new FormData();
  formData.append('photo', file);
  
  const response = await fetch(`${API_BASE_URL}/api/athletes/${athleteId}/photo`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload photo');
  }

  const data = await response.json();
  return data.photoUrl;
}

/**
 * Get all athletes with optional filters
 */
export async function getAllAthletes(params?: {
  teamId?: string;
  activeOnly?: boolean;
  search?: string;
}): Promise<import('@/types/athlete').AthleteDTO[]> {
  const token = getAccessToken();
  
  const queryParams = new URLSearchParams();
  if (params?.teamId) queryParams.append('teamId', params.teamId);
  if (params?.activeOnly) queryParams.append('activeOnly', 'true');
  if (params?.search) queryParams.append('search', params.search);
  
  const response = await fetch(
    `${API_BASE_URL}/api/athletes?${queryParams.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch athletes');
  }

  const data = await response.json();
  return data.athletes;
}

/**
 * Create a new athlete
 */
export async function createAthlete(data: {
  userId: string;
  name: string;
  position: import('@/types/athlete').Position;
  jerseyNumber: number;
  teamId: string;
  photoUrl?: string;
  bio?: string;
}): Promise<import('@/types/athlete').AthleteDTO> {
  const token = getAccessToken();
  
  const response = await fetch(`${API_BASE_URL}/api/athletes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create athlete');
  }

  const result = await response.json();
  return result.athlete;
}

/**
 * Deactivate an athlete
 */
export async function deactivateAthlete(athleteId: string): Promise<void> {
  const token = getAccessToken();
  
  const response = await fetch(`${API_BASE_URL}/api/athletes/${athleteId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to deactivate athlete');
  }
}
