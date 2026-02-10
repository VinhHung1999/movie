import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import MovieCard from '../MovieCard';
import { ContentSummary } from '@/types';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
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

function triggerHover(testId: string) {
  vi.useFakeTimers();
  const card = screen.getByTestId(testId);
  fireEvent.pointerEnter(card);
  act(() => {
    vi.advanceTimersByTime(350);
  });
}

describe('QA: MovieCard ChevronDown → PreviewModal trigger', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows ChevronDown button on hover', () => {
    render(<MovieCard item={mockItem} />);
    triggerHover('movie-card-test-1');
    expect(screen.getByTestId('chevron-down-test-1')).toBeInTheDocument();
  });

  it('calls onOpenPreview when ChevronDown is clicked', () => {
    const onOpenPreview = vi.fn();
    render(<MovieCard item={mockItem} onOpenPreview={onOpenPreview} />);
    triggerHover('movie-card-test-1');

    fireEvent.click(screen.getByTestId('chevron-down-test-1'));
    expect(onOpenPreview).toHaveBeenCalledTimes(1);
  });

  it('does not show ChevronDown in compact mode', () => {
    vi.useFakeTimers();
    render(<MovieCard item={mockItem} compact />);
    const card = screen.getByTestId('movie-card-test-1');
    fireEvent.pointerEnter(card);
    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(screen.queryByTestId('chevron-down-test-1')).not.toBeInTheDocument();
  });

  it('does not navigate when ChevronDown is clicked (stopPropagation)', () => {
    const onOpenPreview = vi.fn();
    render(<MovieCard item={mockItem} onOpenPreview={onOpenPreview} />);
    triggerHover('movie-card-test-1');

    fireEvent.click(screen.getByTestId('chevron-down-test-1'));
    expect(onOpenPreview).toHaveBeenCalled();
    // Should NOT navigate to watch page
    expect(mockPush).not.toHaveBeenCalled();
  });
});
