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
  id: '1',
  type: 'MOVIE',
  title: 'Test Movie',
  description: 'A test movie description',
  releaseYear: 2025,
  maturityRating: 'PG13',
  duration: 142,
  thumbnailUrl: '/images/test.jpg',
  bannerUrl: null,
  viewCount: 1000,
  genres: [
    { id: 'g1', name: 'Action', slug: 'action' },
    { id: 'g2', name: 'Sci-Fi', slug: 'sci-fi' },
  ],
};

const mockItemNoImage: ContentSummary = {
  ...mockItem,
  id: '2',
  title: 'No Image Movie',
  thumbnailUrl: null,
};

describe('MovieCard', () => {
  it('renders poster image when thumbnailUrl is provided', () => {
    render(<MovieCard item={mockItem} />);
    expect(screen.getByAltText('Test Movie')).toBeInTheDocument();
  });

  it('renders title fallback when thumbnailUrl is null', () => {
    render(<MovieCard item={mockItemNoImage} />);
    expect(screen.getByText('No Image Movie')).toBeInTheDocument();
  });

  it('calls onOpenPreview when card is clicked', () => {
    const onOpenPreview = vi.fn();
    render(<MovieCard item={mockItem} onOpenPreview={onOpenPreview} />);
    fireEvent.click(screen.getByTestId('movie-card-1'));
    expect(onOpenPreview).toHaveBeenCalledTimes(1);
  });

  it('does not throw when clicked without onOpenPreview', () => {
    render(<MovieCard item={mockItem} />);
    expect(() => fireEvent.click(screen.getByTestId('movie-card-1'))).not.toThrow();
  });

  it('has cursor-pointer class', () => {
    render(<MovieCard item={mockItem} />);
    expect(screen.getByTestId('movie-card-1')).toHaveClass('cursor-pointer');
  });
});
