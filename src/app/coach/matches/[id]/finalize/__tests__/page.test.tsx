import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MatchFinalizePage from '../page';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'test-match-id' }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock API functions
vi.mock('@/lib/api/match.api', () => ({
  getMatch: vi.fn(),
  getMatchStatistics: vi.fn(),
  finalizeMatch: vi.fn(),
  exportMatchStatistics: vi.fn(),
}));

import { getMatch, getMatchStatistics, finalizeMatch, exportMatchStatistics } from '@/lib/api/match.api';

const mockMatch = {
  id: 'test-match-id',
  date: '2024-01-15T10:00:00Z',
  location: 'Test Arena',
  homeTeam: { id: 'team1', name: 'Home Team' },
  awayTeam: { id: 'team2', name: 'Away Team' },
  status: 'IN_PROGRESS' as const,
  sets: [
    {
      id: 'set1',
      setNumber: 1,
      homeScore: 25,
      awayScore: 20,
      status: 'FINALIZED' as const,
      startedAt: '2024-01-15T10:00:00Z',
      finalizedAt: '2024-01-15T10:30:00Z',
    },
    {
      id: 'set2',
      setNumber: 2,
      homeScore: 23,
      awayScore: 25,
      status: 'FINALIZED' as const,
      startedAt: '2024-01-15T10:35:00Z',
      finalizedAt: '2024-01-15T11:00:00Z',
    },
  ],
  athletes: [],
};

const mockStatistics = {
  matchId: 'test-match-id',
  teamStatistics: {
    totalPoints: 48,
    totalErrors: 12,
    attackEfficiency: 0.45,
    serveEfficiency: 0.38,
    blockPoints: 8,
    receptionQuality: 0.72,
  },
  athleteStatistics: [
    {
      athleteId: 'athlete1',
      athleteName: 'John Doe',
      serves: { total: 10, aces: 2, errors: 1 },
      attacks: { total: 15, points: 8, errors: 2, blocked: 1 },
      blocks: { total: 5, points: 2, touches: 1 },
      receptions: { total: 12, a: 5, b: 4, c: 2, d: 1 },
      defenses: { total: 8, success: 6 },
      totalPoints: 12,
      totalErrors: 3,
    },
    {
      athleteId: 'athlete2',
      athleteName: 'Jane Smith',
      serves: { total: 8, aces: 1, errors: 0 },
      attacks: { total: 12, points: 6, errors: 1, blocked: 0 },
      blocks: { total: 3, points: 1, touches: 0 },
      receptions: { total: 10, a: 4, b: 3, c: 2, d: 1 },
      defenses: { total: 6, success: 5 },
      totalPoints: 8,
      totalErrors: 1,
    },
  ],
  setStatistics: [
    {
      setId: 'set1',
      setNumber: 1,
      homeScore: 25,
      awayScore: 20,
      duration: 1800,
      totalActions: 45,
      athleteStatistics: [
        {
          athleteId: 'athlete1',
          athleteName: 'John Doe',
          serves: { total: 5, aces: 1, errors: 0 },
          attacks: { total: 8, points: 4, errors: 1, blocked: 0 },
          blocks: { total: 3, points: 1, touches: 0 },
          receptions: { total: 6, a: 3, b: 2, c: 1, d: 0 },
          defenses: { total: 4, success: 3 },
          totalPoints: 6,
          totalErrors: 1,
        },
      ],
    },
    {
      setId: 'set2',
      setNumber: 2,
      homeScore: 23,
      awayScore: 25,
      duration: 1500,
      totalActions: 48,
      athleteStatistics: [
        {
          athleteId: 'athlete1',
          athleteName: 'John Doe',
          serves: { total: 5, aces: 1, errors: 1 },
          attacks: { total: 7, points: 4, errors: 1, blocked: 1 },
          blocks: { total: 2, points: 1, touches: 1 },
          receptions: { total: 6, a: 2, b: 2, c: 1, d: 1 },
          defenses: { total: 4, success: 3 },
          totalPoints: 6,
          totalErrors: 2,
        },
      ],
    },
  ],
};

describe('MatchFinalizePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMatch).mockResolvedValue(mockMatch);
    vi.mocked(getMatchStatistics).mockResolvedValue(mockStatistics);
  });

  it('should render loading state initially', () => {
    render(<MatchFinalizePage />);
    expect(screen.getByText(/loading match data/i)).toBeInTheDocument();
  });

  it('should display match summary after loading', async () => {
    render(<MatchFinalizePage />);

    await waitFor(() => {
      expect(screen.getByText('Match Finalization')).toBeInTheDocument();
    });

    expect(screen.getByText(/Home Team vs Away Team/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Arena/i)).toBeInTheDocument();
  });

  it('should display team statistics', async () => {
    render(<MatchFinalizePage />);

    await waitFor(() => {
      expect(screen.getByText('Team Statistics')).toBeInTheDocument();
    });

    expect(screen.getByText('48')).toBeInTheDocument(); // Total Points
    expect(screen.getByText('12')).toBeInTheDocument(); // Total Errors
  });

  it('should display athlete performance breakdown', async () => {
    render(<MatchFinalizePage />);

    await waitFor(() => {
      expect(screen.getByText('Athlete Performance Breakdown')).toBeInTheDocument();
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should display set-by-set statistics', async () => {
    render(<MatchFinalizePage />);

    await waitFor(() => {
      expect(screen.getByText('Set-by-Set Statistics')).toBeInTheDocument();
    });

    expect(screen.getByText('Set 1')).toBeInTheDocument();
    expect(screen.getByText('Set 2')).toBeInTheDocument();
  });

  it('should show finalize button when match is not finalized', async () => {
    render(<MatchFinalizePage />);

    await waitFor(() => {
      expect(screen.getByText('Finalize Match')).toBeInTheDocument();
    });
  });

  it('should show finalized badge when match is finalized', async () => {
    vi.mocked(getMatch).mockResolvedValue({
      ...mockMatch,
      status: 'FINALIZED',
    });

    render(<MatchFinalizePage />);

    await waitFor(() => {
      expect(screen.getByText('✓ Finalized')).toBeInTheDocument();
    });

    expect(screen.queryByText('Finalize Match')).not.toBeInTheDocument();
  });

  it('should call finalizeMatch when finalize button is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(finalizeMatch).mockResolvedValue({
      matchId: 'test-match-id',
      finalStatistics: mockStatistics,
    });

    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<MatchFinalizePage />);

    await waitFor(() => {
      expect(screen.getByText('Finalize Match')).toBeInTheDocument();
    });

    const finalizeButton = screen.getByText('Finalize Match');
    await user.click(finalizeButton);

    await waitFor(() => {
      expect(finalizeMatch).toHaveBeenCalledWith('test-match-id');
    });
  });

  it('should display export options', async () => {
    render(<MatchFinalizePage />);

    await waitFor(() => {
      expect(screen.getByText('Export as PDF')).toBeInTheDocument();
    });

    expect(screen.getByText('Export as Excel')).toBeInTheDocument();
    expect(screen.getByText('Export as JSON')).toBeInTheDocument();
  });

  it('should handle export when export button is clicked', async () => {
    const user = userEvent.setup();
    const mockBlob = new Blob(['test'], { type: 'application/pdf' });
    vi.mocked(exportMatchStatistics).mockResolvedValue(mockBlob);

    // Mock URL.createObjectURL and related functions
    global.URL.createObjectURL = vi.fn(() => 'blob:test');
    global.URL.revokeObjectURL = vi.fn();

    render(<MatchFinalizePage />);

    await waitFor(() => {
      expect(screen.getByText('Export as PDF')).toBeInTheDocument();
    });

    const exportButton = screen.getByText('Export as PDF');
    await user.click(exportButton);

    await waitFor(() => {
      expect(exportMatchStatistics).toHaveBeenCalledWith('test-match-id', 'pdf');
    });
  });

  it('should display error message when loading fails', async () => {
    vi.mocked(getMatch).mockRejectedValue(new Error('Failed to load match'));

    render(<MatchFinalizePage />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load match/i)).toBeInTheDocument();
    });
  });
});
