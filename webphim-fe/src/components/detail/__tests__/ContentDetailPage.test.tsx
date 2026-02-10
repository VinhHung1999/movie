import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SWRConfig } from 'swr';
import ContentDetailPage from '@/app/(main)/title/[id]/page';
import { ContentDetail } from '@/types';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/title/c1',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: 'c1' }),
}));

const mockContent: ContentDetail = {
  id: 'c1',
  type: 'MOVIE',
  title: 'Detail Movie',
  description: 'A full description of the movie.',
  releaseYear: 2024,
  maturityRating: 'R',
  duration: 155,
  thumbnailUrl: '/images/thumb.jpg',
  bannerUrl: '/images/banner.jpg',
  trailerUrl: null,
  viewCount: 2500,
  genres: [
    { id: 'g1', name: 'Action', slug: 'action' },
    { id: 'g2', name: 'Thriller', slug: 'thriller' },
    { id: 'g3', name: 'Drama', slug: 'drama' },
  ],
  cast: [
    { id: 'a1', name: 'Actor One', role: 'ACTOR', character: 'Hero', photoUrl: null },
    { id: 'a2', name: 'Actor Two', role: 'ACTOR', character: 'Sidekick', photoUrl: null },
    { id: 'd1', name: 'Dir Smith', role: 'DIRECTOR', character: null, photoUrl: null },
    { id: 'w1', name: 'Writer Jones', role: 'WRITER', character: null, photoUrl: null },
  ],
};

const mockSeriesContent: ContentDetail = {
  ...mockContent,
  id: 'c2',
  type: 'SERIES',
  title: 'Detail Series',
  duration: null,
  seasons: [
    {
      id: 's1',
      seasonNumber: 1,
      title: null,
      episodes: [
        { id: 'e1', episodeNumber: 1, title: 'Episode One', description: 'First ep', duration: 50, thumbnailUrl: null },
        { id: 'e2', episodeNumber: 2, title: 'Episode Two', description: null, duration: 48, thumbnailUrl: null },
      ],
    },
  ],
};

function renderPage(responseData: ContentDetail | null = mockContent) {
  const fetcher = responseData
    ? (url: string) => {
        if (url.includes('/similar')) return Promise.resolve({ success: true, data: [] });
        return Promise.resolve({ success: true, data: responseData });
      }
    : () => new Promise(() => {});

  return render(
    <SWRConfig value={{ provider: () => new Map(), fetcher, dedupingInterval: 0 }}>
      <ContentDetailPage />
    </SWRConfig>
  );
}

describe('ContentDetailPage', () => {
  it('shows loading skeleton while fetching', () => {
    renderPage(null);
    expect(screen.getByTestId('detail-skeleton')).toBeInTheDocument();
  });

  it('renders page with content data', async () => {
    renderPage();
    expect(await screen.findByTestId('content-detail-page')).toBeInTheDocument();
    expect(screen.getByText('Detail Movie')).toBeInTheDocument();
  });

  it('renders hero section with banner', async () => {
    renderPage();
    await screen.findByTestId('content-detail-page');
    expect(screen.getByTestId('content-hero')).toBeInTheDocument();
    expect(screen.getByAltText('Detail Movie')).toBeInTheDocument();
  });

  it('renders full description', async () => {
    renderPage();
    expect(await screen.findByText('A full description of the movie.')).toBeInTheDocument();
  });

  it('renders cast grouped by role (full variant)', async () => {
    renderPage();
    await screen.findByTestId('content-detail-page');
    expect(screen.getByText(/Starring:/)).toBeInTheDocument();
    expect(screen.getByText(/Actor One, Actor Two/)).toBeInTheDocument();
    expect(screen.getByText(/Director:/)).toBeInTheDocument();
    expect(screen.getByText(/Dir Smith/)).toBeInTheDocument();
    expect(screen.getByText(/Writer:/)).toBeInTheDocument();
    expect(screen.getByText(/Writer Jones/)).toBeInTheDocument();
  });

  it('renders all genres (full variant)', async () => {
    renderPage();
    await screen.findByTestId('content-detail-page');
    expect(screen.getByText(/Action/)).toBeInTheDocument();
    expect(screen.getByText(/Thriller/)).toBeInTheDocument();
    expect(screen.getByText(/Drama/)).toBeInTheDocument();
  });

  it('renders play button that navigates to watch page', async () => {
    renderPage();
    await screen.findByTestId('content-detail-page');
    expect(screen.getByTestId('hero-play-button')).toBeInTheDocument();
  });

  it('renders episode list for series', async () => {
    renderPage(mockSeriesContent);
    await screen.findByTestId('content-detail-page');
    expect(screen.getByTestId('episode-list')).toBeInTheDocument();
    expect(screen.getByText('Episode One')).toBeInTheDocument();
  });

  it('does not render episode list for movie', async () => {
    renderPage();
    await screen.findByTestId('content-detail-page');
    expect(screen.queryByTestId('episode-list')).not.toBeInTheDocument();
  });

  it('shows error state on fetch failure', async () => {
    const fetcher = (url: string) => {
      if (url.includes('/similar')) return Promise.resolve({ success: true, data: [] });
      return Promise.reject(new Error('Not found'));
    };
    render(
      <SWRConfig value={{ provider: () => new Map(), fetcher, dedupingInterval: 0, errorRetryCount: 0 }}>
        <ContentDetailPage />
      </SWRConfig>
    );
    expect(await screen.findByText('Content Not Found')).toBeInTheDocument();
  });
});
