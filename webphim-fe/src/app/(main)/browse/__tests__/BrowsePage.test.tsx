import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/navigation', async () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/browse',
  useSearchParams: () => new URLSearchParams(),
}));

const mockGenres = {
  success: true,
  data: [
    { id: 'g1', name: 'Action', slug: 'action', contentCount: 15 },
    { id: 'g2', name: 'Drama', slug: 'drama', contentCount: 25 },
    { id: 'g3', name: 'Comedy', slug: 'comedy', contentCount: 8 },
  ],
};

const swrDataMap: Record<string, unknown> = {};

vi.mock('swr', () => ({
  default: (key: string | null) => {
    if (!key) return { data: undefined, error: undefined, isLoading: false };
    const data = swrDataMap[key];
    return {
      data,
      error: undefined,
      isLoading: !data,
      mutate: vi.fn(),
    };
  },
  SWRConfig: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

let BrowsePage: React.ComponentType;

beforeEach(async () => {
  vi.clearAllMocks();
  Object.keys(swrDataMap).forEach((k) => delete swrDataMap[k]);
  swrDataMap['/genres'] = mockGenres;

  vi.resetModules();
  const mod = await import('../page');
  BrowsePage = mod.default;
});

describe('BrowsePage (Task 15.2)', () => {
  it('renders page title', () => {
    render(<BrowsePage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Browse by Category');
  });

  it('renders genre cards with names and counts', () => {
    render(<BrowsePage />);

    expect(screen.getByTestId('genre-grid')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('15 titles')).toBeInTheDocument();
    expect(screen.getByText('Drama')).toBeInTheDocument();
    expect(screen.getByText('25 titles')).toBeInTheDocument();
    expect(screen.getByText('Comedy')).toBeInTheDocument();
    expect(screen.getByText('8 titles')).toBeInTheDocument();
  });

  it('genre cards link to /browse/[slug]', () => {
    render(<BrowsePage />);

    const actionCard = screen.getByTestId('genre-card-action');
    expect(actionCard).toHaveAttribute('href', '/browse/action');
    const dramaCard = screen.getByTestId('genre-card-drama');
    expect(dramaCard).toHaveAttribute('href', '/browse/drama');
  });

  it('shows loading state', () => {
    Object.keys(swrDataMap).forEach((k) => delete swrDataMap[k]);

    render(<BrowsePage />);

    expect(screen.getByTestId('browse-loading')).toBeInTheDocument();
  });

  it('shows empty state when no genres', () => {
    swrDataMap['/genres'] = { success: true, data: [] };

    render(<BrowsePage />);

    expect(screen.getByTestId('browse-empty')).toBeInTheDocument();
  });

  it('shows singular "title" for count of 1', () => {
    swrDataMap['/genres'] = {
      success: true,
      data: [{ id: 'g1', name: 'Horror', slug: 'horror', contentCount: 1 }],
    };

    render(<BrowsePage />);

    expect(screen.getByText('1 title')).toBeInTheDocument();
  });
});
