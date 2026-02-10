import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SWRConfig } from 'swr';

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams('q=dark+knight');

vi.mock('next/navigation', async () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/search',
  useSearchParams: () => mockSearchParams,
}));

// Mock framer-motion for MovieCard
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

const mockSearchResults = {
  success: true,
  data: [
    {
      id: '1',
      type: 'MOVIE',
      title: 'The Dark Knight',
      description: 'A hero fights crime',
      releaseYear: 2008,
      maturityRating: 'PG13',
      duration: 152,
      thumbnailUrl: '/thumb1.jpg',
      bannerUrl: null,
      viewCount: 2500,
      genres: [{ id: 'g1', name: 'Action', slug: 'action' }],
    },
    {
      id: '2',
      type: 'MOVIE',
      title: 'The Dark Knight Rises',
      description: 'The final chapter',
      releaseYear: 2012,
      maturityRating: 'PG13',
      duration: 165,
      thumbnailUrl: '/thumb2.jpg',
      bannerUrl: null,
      viewCount: 2000,
      genres: [{ id: 'g1', name: 'Action', slug: 'action' }],
    },
  ],
  meta: {
    page: 1,
    limit: 20,
    total: 2,
    totalPages: 1,
    query: 'dark knight',
  },
};

const mockGenres = {
  success: true,
  data: [
    { id: 'g1', name: 'Action', slug: 'action', contentCount: 10 },
    { id: 'g2', name: 'Drama', slug: 'drama', contentCount: 20 },
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

let SearchPage: React.ComponentType;

beforeEach(async () => {
  vi.clearAllMocks();
  mockSearchParams = new URLSearchParams('q=dark+knight');
  Object.keys(swrDataMap).forEach((k) => delete swrDataMap[k]);

  // Set default SWR data
  swrDataMap['/search?q=dark%20knight&sort=relevance&page=1&limit=20'] = mockSearchResults;
  swrDataMap['/genres'] = mockGenres;

  vi.resetModules();
  const mod = await import('../../../app/(main)/search/page');
  SearchPage = mod.default;
});

describe('SearchPage (Task 9.5)', () => {
  it('renders search results heading with query', () => {
    render(<SearchPage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      "Search Results for 'dark knight'",
    );
  });

  it('shows result count', () => {
    render(<SearchPage />);

    const count = screen.getByTestId('result-count');
    expect(count).toHaveTextContent('2 results found');
    expect(count).toHaveAttribute('aria-live', 'polite');
  });

  it('renders search result cards', () => {
    render(<SearchPage />);

    expect(screen.getByAltText('The Dark Knight')).toBeInTheDocument();
    expect(screen.getByAltText('The Dark Knight Rises')).toBeInTheDocument();
  });

  it('renders filter sidebar with genres', () => {
    render(<SearchPage />);

    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Genre')).toBeInTheDocument();
    expect(screen.getByText('Sort By')).toBeInTheDocument();
  });

  it('updates URL when filter changes', () => {
    render(<SearchPage />);

    // Click Movies type filter
    fireEvent.click(screen.getByLabelText('Movies'));

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('type=MOVIE'),
    );
  });

  it('preserves query in URL when changing filters', () => {
    render(<SearchPage />);

    fireEvent.click(screen.getByLabelText('Movies'));

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('q=dark+knight'),
    );
  });

  it('shows loading state when data is not available', () => {
    // Remove search data to trigger loading
    Object.keys(swrDataMap).forEach((k) => {
      if (k.startsWith('/search?')) delete swrDataMap[k];
    });

    render(<SearchPage />);

    expect(screen.getByTestId('search-loading')).toBeInTheDocument();
  });

  it('shows empty state when no results', () => {
    swrDataMap['/search?q=dark%20knight&sort=relevance&page=1&limit=20'] = {
      success: true,
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0, query: 'dark knight' },
    };

    render(<SearchPage />);

    expect(screen.getByTestId('search-empty-state')).toBeInTheDocument();
  });

  it('shows prompt when no query provided', () => {
    mockSearchParams = new URLSearchParams('');

    render(<SearchPage />);

    expect(screen.getByText('Enter a search term to find movies and series.')).toBeInTheDocument();
  });

  it('renders pagination when multiple pages', () => {
    swrDataMap['/search?q=dark%20knight&sort=relevance&page=1&limit=20'] = {
      ...mockSearchResults,
      meta: { ...mockSearchResults.meta, total: 40, totalPages: 2 },
    };

    render(<SearchPage />);

    const pagination = screen.getByTestId('pagination');
    expect(pagination).toBeInTheDocument();
    expect(screen.getByText('Previous')).toBeDisabled();
    expect(screen.getByText('Next')).not.toBeDisabled();
  });
});
