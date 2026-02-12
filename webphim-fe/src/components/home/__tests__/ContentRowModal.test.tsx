import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SWRConfig } from 'swr';
import ContentRow from '../ContentRow';
import { ContentSummary, ContentDetail } from '@/types';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

const mockItems: ContentSummary[] = [
  {
    id: 'item-1',
    type: 'MOVIE',
    title: 'Movie 1',
    description: 'Desc 1',
    releaseYear: 2024,
    maturityRating: 'PG13',
    duration: 120,
    thumbnailUrl: '/images/m1.jpg',
    bannerUrl: '/images/b1.jpg',
    viewCount: 1000,
    genres: [{ id: 'g1', name: 'Action', slug: 'action' }],
  },
  {
    id: 'item-2',
    type: 'MOVIE',
    title: 'Movie 2',
    description: 'Desc 2',
    releaseYear: 2023,
    maturityRating: 'R',
    duration: 90,
    thumbnailUrl: '/images/m2.jpg',
    bannerUrl: '/images/b2.jpg',
    viewCount: 500,
    genres: [{ id: 'g2', name: 'Drama', slug: 'drama' }],
  },
];

const mockDetail: ContentDetail = {
  ...mockItems[0],
  trailerUrl: null,
  cast: [
    { id: 'a1', name: 'Actor One', role: 'ACTOR', character: 'Hero', photoUrl: null },
  ],
};

function renderRow() {
  const fetcher = (url: string) => {
    if (url.includes('/similar')) return Promise.resolve({ success: true, data: [] });
    return Promise.resolve({ success: true, data: mockDetail });
  };

  return render(
    <SWRConfig value={{ provider: () => new Map(), fetcher, dedupingInterval: 0 }}>
      <ContentRow title="Test Row" items={mockItems} />
    </SWRConfig>
  );
}

describe('ContentRow → PreviewModal integration', () => {
  afterEach(() => {
    mockPush.mockClear();
  });

  it('opens PreviewModal when card is clicked', async () => {
    renderRow();
    fireEvent.click(screen.getByTestId('movie-card-item-1'));
    expect(await screen.findByTestId('preview-modal')).toBeInTheDocument();
  });

  it('closes PreviewModal when backdrop is clicked', async () => {
    renderRow();
    fireEvent.click(screen.getByTestId('movie-card-item-1'));
    await screen.findByTestId('preview-modal');

    fireEvent.click(screen.getByTestId('modal-backdrop'));
    await vi.waitFor(() => {
      expect(screen.queryByTestId('preview-modal')).not.toBeInTheDocument();
    });
  });

  it('closes PreviewModal on Escape key', async () => {
    renderRow();
    fireEvent.click(screen.getByTestId('movie-card-item-1'));
    await screen.findByTestId('preview-modal');

    fireEvent.keyDown(document, { key: 'Escape' });
    await vi.waitFor(() => {
      expect(screen.queryByTestId('preview-modal')).not.toBeInTheDocument();
    });
  });
});
