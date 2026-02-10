import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SWRConfig } from 'swr';
import MyListPage from '../page';
import type { WatchlistItem } from '@/types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/browse/my-list',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div data-testid={props['data-testid'] as string}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

const mockWatchlistItems: WatchlistItem[] = [
  {
    contentId: 'c-1',
    addedAt: '2026-02-09T10:00:00Z',
    content: {
      id: 'c-1',
      type: 'MOVIE',
      title: 'Inception',
      description: 'A thief who steals...',
      releaseYear: 2010,
      maturityRating: 'PG13',
      duration: 148,
      thumbnailUrl: '/uploads/hls/abc/thumb.jpg',
      bannerUrl: null,
      viewCount: 15420,
      genres: [{ id: 'g-1', name: 'Action', slug: 'action' }],
    },
  },
  {
    contentId: 'c-2',
    addedAt: '2026-02-09T09:00:00Z',
    content: {
      id: 'c-2',
      type: 'SERIES',
      title: 'Breaking Bad',
      description: 'A teacher turned...',
      releaseYear: 2008,
      maturityRating: 'R',
      duration: null,
      thumbnailUrl: null,
      bannerUrl: null,
      viewCount: 30000,
      genres: [{ id: 'g-2', name: 'Drama', slug: 'drama' }],
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
          (() =>
            Promise.resolve({
              success: true,
              data: mockWatchlistItems,
              meta: { page: 1, limit: 40, total: 2, totalPages: 1 },
            })),
        dedupingInterval: 0,
      }}
    >
      {ui}
    </SWRConfig>,
  );
}

describe('MyListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "My List" heading', async () => {
    renderWithSWR(<MyListPage />);

    expect(screen.getByText('My List')).toBeInTheDocument();
  });

  it('renders content grid with watchlist items', async () => {
    renderWithSWR(<MyListPage />);

    const card = await screen.findByAltText('Inception');
    expect(card).toBeInTheDocument();
  });

  it('renders empty state when watchlist is empty', async () => {
    renderWithSWR(
      <MyListPage />,
      () => Promise.resolve({ success: true, data: [], meta: { page: 1, limit: 40, total: 0, totalPages: 0 } }),
    );

    const empty = await screen.findByTestId('mylist-empty');
    expect(empty).toHaveTextContent('Your list is empty');
  });

  it('empty state has role="status" for accessibility', async () => {
    renderWithSWR(
      <MyListPage />,
      () => Promise.resolve({ success: true, data: [], meta: { page: 1, limit: 40, total: 0, totalPages: 0 } }),
    );

    const empty = await screen.findByTestId('mylist-empty');
    expect(empty).toHaveAttribute('role', 'status');
  });
});
