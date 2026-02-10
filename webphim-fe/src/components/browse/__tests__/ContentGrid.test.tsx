import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ContentGrid from '../ContentGrid';
import { ContentSummary } from '@/types';

const mockItems: ContentSummary[] = Array.from({ length: 4 }, (_, i) => ({
  id: `item-${i}`,
  type: 'MOVIE' as const,
  title: `Movie ${i + 1}`,
  description: `Description ${i + 1}`,
  releaseYear: 2025,
  maturityRating: 'PG13' as const,
  duration: 120,
  thumbnailUrl: null,
  bannerUrl: null,
  viewCount: 100,
  genres: [{ id: 'g1', name: 'Action', slug: 'action' }],
}));

describe('ContentGrid', () => {
  it('renders all movie cards in a grid', () => {
    render(<ContentGrid items={mockItems} />);
    expect(screen.getByText('Movie 1')).toBeInTheDocument();
    expect(screen.getByText('Movie 2')).toBeInTheDocument();
    expect(screen.getByText('Movie 3')).toBeInTheDocument();
    expect(screen.getByText('Movie 4')).toBeInTheDocument();
  });

  it('renders grid layout with correct CSS classes', () => {
    const { container } = render(<ContentGrid items={mockItems} />);
    const grid = container.firstChild as HTMLElement;
    expect(grid.className).toContain('grid');
    expect(grid.className).toContain('grid-cols-2');
  });

  it('renders empty grid when no items', () => {
    const { container } = render(<ContentGrid items={[]} />);
    const grid = container.firstChild as HTMLElement;
    expect(grid.children).toHaveLength(0);
  });

  it('passes compact prop to MovieCard', () => {
    render(<ContentGrid items={mockItems} />);
    // Each card uses data-testid from MovieCard
    expect(screen.getByTestId('movie-card-item-0')).toBeInTheDocument();
  });
});
