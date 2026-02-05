import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AthleteProfile from '../page';
import * as athleteApi from '@/lib/api/athlete.api';
import * as authHook from '@/hooks/useAuth';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock athlete API
vi.mock('@/lib/api/athlete.api', () => ({
  getAthleteProfile: vi.fn(),
  updateAthleteProfile: vi.fn(),
  uploadAthletePhoto: vi.fn(),
}));

// Mock useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('AthleteProfile', () => {
  const mockUser = {
    id: 'athlete-1',
    username: 'john.doe',
    email: 'john@example.com',
    role: 'ATHLETE' as const,
  };

  const mockAthleteData = {
    athlete: {
      id: 'athlete-1',
      userId: 'user-1',
      name: 'John Doe',
      position: 'OUTSIDE_HITTER' as const,
      jerseyNumber: 10,
      teamId: 'team-1',
      photoUrl: 'https://example.com/photo.jpg',
      bio: 'Professional volleyball player',
      isActive: true,
    },
    statistics: {
      athleteId: 'athlete-1',
      totalMatches: 25,
      totalSets: 100,
      attackEfficiency: 0.45,
      serveEfficiency: 0.35,
      receptionQuality: 2.8,
      blockEfficiency: 0.25,
      totalPoints: 250,
      totalErrors: 50,
      averagePointsPerSet: 2.5,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
  });

  it('should show loading state initially', () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: mockUser,
      isLoading: true,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshAuth: vi.fn(),
    });

    const { container } = render(<AthleteProfile />);
    expect(container.textContent).toContain('Loading profile...');
  });

  it('should display athlete profile information', async () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      refreshAuth: vi.fn(),
    });

    vi.mocked(athleteApi.getAthleteProfile).mockResolvedValue(mockAthleteData);

    const { container } = render(<AthleteProfile />);

    await waitFor(() => {
      expect(container.textContent).toContain('John Doe');
    });

    expect(container.textContent).toContain('Outside Hitter');
    expect(container.textContent).toContain('#10');
    expect(container.textContent).toContain('Professional volleyball player');
  });

  it('should display career statistics', async () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      refreshAuth: vi.fn(),
    });

    vi.mocked(athleteApi.getAthleteProfile).mockResolvedValue(mockAthleteData);

    const { container } = render(<AthleteProfile />);

    await waitFor(() => {
      expect(container.textContent).toContain('Career Statistics');
    });

    expect(container.textContent).toContain('25'); // Total matches
    expect(container.textContent).toContain('100'); // Total sets
    expect(container.textContent).toContain('250'); // Total points
    expect(container.textContent).toContain('45.0%'); // Attack efficiency
    expect(container.textContent).toContain('35.0%'); // Serve efficiency
  });

  it('should enable edit mode when Edit Profile is clicked', async () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      refreshAuth: vi.fn(),
    });

    vi.mocked(athleteApi.getAthleteProfile).mockResolvedValue(mockAthleteData);

    render(<AthleteProfile />);

    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeDefined();
    });

    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('Save Changes')).toBeDefined();
    });

    expect(screen.getByText('Cancel')).toBeDefined();
  });

  it('should handle profile update', async () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      refreshAuth: vi.fn(),
    });

    vi.mocked(athleteApi.getAthleteProfile).mockResolvedValue(mockAthleteData);
    vi.mocked(athleteApi.updateAthleteProfile).mockResolvedValue({
      ...mockAthleteData.athlete,
      name: 'Jane Doe',
    });

    render(<AthleteProfile />);

    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeDefined();
    });

    // Click edit button
    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('Save Changes')).toBeDefined();
    });

    // Update name
    const nameInput = screen.getByLabelText('Full Name') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

    // Click save
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(athleteApi.updateAthleteProfile).toHaveBeenCalledWith(
        'athlete-1',
        expect.objectContaining({
          name: 'Jane Doe',
        })
      );
    });
  });

  it('should redirect to login if not authenticated', () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshAuth: vi.fn(),
    });

    render(<AthleteProfile />);

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('should redirect non-athletes to home', () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: { ...mockUser, role: 'COACH' as const },
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      refreshAuth: vi.fn(),
    });

    render(<AthleteProfile />);

    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('should handle error state', async () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      refreshAuth: vi.fn(),
    });

    vi.mocked(athleteApi.getAthleteProfile).mockRejectedValue(
      new Error('Failed to fetch')
    );

    const { container } = render(<AthleteProfile />);

    await waitFor(() => {
      expect(container.textContent).toContain('Failed to load profile data');
    });

    expect(container.textContent).toContain('Retry');
  });
});
