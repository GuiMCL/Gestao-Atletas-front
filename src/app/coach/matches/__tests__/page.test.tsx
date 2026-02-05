import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MatchManagementPage from '../page';
import * as authHook from '@/hooks/useAuth';
import * as matchApi from '@/lib/api/match.api';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: vi.fn(),
  }),
}));

// Mock auth hook
vi.mock('@/hooks/useAuth');

// Mock match API
vi.mock('@/lib/api/match.api');

describe('MatchManagementPage', () => {
  const mockUser = {
    id: 'user-1',
    username: 'coach1',
    email: 'coach@example.com',
    role: 'COACH' as const,
  };

  const mockMatches = [
    {
      id: 'match-1',
      date: '2024-12-10T18:00:00Z',
      location: 'Main Gym',
      homeTeam: { id: 'team-1', name: 'Home Team' },
      awayTeam: { id: 'team-2', name: 'Away Team' },
      status: 'SCHEDULED' as const,
    },
    {
      id: 'match-2',
      date: '2024-12-08T18:00:00Z',
      location: 'Court 2',
      homeTeam: { id: 'team-1', name: 'Home Team' },
      awayTeam: { id: 'team-3', name: 'Another Team' },
      status: 'IN_PROGRESS' as const,
    },
    {
      id: 'match-3',
      date: '2024-12-05T18:00:00Z',
      location: 'Arena',
      homeTeam: { id: 'team-1', name: 'Home Team' },
      awayTeam: { id: 'team-4', name: 'Past Team' },
      status: 'FINALIZED' as const,
      finalScore: '3-1',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    });

    vi.mocked(matchApi.getMatches).mockResolvedValue({
      matches: mockMatches,
      pagination: { page: 1, pageSize: 100, totalItems: 3, totalPages: 1 },
    });

    vi.mocked(matchApi.startMatch).mockResolvedValue({
      matchId: 'match-1',
      firstSetId: 'set-1',
    });
  });

  it('should render match management page with matches', async () => {
    render(<MatchManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('Match Management')).toBeInTheDocument();
    });

    // Check that all matches are displayed
    expect(screen.getByText('Home Team vs Away Team')).toBeInTheDocument();
    expect(screen.getByText('Home Team vs Another Team')).toBeInTheDocument();
    expect(screen.getByText('Home Team vs Past Team')).toBeInTheDocument();
  });

  it('should display match status indicators', async () => {
    render(<MatchManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('Scheduled')).toBeInTheDocument();
    });

    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Finalized')).toBeInTheDocument();
  });

  it('should filter matches by status', async () => {
    const user = userEvent.setup();
    render(<MatchManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('Match Management')).toBeInTheDocument();
    });

    // Click on "Scheduled" filter
    const scheduledButton = screen.getByRole('button', { name: /Scheduled/i });
    await user.click(scheduledButton);

    // Should show only scheduled matches
    await waitFor(() => {
      expect(screen.getByText('Home Team vs Away Team')).toBeInTheDocument();
      expect(screen.queryByText('Home Team vs Another Team')).not.toBeInTheDocument();
    });
  });

  it('should show start match button for scheduled matches', async () => {
    render(<MatchManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('Start Match')).toBeInTheDocument();
    });
  });

  it('should navigate to live match when start match is clicked', async () => {
    const user = userEvent.setup();
    render(<MatchManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('Start Match')).toBeInTheDocument();
    });

    const startButton = screen.getByRole('button', { name: /Start Match/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(matchApi.startMatch).toHaveBeenCalledWith('match-1');
      expect(mockPush).toHaveBeenCalledWith('/coach/matches/match-1/live');
    });
  });

  it('should show "Go to Live Match" button for in-progress matches', async () => {
    render(<MatchManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('Go to Live Match')).toBeInTheDocument();
    });
  });

  it('should navigate to live match page when clicking in-progress match', async () => {
    const user = userEvent.setup();
    render(<MatchManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('Home Team vs Another Team')).toBeInTheDocument();
    });

    // Click on the in-progress match
    const matchCard = screen.getByText('Home Team vs Another Team').closest('div');
    if (matchCard) {
      await user.click(matchCard);
    }

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/coach/matches/match-2/live');
    });
  });

  it('should show "View Report" button for finalized matches', async () => {
    render(<MatchManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('View Report')).toBeInTheDocument();
    });
  });

  it('should display final score for finalized matches', async () => {
    render(<MatchManagementPage />);

    await waitFor(() => {
      expect(screen.getByText(/Final: 3-1/i)).toBeInTheDocument();
    });
  });

  it('should show create match button', async () => {
    render(<MatchManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('Create New Match')).toBeInTheDocument();
    });
  });

  it('should navigate to create match page when create button is clicked', async () => {
    const user = userEvent.setup();
    render(<MatchManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('Create New Match')).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /Create New Match/i });
    await user.click(createButton);

    expect(mockPush).toHaveBeenCalledWith('/coach/matches/create');
  });

  it('should redirect non-coach users to dashboard', async () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: { ...mockUser, role: 'ATHLETE' },
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(<MatchManagementPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should redirect unauthenticated users to login', async () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(<MatchManagementPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});
