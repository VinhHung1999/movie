import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SWRConfig } from 'swr';
import SimilarTitles from '../SimilarTitles';
import { ContentSummary } from '@/types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

const mockSimilar: ContentSummary[] = [
  {
    id: 's1',
    type: 'MOVIE',
    title: 'Similar Movie 1',
    description: 'Desc 1',
    releaseYear: 2024,
    maturityRating: 'PG13',
    duration: 110,
    thumbnailUrl: '/images/s1.jpg',
    bannerUrl: null,
    viewCount: 500,
    genres: [{ id: 'g1', name: 'Action', slug: 'action' }],
  },
  {
    id: 's2',
    type: 'MOVIE',
    title: 'Similar Movie 2',
    description: 'Desc 2',
    releaseYear: 2023,
    maturityRating: 'R',
    duration: 95,
    thumbnailUrl: null,
    bannerUrl: null,
    viewCount: 300,
    genres: [{ id: 'g2', name: 'Drama', slug: 'drama' }],
  },
];

function renderWithSWR(fetcher: (key: string) => unknown) {
  return render(
    <SWRConfig value={{ provider: () => new Map(), fetcher, dedupingInterval: 0 }}>
      <SimilarTitles contentId="test-id" />
    </SWRConfig>
  );
}

describe('SimilarTitles', () => {
  it('shows loading skeletons while fetching', () => {
    renderWithSWR(() => new Promise(() => {}));
    expect(screen.getByTestId('similar-titles-loading')).toBeInTheDocument();
    expect(screen.getByText('More Like This')).toBeInTheDocument();
  });

  it('renders similar movies when data is loaded', async () => {
    renderWithSWR(() => Promise.resolve({ success: true, data: mockSimilar }));
    expect(await screen.findByTestId('movie-card-s1')).toBeInTheDocument();
    expect(screen.getByTestId('movie-card-s2')).toBeInTheDocument();
    expect(screen.getByTestId('similar-titles')).toBeInTheDocument();
  });

  it('renders nothing when no similar content exists', async () => {
    const { container } = renderWithSWR(() => Promise.resolve({ success: true, data: [] }));
    await vi.waitFor(() => {
      expect(container.querySelector('[data-testid="similar-titles-loading"]')).not.toBeInTheDocument();
    });
    expect(screen.queryByTestId('similar-titles')).not.toBeInTheDocument();
  });

  it('renders MovieCard in compact mode', async () => {
    renderWithSWR(() => Promise.resolve({ success: true, data: mockSimilar }));
    const card = await screen.findByTestId('movie-card-s1');
    expect(card).toBeInTheDocument();
  });

  it('shows More Like This heading', async () => {
    renderWithSWR(() => Promise.resolve({ success: true, data: mockSimilar }));
    expect(await screen.findByText('More Like This')).toBeInTheDocument();
  });
});
