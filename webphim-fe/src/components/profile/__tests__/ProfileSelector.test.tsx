import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SWRConfig } from 'swr';
import ProfileSelector from '../ProfileSelector';
import type { Profile } from '@/types';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/profiles',
}));

const mockSetActiveProfile = vi.fn();
vi.mock('@/store/profile.store', () => ({
  useProfileStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ setActiveProfile: mockSetActiveProfile, activeProfile: null, clearProfile: vi.fn() }),
}));

const mockProfiles: Profile[] = [
  { id: 'p-1', name: 'Boss', avatarUrl: null, isKids: false, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'p-2', name: 'Kids', avatarUrl: null, isKids: true, createdAt: '2026-01-01T00:00:00Z' },
];

function renderWithSWR(
  ui: React.ReactElement,
  fetcher?: (key: string) => unknown,
) {
  return render(
    <SWRConfig
      value={{
        provider: () => new Map(),
        fetcher: fetcher ?? (() => Promise.resolve({ success: true, data: mockProfiles })),
        dedupingInterval: 0,
      }}
    >
      {ui}
    </SWRConfig>,
  );
}

describe('ProfileSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Who\'s watching?" heading', async () => {
    renderWithSWR(<ProfileSelector />);
    expect(await screen.findByText("Who's watching?")).toBeInTheDocument();
  });

  it('renders profile cards for each profile', async () => {
    renderWithSWR(<ProfileSelector />);

    await screen.findByTestId('profile-card-p-1');
    expect(screen.getByTestId('profile-card-p-1')).toBeInTheDocument();
    expect(screen.getByTestId('profile-card-p-2')).toBeInTheDocument();
  });

  it('renders Add Profile button when under 5 profiles', async () => {
    renderWithSWR(<ProfileSelector />);

    const addButton = await screen.findByTestId('add-profile-button');
    expect(addButton).toBeInTheDocument();
  });

  it('hides Add Profile button when 5 profiles exist', async () => {
    const fiveProfiles = Array.from({ length: 5 }, (_, i) => ({
      id: `p-${i}`,
      name: `Profile ${i}`,
      avatarUrl: null,
      isKids: false,
      createdAt: '2026-01-01T00:00:00Z',
    }));
    renderWithSWR(
      <ProfileSelector />,
      () => Promise.resolve({ success: true, data: fiveProfiles }),
    );

    await screen.findByTestId('profile-card-p-0');
    expect(screen.queryByTestId('add-profile-button')).not.toBeInTheDocument();
  });

  it('sets active profile and navigates to /home on card click', async () => {
    renderWithSWR(<ProfileSelector />);

    const card = await screen.findByTestId('profile-card-p-1');
    fireEvent.click(card);

    expect(mockSetActiveProfile).toHaveBeenCalledWith(mockProfiles[0]);
    expect(mockPush).toHaveBeenCalledWith('/home');
  });

  it('renders Manage Profiles button', async () => {
    renderWithSWR(<ProfileSelector />);

    const manageBtn = await screen.findByTestId('manage-profiles-button');
    expect(manageBtn).toBeInTheDocument();

    fireEvent.click(manageBtn);
    expect(mockPush).toHaveBeenCalledWith('/profiles/manage');
  });

  it('profile cards have correct aria-labels', async () => {
    renderWithSWR(<ProfileSelector />);

    const card = await screen.findByTestId('profile-card-p-1');
    expect(card).toHaveAttribute('aria-label', 'Switch to Boss profile');
  });

  it('profile card shows initial letter when no avatar', async () => {
    renderWithSWR(<ProfileSelector />);

    await screen.findByTestId('profile-card-p-1');
    expect(screen.getByText('B')).toBeInTheDocument(); // Boss initial
    expect(screen.getByText('K')).toBeInTheDocument(); // Kids initial
  });
});
