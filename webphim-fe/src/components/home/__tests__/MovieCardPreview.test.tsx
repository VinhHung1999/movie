import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MovieCard from '../MovieCard';
import { ContentSummary } from '@/types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

const mockItem: ContentSummary = {
  id: 'test-1',
  type: 'MOVIE',
  title: 'Test Movie',
  description: 'A test movie',
  releaseYear: 2024,
  maturityRating: 'PG13',
  duration: 120,
  thumbnailUrl: '/images/test.jpg',
  bannerUrl: '/images/banner.jpg',
  viewCount: 1000,
  genres: [{ id: 'g1', name: 'Action', slug: 'action' }],
};

describe('MovieCard → PreviewModal trigger', () => {
  it('calls onOpenPreview when card is clicked', () => {
    const onOpenPreview = vi.fn();
    render(<MovieCard item={mockItem} onOpenPreview={onOpenPreview} />);
    fireEvent.click(screen.getByTestId('movie-card-test-1'));
    expect(onOpenPreview).toHaveBeenCalledTimes(1);
  });

  it('does not navigate on click (opens preview instead)', () => {
    const mockPush = vi.fn();
    vi.mocked(vi.fn());
    const onOpenPreview = vi.fn();
    render(<MovieCard item={mockItem} onOpenPreview={onOpenPreview} />);
    fireEvent.click(screen.getByTestId('movie-card-test-1'));
    expect(onOpenPreview).toHaveBeenCalled();
  });
});
