import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SWRConfig } from 'swr';
import PreviewModal from '../PreviewModal';
import { ContentDetail } from '@/types';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

const mockContent: ContentDetail = {
  id: 'c1',
  type: 'MOVIE',
  title: 'Test Movie',
  description: 'A thrilling action movie with great cast.',
  releaseYear: 2024,
  maturityRating: 'PG13',
  duration: 142,
  thumbnailUrl: '/images/test.jpg',
  bannerUrl: '/images/banner.jpg',
  trailerUrl: null,
  viewCount: 1500,
  genres: [
    { id: 'g1', name: 'Action', slug: 'action' },
    { id: 'g2', name: 'Sci-Fi', slug: 'sci-fi' },
  ],
  cast: [
    { id: 'a1', name: 'John Actor', role: 'ACTOR', character: 'Hero', photoUrl: null },
    { id: 'a2', name: 'Jane Actor', role: 'ACTOR', character: 'Villain', photoUrl: null },
    { id: 'd1', name: 'Mike Director', role: 'DIRECTOR', character: null, photoUrl: null },
  ],
};

const mockSeriesContent: ContentDetail = {
  ...mockContent,
  id: 'c2',
  type: 'SERIES',
  title: 'Test Series',
  seasons: [
    {
      id: 's1',
      seasonNumber: 1,
      title: null,
      episodes: [
        { id: 'e1', episodeNumber: 1, title: 'Pilot', description: 'First episode', duration: 45, thumbnailUrl: null },
      ],
    },
  ],
};

function renderModal(
  props: { contentId: string; isOpen: boolean; onClose: () => void },
  responseData: ContentDetail | null = mockContent
) {
  const fetcher = responseData
    ? (url: string) => {
        if (url.includes('/similar')) {
          return Promise.resolve({ success: true, data: [] });
        }
        return Promise.resolve({ success: true, data: responseData });
      }
    : () => new Promise(() => {});

  return render(
    <SWRConfig value={{ provider: () => new Map(), fetcher, dedupingInterval: 0 }}>
      <PreviewModal {...props} />
    </SWRConfig>
  );
}

describe('PreviewModal', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    onClose.mockClear();
    mockPush.mockClear();
  });

  it('renders nothing when isOpen is false', () => {
    renderModal({ contentId: 'c1', isOpen: false, onClose });
    expect(screen.queryByTestId('preview-modal')).not.toBeInTheDocument();
  });

  it('shows loading skeleton when fetching', () => {
    renderModal({ contentId: 'c1', isOpen: true, onClose }, null);
    expect(screen.getByTestId('modal-skeleton')).toBeInTheDocument();
  });

  it('renders content when loaded', async () => {
    renderModal({ contentId: 'c1', isOpen: true, onClose });
    expect(await screen.findByText('Test Movie')).toBeInTheDocument();
    expect(screen.getByText('A thrilling action movie with great cast.')).toBeInTheDocument();
  });

  it('renders backdrop', async () => {
    renderModal({ contentId: 'c1', isOpen: true, onClose });
    await screen.findByText('Test Movie');
    expect(screen.getByTestId('modal-backdrop')).toBeInTheDocument();
  });

  it('closes on backdrop click', async () => {
    renderModal({ contentId: 'c1', isOpen: true, onClose });
    await screen.findByText('Test Movie');
    fireEvent.click(screen.getByTestId('modal-backdrop'));
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on X button click', async () => {
    renderModal({ contentId: 'c1', isOpen: true, onClose });
    await screen.findByText('Test Movie');
    fireEvent.click(screen.getByTestId('modal-close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on Escape key', async () => {
    renderModal({ contentId: 'c1', isOpen: true, onClose });
    await screen.findByText('Test Movie');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('renders content meta (maturity rating, year, duration)', async () => {
    renderModal({ contentId: 'c1', isOpen: true, onClose });
    await screen.findByText('Test Movie');
    expect(screen.getByTestId('content-meta')).toBeInTheDocument();
    expect(screen.getByText('PG13')).toBeInTheDocument();
    expect(screen.getByText('2024')).toBeInTheDocument();
  });

  it('renders cast list', async () => {
    renderModal({ contentId: 'c1', isOpen: true, onClose });
    await screen.findByText('Test Movie');
    expect(screen.getByTestId('cast-list')).toBeInTheDocument();
  });

  it('renders play, watchlist, and rating buttons', async () => {
    renderModal({ contentId: 'c1', isOpen: true, onClose });
    await screen.findByText('Test Movie');
    expect(screen.getByTestId('play-button')).toBeInTheDocument();
    expect(screen.getByTestId('watchlist-button')).toBeInTheDocument();
    expect(screen.getByTestId('rate-thumbs-up')).toBeInTheDocument();
    expect(screen.getByTestId('rate-thumbs-down')).toBeInTheDocument();
  });

  it('navigates to watch page on Play click', async () => {
    renderModal({ contentId: 'c1', isOpen: true, onClose });
    await screen.findByText('Test Movie');
    fireEvent.click(screen.getByTestId('play-button'));
    expect(mockPush).toHaveBeenCalledWith('/watch/c1');
  });

  it('renders banner image when no trailerUrl', async () => {
    renderModal({ contentId: 'c1', isOpen: true, onClose });
    const img = await screen.findByAltText('Test Movie');
    expect(img).toBeInTheDocument();
  });

  it('does not show mute toggle when no trailer', async () => {
    renderModal({ contentId: 'c1', isOpen: true, onClose });
    await screen.findByText('Test Movie');
    expect(screen.queryByTestId('mute-toggle')).not.toBeInTheDocument();
  });

  it('renders View Details button', async () => {
    renderModal({ contentId: 'c1', isOpen: true, onClose });
    await screen.findByText('Test Movie');
    expect(screen.getByTestId('view-details-button')).toBeInTheDocument();
    expect(screen.getByText('View Details')).toBeInTheDocument();
  });

  it('navigates to /title/[id] on View Details click', async () => {
    renderModal({ contentId: 'c1', isOpen: true, onClose });
    await screen.findByText('Test Movie');
    fireEvent.click(screen.getByTestId('view-details-button'));
    expect(mockPush).toHaveBeenCalledWith('/title/c1');
    expect(onClose).toHaveBeenCalled();
  });

  it('renders episode list for series content', async () => {
    renderModal({ contentId: 'c2', isOpen: true, onClose }, mockSeriesContent);
    expect(await screen.findByText('Test Series')).toBeInTheDocument();
    expect(screen.getByTestId('episode-list')).toBeInTheDocument();
    expect(screen.getByText('Pilot')).toBeInTheDocument();
  });

  it('shows error state on fetch failure', async () => {
    const fetcher = (url: string) => {
      if (url.includes('/similar')) return Promise.resolve({ success: true, data: [] });
      return Promise.reject(new Error('Network error'));
    };
    render(
      <SWRConfig value={{ provider: () => new Map(), fetcher, dedupingInterval: 0, errorRetryCount: 0 }}>
        <PreviewModal contentId="c1" isOpen={true} onClose={onClose} />
      </SWRConfig>
    );
    expect(await screen.findByText('Failed to load content')).toBeInTheDocument();
  });
});
