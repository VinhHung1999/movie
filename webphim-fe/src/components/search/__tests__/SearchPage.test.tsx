import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams('q=dark+knight');

vi.mock('next/navigation', async () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: mockReplace,
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

const mockTrending = {
  success: true,
  data: [
    {
      id: 't1',
      type: 'MOVIE',
      title: 'Popular Movie',
      description: 'Trending',
      releaseYear: 2025,
      maturityRating: 'PG',
      duration: 120,
      thumbnailUrl: '/popular.jpg',
      bannerUrl: null,
      viewCount: 5000,
      genres: [],
    },
  ],
  meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
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
  swrDataMap['/search?q=dark+knight&sort=relevance&page=1&limit=20'] = mockSearchResults;
  swrDataMap['/genres'] = mockGenres;
  swrDataMap['/content?sort=views&limit=12'] = mockTrending;

  vi.resetModules();
  const mod = await import('../../../app/(main)/search/page');
  SearchPage = mod.default;
});

describe('SearchPage (Sprint 15 Enhanced)', () => {
  it('renders search hero with large input', () => {
    render(<SearchPage />);

    expect(screen.getByTestId('search-hero')).toBeInTheDocument();
    expect(screen.getByTestId('search-hero-input')).toBeInTheDocument();
    expect(screen.getByTestId('search-hero-input')).toHaveAttribute('aria-label', 'Search titles, people, genres');
  });

  it('shows result count for query', () => {
    render(<SearchPage />);

    const count = screen.getByTestId('result-count');
    expect(count).toHaveTextContent('2 results');
    expect(count).toHaveAttribute('aria-live', 'polite');
  });

  it('renders search result cards', () => {
    render(<SearchPage />);

    expect(screen.getByAltText('The Dark Knight')).toBeInTheDocument();
    expect(screen.getByAltText('The Dark Knight Rises')).toBeInTheDocument();
  });

  it('renders filter sidebar with genres and rating filter', () => {
    render(<SearchPage />);

    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Genre')).toBeInTheDocument();
    expect(screen.getByText('Rating')).toBeInTheDocument();
    expect(screen.getByText('Sort By')).toBeInTheDocument();
  });

  it('updates URL when type filter changes', () => {
    render(<SearchPage />);

    fireEvent.click(screen.getByLabelText('Movies'));

    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining('type=MOVIE'),
    );
  });

  it('preserves query in URL when changing filters', () => {
    render(<SearchPage />);

    fireEvent.click(screen.getByLabelText('Movies'));

    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining('q=dark+knight'),
    );
  });

  it('shows loading state when data is not available', () => {
    Object.keys(swrDataMap).forEach((k) => {
      if (k.startsWith('/search?')) delete swrDataMap[k];
    });

    render(<SearchPage />);

    expect(screen.getByTestId('search-loading')).toBeInTheDocument();
  });

  it('shows empty state when no results', () => {
    swrDataMap['/search?q=dark+knight&sort=relevance&page=1&limit=20'] = {
      success: true,
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0, query: 'dark knight' },
    };

    render(<SearchPage />);

    expect(screen.getByTestId('search-empty-state')).toBeInTheDocument();
  });

  it('shows trending content when no query', () => {
    mockSearchParams = new URLSearchParams('');

    render(<SearchPage />);

    expect(screen.getByTestId('trending-section')).toBeInTheDocument();
    expect(screen.getByText('Popular on WebPhim')).toBeInTheDocument();
  });

  it('renders pagination when multiple pages', () => {
    swrDataMap['/search?q=dark+knight&sort=relevance&page=1&limit=20'] = {
      ...mockSearchResults,
      meta: { ...mockSearchResults.meta, total: 40, totalPages: 2 },
    };

    render(<SearchPage />);

    const pagination = screen.getByTestId('pagination');
    expect(pagination).toBeInTheDocument();
    expect(screen.getByText('Previous')).toBeDisabled();
    expect(screen.getByText('Next')).not.toBeDisabled();
  });

  it('shows active filter chips when filters applied', () => {
    mockSearchParams = new URLSearchParams('q=test&type=MOVIE&genre=action');
    swrDataMap['/search?q=test&type=MOVIE&genre=action&sort=relevance&page=1&limit=20'] = mockSearchResults;

    render(<SearchPage />);

    expect(screen.getByTestId('active-filters')).toBeInTheDocument();
    expect(screen.getByTestId('filter-chip-type')).toHaveTextContent('Movies');
    expect(screen.getByTestId('filter-chip-genre')).toHaveTextContent('Action');
  });

  it('shows maturity rating filter options', () => {
    render(<SearchPage />);

    expect(screen.getByLabelText('All Ratings')).toBeInTheDocument();
    expect(screen.getByLabelText('PG-13')).toBeInTheDocument();
    expect(screen.getByLabelText('R')).toBeInTheDocument();
  });

  it('shows clear button when input has text', () => {
    render(<SearchPage />);

    expect(screen.getByTestId('search-hero-clear')).toBeInTheDocument();
  });

  it('has search form with role="search"', () => {
    render(<SearchPage />);

    expect(screen.getByRole('search')).toBeInTheDocument();
  });
});
