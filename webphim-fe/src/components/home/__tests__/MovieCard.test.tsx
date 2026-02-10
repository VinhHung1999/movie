import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import MovieCard from '../MovieCard';
import { ContentSummary } from '@/types';

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
    { id: 'g3', name: 'Drama', slug: 'drama' },
    { id: 'g4', name: 'Thriller', slug: 'thriller' },
  ],
};

const mockItemNoImage: ContentSummary = {
  ...mockItem,
  id: '2',
  title: 'No Image Movie',
  thumbnailUrl: null,
};

function triggerHover(testId: string) {
  vi.useFakeTimers();
  const card = screen.getByTestId(testId);
  fireEvent.pointerEnter(card);
  act(() => {
    vi.advanceTimersByTime(350);
  });
}

describe('MovieCard', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders poster image when thumbnailUrl is provided', () => {
    render(<MovieCard item={mockItem} />);
    expect(screen.getByAltText('Test Movie')).toBeInTheDocument();
  });

  it('renders title fallback when thumbnailUrl is null', () => {
    render(<MovieCard item={mockItemNoImage} />);
    expect(screen.getByText('No Image Movie')).toBeInTheDocument();
  });

  it('does not show hover overlay by default', () => {
    render(<MovieCard item={mockItem} />);
    expect(screen.queryByText('PG13')).not.toBeInTheDocument();
  });

  it('shows hover overlay with meta info after pointer enter + delay', () => {
    render(<MovieCard item={mockItem} />);
    triggerHover('movie-card-1');
    expect(screen.getByText('PG13')).toBeInTheDocument();
    expect(screen.getByText('2025')).toBeInTheDocument();
    expect(screen.getByText('2h 22m')).toBeInTheDocument();
  });

  it('shows only first 3 genre tags in overlay', () => {
    render(<MovieCard item={mockItem} />);
    triggerHover('movie-card-1');
    expect(screen.getByText('Action \u2022 Sci-Fi \u2022 Drama')).toBeInTheDocument();
    expect(screen.queryByText(/Thriller/)).not.toBeInTheDocument();
  });

  it('does not expand when compact prop is true', () => {
    vi.useFakeTimers();
    render(<MovieCard item={mockItem} compact />);
    const card = screen.getByTestId('movie-card-1');
    fireEvent.pointerEnter(card);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.queryByText('PG13')).not.toBeInTheDocument();
  });

  it('renders 3 action buttons in hover overlay', () => {
    render(<MovieCard item={mockItem} />);
    triggerHover('movie-card-1');
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
  });
});
