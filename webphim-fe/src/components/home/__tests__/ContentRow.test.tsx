import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ContentRow from '../ContentRow';
import { ContentSummary } from '@/types';

const mockItems: ContentSummary[] = Array.from({ length: 5 }, (_, i) => ({
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

describe('ContentRow', () => {
  it('renders row title', () => {
    render(<ContentRow title="Trending Now" items={mockItems} />);
    expect(screen.getByText('Trending Now')).toBeInTheDocument();
  });

  it('renders all movie cards', () => {
    render(<ContentRow title="Trending Now" items={mockItems} />);
    expect(screen.getByText('Movie 1')).toBeInTheDocument();
    expect(screen.getByText('Movie 3')).toBeInTheDocument();
    expect(screen.getByText('Movie 5')).toBeInTheDocument();
  });

  it('renders nothing when items array is empty', () => {
    const { container } = render(<ContentRow title="Empty Row" items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders scroll right arrow by default', () => {
    render(<ContentRow title="Trending Now" items={mockItems} />);
    expect(screen.getByLabelText('Scroll right')).toBeInTheDocument();
  });

  it('renders title with correct heading level', () => {
    render(<ContentRow title="Top Rated" items={mockItems} />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Top Rated');
  });
});
