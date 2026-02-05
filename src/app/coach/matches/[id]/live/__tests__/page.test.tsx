import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import LiveMatchPage from '../page';
import * as authHook from '@/hooks/useAuth';
import * as wsHook from '@/hooks/useWebSocket';
import * as matchApi from '@/lib/api/match.api';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
  useParams: () => ({
    id: 'test-match-id',
  }),
}));

// Mock hooks
vi.mock('@/hooks/useAuth');
vi.mock('@/hooks/useWebSocket');

// Mock API
vi.mock('@/lib/api/match.api');

const mockMatch = {
  id: 'test-match-id',
  date: '2024-01-15T10:00:00Z',
  location: 'Test Arena',
  homeTeam: { id: 'team-1', name: 'Home Team' },
  awayTeam: { id: 'team-2', name: 'Away Team' },
  status: 'IN_PROGRESS' as const,
  sets: [
    {
      id: 'set-1',
      setNumber: 1,
      homeScore: 15,
      awayScore: 12,
      status: 'IN_PROGRESS' as const,
      startedAt: '2024-01-15T10:00:00Z',
    },
  ],
  athletes: [
    {
      id: 'athlete-1',
      userId: 'user-1',
      name: 'John Doe',
      position: 'SETTER' as const,
      jerseyNumber: 1,
      teamId: 'team-1',
      isActive: true,
    },
    {
      id: 'athlete-2',
      userId: 'user-2',
      name: 'Jane Smith',
      position: 'OUTSIDE_HITTER' as const,
      jerseyNumber: 5,
      teamId: 'team-1',
      isActive: true,
    },
  ],
};

const mockLiveStats = {
  currentSet: mockMatch.sets[0],
  currentSetStatistics: {
    setId: 'set-1',
    setNumber: 1,
    homeScore: 15,
    awayScore: 12,
    duration: 600,
    totalActions: 45,
    athleteStatistics: [
      {
        athleteId: 'athlete-1',
        athleteName: 'John Doe',
        serves: { total: 5, aces: 1, errors: 0 },
        attacks: { total: 8, points: 4, errors: 1, blocked: 1 },
        blocks: { total: 2, points: 1, touches: 1 },
        receptions: { total: 3, a: 2, b: 1, c: 0, d: 0 },
        defenses: { total: 4, success: 3 },
        totalPoints: 6,
        totalErrors: 1,
      },
    ],
  },
  matchStatistics: {
    matchId: 'test-match-id',
    teamStatistics: {
      totalPoints: 15,
      totalErrors: 5,
      attackEfficiency: 0.45,
      serveEfficiency: 0.35,
      blockPoints: 3,
      receptionQuality: 2.5,
    },
    athleteStatistics: [],
    setStatistics: [],
  },
};

describe('LiveMatchPage - Action Registration', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock auth
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: { id: 'user-1', username: 'coach', email: 'coach@test.com', role: 'COACH', createdAt: '' },
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      refreshToken: vi.fn(),
    });

    // Mock WebSocket
    vi.mocked(wsHook.useWebSocket).mockReturnValue({
      socket: null,
      isConnected: true,
      error: null,
      on: vi.fn(),
      off: vi.fn(),
    });

    // Mock API calls
    vi.mocked(matchApi.getMatch).mockResolvedValue(mockMatch);
    vi.mocked(matchApi.getLiveStatistics).mockResolvedValue(mockLiveStats);
    vi.mocked(matchApi.getMatchSets).mockResolvedValue({ sets: mockMatch.sets });
    vi.mocked(matchApi.registerAction).mockResolvedValue({
      actionId: 'action-1',
      updatedStatistics: mockLiveStats,
    });
  });

  it('renders action buttons for all action types', async () => {
    render(<LiveMatchPage />);

    await waitFor(() => {
      expect(screen.getByText('Serve')).toBeInTheDocument();
    });

    // Verify all main action buttons are present
    expect(screen.getByText('Serve')).toBeInTheDocument();
    expect(screen.getByText('Attack')).toBeInTheDocument();
    expect(screen.getByText('Block')).toBeInTheDocument();
    expect(screen.getByText('Reception')).toBeInTheDocument();
    expect(screen.getByText('Defense')).toBeInTheDocument();
    expect(screen.getByText('Set')).toBeInTheDocument();
    expect(screen.getByText('Fault')).toBeInTheDocument();
    expect(screen.getByText('Substitution')).toBeInTheDocument();
  });

  it('displays current set score', async () => {
    render(<LiveMatchPage />);

    await waitFor(() => {
      expect(screen.getByText('15 - 12')).toBeInTheDocument();
    });
  });

  it('shows active athletes', async () => {
    render(<LiveMatchPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('opens athlete selection modal when action button is clicked', async () => {
    render(<LiveMatchPage />);

    await waitFor(() => {
      expect(screen.getByText('Serve')).toBeInTheDocument();
    });

    const serveButton = screen.getByText('Serve');
    fireEvent.click(serveButton);

    await waitFor(() => {
      expect(screen.getByText('Select Athlete for Serve')).toBeInTheDocument();
    });
  });

  it('opens result selection modal after athlete is selected', async () => {
    render(<LiveMatchPage />);

    await waitFor(() => {
      expect(screen.getByText('Serve')).toBeInTheDocument();
    });

    // Click serve button
    const serveButton = screen.getByText('Serve');
    fireEvent.click(serveButton);

    await waitFor(() => {
      expect(screen.getByText('Select Athlete for Serve')).toBeInTheDocument();
    });

    // Select athlete
    const athleteButtons = screen.getAllByText('John Doe');
    fireEvent.click(athleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Serve Result')).toBeInTheDocument();
    });

    // Verify result options
    expect(screen.getByText('Ace')).toBeInTheDocument();
    expect(screen.getByText('In Play')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('registers action when result is selected', async () => {
    render(<LiveMatchPage />);

    await waitFor(() => {
      expect(screen.getByText('Serve')).toBeInTheDocument();
    });

    // Click serve button
    fireEvent.click(screen.getByText('Serve'));

    await waitFor(() => {
      expect(screen.getByText('Select Athlete for Serve')).toBeInTheDocument();
    });

    // Select athlete
    const athleteButtons = screen.getAllByText('John Doe');
    fireEvent.click(athleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Ace')).toBeInTheDocument();
    });

    // Select result
    fireEvent.click(screen.getByText('Ace'));

    await waitFor(() => {
      expect(matchApi.registerAction).toHaveBeenCalledWith('test-match-id', {
        setId: 'set-1',
        athleteId: 'athlete-1',
        actionType: 'SERVE',
        result: 'ACE',
      });
    });
  });

  it('displays live statistics', async () => {
    render(<LiveMatchPage />);

    await waitFor(() => {
      expect(screen.getByText('Live Statistics')).toBeInTheDocument();
    });

    expect(screen.getByText('45')).toBeInTheDocument(); // Total actions
    expect(screen.getByText('10m')).toBeInTheDocument(); // Duration
  });

  it('shows WebSocket connection status', async () => {
    render(<LiveMatchPage />);

    await waitFor(() => {
      expect(screen.getByText('🟢 Live')).toBeInTheDocument();
    });
  });

  it('opens substitution modal when substitution button is clicked', async () => {
    render(<LiveMatchPage />);

    await waitFor(() => {
      expect(screen.getByText('Substitution')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Substitution'));

    await waitFor(() => {
      expect(screen.getByText('Player Substitution')).toBeInTheDocument();
    });

    expect(screen.getByText('Player Out (leaving court)')).toBeInTheDocument();
    expect(screen.getByText('Player In (entering court)')).toBeInTheDocument();
  });
});

describe('LiveMatchPage - Set Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock auth
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: { id: 'user-1', username: 'coach', email: 'coach@test.com', role: 'COACH', createdAt: '' },
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      refreshToken: vi.fn(),
    });

    // Mock WebSocket
    vi.mocked(wsHook.useWebSocket).mockReturnValue({
      socket: null,
      isConnected: true,
      error: null,
      on: vi.fn(),
      off: vi.fn(),
    });

    // Mock API calls
    vi.mocked(matchApi.getMatch).mockResolvedValue(mockMatch);
    vi.mocked(matchApi.getLiveStatistics).mockResolvedValue(mockLiveStats);
    vi.mocked(matchApi.getMatchSets).mockResolvedValue({ sets: mockMatch.sets });
  });

  it('displays manage sets button', async () => {
    render(<LiveMatchPage />);

    await waitFor(() => {
      expect(screen.getByText('Manage Sets')).toBeInTheDocument();
    });
  });

  it('opens set management modal when manage sets button is clicked', async () => {
    render(<LiveMatchPage />);

    await waitFor(() => {
      expect(screen.getByText('Manage Sets')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Manage Sets'));

    await waitFor(() => {
      expect(screen.getByText('Set Management')).toBeInTheDocument();
    });
  });

  it('displays current set information in set management modal', async () => {
    render(<LiveMatchPage />);

    await waitFor(() => {
      expect(screen.getByText('Manage Sets')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Manage Sets'));

    await waitFor(() => {
      expect(screen.getByText('Current Set')).toBeInTheDocument();
    });

    expect(screen.getByText('Set Number')).toBeInTheDocument();
    expect(screen.getByText('Score')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('displays finalize set button for active set', async () => {
    render(<LiveMatchPage />);

    await waitFor(() => {
      expect(screen.getByText('Manage Sets')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Manage Sets'));

    await waitFor(() => {
      expect(screen.getByText('Finalize Current Set')).toBeInTheDocument();
    });
  });

  it('displays set history', async () => {
    const matchWithMultipleSets = {
      ...mockMatch,
      sets: [
        {
          id: 'set-1',
          setNumber: 1,
          homeScore: 25,
          awayScore: 20,
          status: 'FINALIZED' as const,
          startedAt: '2024-01-15T10:00:00Z',
          finalizedAt: '2024-01-15T10:30:00Z',
        },
        {
          id: 'set-2',
          setNumber: 2,
          homeScore: 15,
          awayScore: 12,
          status: 'IN_PROGRESS' as const,
          startedAt: '2024-01-15T10:35:00Z',
        },
      ],
    };

    vi.mocked(matchApi.getMatch).mockResolvedValue(matchWithMultipleSets);
    vi.mocked(matchApi.getMatchSets).mockResolvedValue({ sets: matchWithMultipleSets.sets });

    render(<LiveMatchPage />);

    await waitFor(() => {
      expect(screen.getByText('Manage Sets')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Manage Sets'));

    await waitFor(() => {
      expect(screen.getByText('Set History')).toBeInTheDocument();
    });

    expect(screen.getByText('Set 1')).toBeInTheDocument();
    expect(screen.getByText('Set 2')).toBeInTheDocument();
  });

  it('calls finalizeSet API when finalize button is clicked', async () => {
    vi.mocked(matchApi.finalizeSet).mockResolvedValue({
      setId: 'set-1',
      statistics: {},
    });

    render(<LiveMatchPage />);

    await waitFor(() => {
      expect(screen.getByText('Manage Sets')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Manage Sets'));

    await waitFor(() => {
      expect(screen.getByText('Finalize Current Set')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Finalize Current Set'));

    await waitFor(() => {
      expect(matchApi.finalizeSet).toHaveBeenCalledWith('set-1');
    });
  });

  it('displays create new set button when no active set', async () => {
    const matchWithFinalizedSet = {
      ...mockMatch,
      sets: [
        {
          id: 'set-1',
          setNumber: 1,
          homeScore: 25,
          awayScore: 20,
          status: 'FINALIZED' as const,
          startedAt: '2024-01-15T10:00:00Z',
          finalizedAt: '2024-01-15T10:30:00Z',
        },
      ],
    };

    vi.mocked(matchApi.getMatch).mockResolvedValue(matchWithFinalizedSet);
    vi.mocked(matchApi.getMatchSets).mockResolvedValue({ sets: matchWithFinalizedSet.sets });

    render(<LiveMatchPage />);

    await waitFor(() => {
      expect(screen.getByText('Manage Sets')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Manage Sets'));

    await waitFor(() => {
      expect(screen.getByText('Create New Set')).toBeInTheDocument();
    });
  });

  it('calls createSet API when create new set button is clicked', async () => {
    const matchWithFinalizedSet = {
      ...mockMatch,
      sets: [
        {
          id: 'set-1',
          setNumber: 1,
          homeScore: 25,
          awayScore: 20,
          status: 'FINALIZED' as const,
          startedAt: '2024-01-15T10:00:00Z',
          finalizedAt: '2024-01-15T10:30:00Z',
        },
      ],
    };

    vi.mocked(matchApi.getMatch).mockResolvedValue(matchWithFinalizedSet);
    vi.mocked(matchApi.getMatchSets).mockResolvedValue({ sets: matchWithFinalizedSet.sets });
    vi.mocked(matchApi.createSet).mockResolvedValue({
      setId: 'set-2',
      set: {
        id: 'set-2',
        setNumber: 2,
        homeScore: 0,
        awayScore: 0,
        status: 'IN_PROGRESS',
        startedAt: new Date().toISOString(),
      },
    });

    render(<LiveMatchPage />);

    await waitFor(() => {
      expect(screen.getByText('Manage Sets')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Manage Sets'));

    await waitFor(() => {
      expect(screen.getByText('Create New Set')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Create New Set'));

    await waitFor(() => {
      expect(matchApi.createSet).toHaveBeenCalledWith('test-match-id');
    });
  });
});
