import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AccountPage from '../page';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: React.PropsWithChildren<{ href: string }>) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('@/store/auth.store', () => ({
  useAuthStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      user: {
        id: 'u1',
        name: 'Test User',
        email: 'test@webphim.com',
        role: 'USER',
        createdAt: '2026-01-15T00:00:00Z',
      },
    })
  ),
}));

vi.mock('@/store/profile.store', () => ({
  useProfileStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      profiles: [
        { id: 'p1', name: 'Main', avatarUrl: '#E50914', isKids: false, createdAt: '' },
        { id: 'p2', name: 'Kids', avatarUrl: '#2196F3', isKids: true, createdAt: '' },
      ],
    })
  ),
}));

const mockSetVolume = vi.fn();
const mockSetAutoPlay = vi.fn();
const mockSetSpeed = vi.fn();

vi.mock('@/store/player.store', () => ({
  usePlayerStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      volume: 0.8,
      autoPlayNextEpisode: true,
      playbackSpeed: 1,
      setVolume: mockSetVolume,
      setAutoPlayNextEpisode: mockSetAutoPlay,
      setPlaybackSpeed: mockSetSpeed,
    })
  ),
}));

const mockPut = vi.fn();
vi.mock('@/lib/api', () => ({
  default: {
    put: (...args: unknown[]) => mockPut(...args),
  },
}));

describe('AccountPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPut.mockResolvedValue({ data: { success: true } });
  });

  it('renders account page with sections', () => {
    render(<AccountPage />);
    expect(screen.getByTestId('account-page')).toBeInTheDocument();
    expect(screen.getByTestId('membership-section')).toBeInTheDocument();
    expect(screen.getByTestId('profiles-section')).toBeInTheDocument();
    expect(screen.getByTestId('playback-section')).toBeInTheDocument();
  });

  it('displays user info', () => {
    render(<AccountPage />);
    expect(screen.getByText('test@webphim.com')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('January 15, 2026')).toBeInTheDocument();
  });

  it('shows change password form when Change button clicked', () => {
    render(<AccountPage />);
    expect(screen.queryByTestId('change-password-form')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('change-password-toggle'));
    expect(screen.getByTestId('change-password-form')).toBeInTheDocument();
  });

  it('hides password form when Cancel clicked', () => {
    render(<AccountPage />);
    fireEvent.click(screen.getByTestId('change-password-toggle'));
    expect(screen.getByTestId('change-password-form')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('change-password-toggle'));
    expect(screen.queryByTestId('change-password-form')).not.toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    render(<AccountPage />);
    fireEvent.click(screen.getByTestId('change-password-toggle'));

    fireEvent.change(screen.getByTestId('current-password-input'), { target: { value: 'OldPass@1' } });
    fireEvent.change(screen.getByTestId('new-password-input'), { target: { value: 'NewPass@1' } });
    fireEvent.change(screen.getByTestId('confirm-password-input'), { target: { value: 'Different@1' } });
    fireEvent.click(screen.getByTestId('submit-password'));

    expect(screen.getByTestId('password-error')).toHaveTextContent('New passwords do not match');
  });

  it('calls API on valid password change', async () => {
    render(<AccountPage />);
    fireEvent.click(screen.getByTestId('change-password-toggle'));

    fireEvent.change(screen.getByTestId('current-password-input'), { target: { value: 'OldPass@1' } });
    fireEvent.change(screen.getByTestId('new-password-input'), { target: { value: 'NewPass@1' } });
    fireEvent.change(screen.getByTestId('confirm-password-input'), { target: { value: 'NewPass@1' } });
    fireEvent.click(screen.getByTestId('submit-password'));

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith('/auth/change-password', {
        currentPassword: 'OldPass@1',
        newPassword: 'NewPass@1',
      });
    });
  });

  it('shows success message after password change', async () => {
    render(<AccountPage />);
    fireEvent.click(screen.getByTestId('change-password-toggle'));

    fireEvent.change(screen.getByTestId('current-password-input'), { target: { value: 'OldPass@1' } });
    fireEvent.change(screen.getByTestId('new-password-input'), { target: { value: 'NewPass@1' } });
    fireEvent.change(screen.getByTestId('confirm-password-input'), { target: { value: 'NewPass@1' } });
    fireEvent.click(screen.getByTestId('submit-password'));

    await waitFor(() => {
      expect(screen.getByTestId('password-success')).toHaveTextContent('Password changed successfully');
    });
  });

  it('shows API error message on failure', async () => {
    mockPut.mockRejectedValueOnce({ response: { data: { message: 'Current password is incorrect' } } });

    render(<AccountPage />);
    fireEvent.click(screen.getByTestId('change-password-toggle'));

    fireEvent.change(screen.getByTestId('current-password-input'), { target: { value: 'Wrong@123' } });
    fireEvent.change(screen.getByTestId('new-password-input'), { target: { value: 'NewPass@1' } });
    fireEvent.change(screen.getByTestId('confirm-password-input'), { target: { value: 'NewPass@1' } });
    fireEvent.click(screen.getByTestId('submit-password'));

    await waitFor(() => {
      expect(screen.getByTestId('password-error')).toHaveTextContent('Current password is incorrect');
    });
  });

  it('renders profiles', () => {
    render(<AccountPage />);
    expect(screen.getByText('Main')).toBeInTheDocument();
    expect(screen.getByText('Kids')).toBeInTheDocument();
  });

  it('has manage profiles link', () => {
    render(<AccountPage />);
    const link = screen.getByTestId('manage-profiles-link');
    expect(link).toHaveAttribute('href', '/profiles/manage');
  });

  it('renders playback settings', () => {
    render(<AccountPage />);
    expect(screen.getByTestId('volume-slider')).toBeInTheDocument();
    expect(screen.getByTestId('autoplay-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('speed-select')).toBeInTheDocument();
  });

  it('autoplay toggle has switch role with correct checked state', () => {
    render(<AccountPage />);
    const toggle = screen.getByTestId('autoplay-toggle');
    expect(toggle).toHaveAttribute('role', 'switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('calls setAutoPlayNextEpisode when toggle clicked', () => {
    render(<AccountPage />);
    fireEvent.click(screen.getByTestId('autoplay-toggle'));
    expect(mockSetAutoPlay).toHaveBeenCalledWith(false);
  });

  it('calls setPlaybackSpeed when speed changed', () => {
    render(<AccountPage />);
    fireEvent.change(screen.getByTestId('speed-select'), { target: { value: '1.5' } });
    expect(mockSetSpeed).toHaveBeenCalledWith(1.5);
  });
});
