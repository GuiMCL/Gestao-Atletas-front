import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import AthleteDashboard from '../page';
import * as authHook from '@/hooks/useAuth';
import * as athleteApi from '@/lib/api/athlete.api';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock useAuth hook
vi.mock('@/hooks/useAuth');

// Mock athlete API
vi.mock('@/lib/api/athlete.api');

describe('AthleteDashboard', () => {
  const mockUser = {
    id: 'athlete-1',
    username: 'john.doe',
    email: 'john@example.com',
    role: 'ATHLETE' as const,
    createdAt: '2024-01-01T00:00:00Z',
  };

  const mockAthlete = {
    id: 'athlete-1',
    userId: 'user-1',
    name: 'John Doe',
    position: 'OUTSIDE_HITTER' as const,
    jerseyNumber: 10,
    teamId: 'team-1',
    photoUrl: 'https://example.com/photo.jpg',
    bio: 'Professional volleyball player',
    isActive: true,
  };

  const mockStatistics = {
    athleteId: 'athlete-1',
    totalMatches: 15,
    totalSets: 45,
    attackEfficiency: 0.45,
    serveEfficiency: 0.35,
    receptionQuality: 2.8,
    blockEfficiency: 0.25,
    totalPoints: 120,
    totalErrors: 30,
    averagePointsPerSet: 2.67,
  };

  const mockMatches = [
    {
      id: 'match-1',
      date: '2024-01-15T18:00:00Z',
      location: 'Main Arena',
      homeTeam: { id: 'team-1', name: 'Team A' },
      awayTeam: { id: 'team-2', name: 'Team B' },
      status: 'FINALIZED' as const,
      finalScore: '3-1',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state initially', () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      logout: vi.fn(),
    });

    const { container } = render(<AthleteDashboard />);
    expect(container.textContent).toContain('Loading dashboard...');
  });

  it('should display athlete profile information', async () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
    });

    vi.mocked(athleteApi.getAthleteProfile).mockResolvedValue({
      athlete: mockAthlete,
      statistics: mockStatistics,
    });

    vi.mocked(athleteApi.getAthleteMatches).mockResolvedValue({
      matches: mockMatches,
      pagination: { page: 1, pageSize: 5, totalItems: 1, totalPages: 1 },
    });

    const { container } = render(<AthleteDashboard />);

    await waitFor(() => {
      expect(container.textContent).toContain('John Doe');
    });

    expect(container.textContent).toContain('Outside Hitter');
    expect(container.textContent).toContain('#10');
    expect(container.textContent).toContain('Professional volleyball player');
  });

  it('should display statistics cards', async () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
    });

    vi.mocked(athleteApi.getAthleteProfile).mockResolvedValue({
      athlete: mockAthlete,
      statistics: mockStatistics,
    });

    vi.mocked(athleteApi.getAthleteMatches).mockResolvedValue({
      matches: mockMatches,
      pagination: { page: 1, pageSize: 5, totalItems: 1, totalPages: 1 },
    });

    const { container } = render(<AthleteDashboard />);

    await waitFor(() => {
      expect(container.textContent).toContain('Attack Efficiency');
    });

    expect(container.textContent).toContain('45.0%');
    expect(container.textContent).toContain('Serve Efficiency');
    expect(container.textContent).toContain('35.0%');
    expect(container.textContent).toContain('Reception Quality');
    expect(container.textContent).toContain('2.80');
  });

  it('should display recent matches', async () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
    });

    vi.mocked(athleteApi.getAthleteProfile).mockResolvedValue({
      athlete: mockAthlete,
      statistics: mockStatistics,
    });

    vi.mocked(athleteApi.getAthleteMatches).mockResolvedValue({
      matches: mockMatches,
      pagination: { page: 1, pageSize: 5, totalItems: 1, totalPages: 1 },
    });

    const { container } = render(<AthleteDashboard />);

    await waitFor(() => {
      expect(container.textContent).toContain('Recent Matches');
    });

    expect(container.textContent).toContain('Team A vs Team B');
    expect(container.textContent).toContain('Main Arena');
    expect(container.textContent).toContain('Score: 3-1');
  });

  it('should handle error state', async () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
    });

    vi.mocked(athleteApi.getAthleteProfile).mockRejectedValue(
      new Error('Failed to fetch')
    );

    const { container } = render(<AthleteDashboard />);

    await waitFor(() => {
      expect(container.textContent).toContain('Failed to load dashboard data');
    });

    expect(container.textContent).toContain('Retry');
  });
});
