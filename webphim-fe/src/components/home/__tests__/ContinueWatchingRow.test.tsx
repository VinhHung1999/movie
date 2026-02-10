import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SWRConfig } from 'swr';
import ContinueWatchingRow from '../ContinueWatchingRow';
import type { ContinueWatchingItem } from '@/types';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div data-testid={props['data-testid'] as string}>{children}</div>
    ),
  },
  useMotionValue: () => ({
    get: () => 0,
    set: vi.fn(),
    on: () => vi.fn(),
  }),
}));

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/home',
}));

const mockItems: ContinueWatchingItem[] = [
  {
    id: 'wh-1',
    contentId: 'c-1',
    episodeId: null,
    progress: 3600,
    duration: 8880,
    progressPercent: 41,
    updatedAt: '2026-02-09T10:00:00Z',
    content: {
      id: 'c-1',
      title: 'Action Blazes',
      type: 'MOVIE',
      thumbnailUrl: '/uploads/hls/abc/thumb_001.jpg',
      maturityRating: 'R',
    },
  },
  {
    id: 'wh-2',
    contentId: 'c-2',
    episodeId: 'ep-1',
    progress: 1200,
    duration: 3600,
    progressPercent: 33,
    updatedAt: '2026-02-09T09:00:00Z',
    content: {
      id: 'c-2',
      title: 'Drama Series',
      type: 'SERIES',
      thumbnailUrl: null,
      maturityRating: 'PG13',
    },
  },
];

function renderWithSWR(
  ui: React.ReactElement,
  fetcher?: (key: string) => unknown,
) {
  return render(
    <SWRConfig
      value={{
        provider: () => new Map(),
        fetcher:
          fetcher ??
          (() => Promise.resolve({ success: true, data: mockItems })),
        dedupingInterval: 0,
      }}
    >
      {ui}
    </SWRConfig>,
  );
}

describe('ContinueWatchingRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when no items', async () => {
    renderWithSWR(
      <ContinueWatchingRow />,
      () => Promise.resolve({ success: true, data: [] }),
    );

    // Wait a tick for SWR to resolve
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByTestId('continue-watching-row')).not.toBeInTheDocument();
  });

  it('renders "Continue Watching" title with items', async () => {
    renderWithSWR(<ContinueWatchingRow />);

    const title = await screen.findByText('Continue Watching');
    expect(title).toBeInTheDocument();
  });

  it('renders cards for each continue watching item', async () => {
    renderWithSWR(<ContinueWatchingRow />);

    await screen.findByTestId('continue-watching-row');
    expect(screen.getByTestId('continue-watching-c-1')).toBeInTheDocument();
    expect(screen.getByTestId('continue-watching-c-2')).toBeInTheDocument();
  });

  it('renders thumbnail with SERVER_BASE prefix', async () => {
    renderWithSWR(<ContinueWatchingRow />);

    await screen.findByTestId('continue-watching-row');
    const img = screen.getByAltText('Action Blazes');
    expect(img).toHaveAttribute(
      'src',
      'http://localhost:5001/uploads/hls/abc/thumb_001.jpg',
    );
  });

  it('renders fallback text when no thumbnail', async () => {
    renderWithSWR(<ContinueWatchingRow />);

    await screen.findByTestId('continue-watching-row');
    // The card for Drama Series has no thumbnail, should show text fallback
    const card = screen.getByTestId('continue-watching-c-2');
    expect(card).toHaveTextContent('Drama Series');
  });

  it('renders progress bars with correct percentage', async () => {
    renderWithSWR(<ContinueWatchingRow />);

    await screen.findByTestId('continue-watching-row');
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars).toHaveLength(2);

    expect(progressBars[0]).toHaveAttribute('aria-valuenow', '41');
    expect(progressBars[0]).toHaveAttribute('aria-label', 'Watch progress: 41%');
    expect(progressBars[1]).toHaveAttribute('aria-valuenow', '33');
  });

  it('navigates to /watch/:contentId on card click', async () => {
    renderWithSWR(<ContinueWatchingRow />);

    await screen.findByTestId('continue-watching-row');
    fireEvent.click(screen.getByTestId('continue-watching-c-1'));

    expect(mockPush).toHaveBeenCalledWith('/watch/c-1');
  });

  it('has correct accessibility attributes on progress bars', async () => {
    renderWithSWR(<ContinueWatchingRow />);

    await screen.findByTestId('continue-watching-row');
    const progressBars = screen.getAllByRole('progressbar');

    expect(progressBars[0]).toHaveAttribute('aria-valuemin', '0');
    expect(progressBars[0]).toHaveAttribute('aria-valuemax', '100');
  });
});
