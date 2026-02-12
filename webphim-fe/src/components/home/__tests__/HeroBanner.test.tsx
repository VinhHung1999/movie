import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HeroBanner from '../HeroBanner';
import { FeaturedContent } from '@/types';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

const mockFeatured: FeaturedContent = {
  id: 'f1',
  type: 'MOVIE',
  title: 'The Dark Knight',
  description: 'When the menace known as the Joker wreaks havoc on Gotham, Batman must face his greatest challenge.',
  releaseYear: 2008,
  maturityRating: 'PG13',
  duration: 152,
  bannerUrl: '/images/dark-knight-banner.jpg',
  trailerUrl: null,
  genres: [
    { id: 'g1', name: 'Action', slug: 'action' },
    { id: 'g2', name: 'Crime', slug: 'crime' },
    { id: 'g3', name: 'Drama', slug: 'drama' },
  ],
};

describe('HeroBanner', () => {
  afterEach(() => {
    mockPush.mockClear();
  });

  it('renders fallback when featured is null', () => {
    render(<HeroBanner featured={null} />);
    expect(screen.getByText('No featured content available')).toBeInTheDocument();
  });

  it('renders featured content title', () => {
    render(<HeroBanner featured={mockFeatured} />);
    expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<HeroBanner featured={mockFeatured} />);
    expect(screen.getByText(/When the menace known as the Joker/)).toBeInTheDocument();
  });

  it('renders maturity rating badge', () => {
    render(<HeroBanner featured={mockFeatured} />);
    expect(screen.getByText('PG13')).toBeInTheDocument();
  });

  it('renders genre tags', () => {
    render(<HeroBanner featured={mockFeatured} />);
    expect(screen.getByText('Action \u2022 Crime \u2022 Drama')).toBeInTheDocument();
  });

  it('renders Play and More Info buttons', () => {
    render(<HeroBanner featured={mockFeatured} />);
    expect(screen.getByText('Play')).toBeInTheDocument();
    expect(screen.getByText('More Info')).toBeInTheDocument();
  });

  it('renders banner image when bannerUrl is provided', () => {
    render(<HeroBanner featured={mockFeatured} />);
    expect(screen.getByAltText('The Dark Knight')).toBeInTheDocument();
  });

  it('renders gradient fallback when bannerUrl is null', () => {
    const noBanner = { ...mockFeatured, bannerUrl: null };
    render(<HeroBanner featured={noBanner} />);
    expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
    expect(screen.queryByAltText('The Dark Knight')).not.toBeInTheDocument();
  });

  it('Play button navigates to /watch/[id]', () => {
    render(<HeroBanner featured={mockFeatured} />);
    fireEvent.click(screen.getByText('Play'));
    expect(mockPush).toHaveBeenCalledWith('/watch/f1');
  });

  it('More Info button navigates to /title/[id]', () => {
    render(<HeroBanner featured={mockFeatured} />);
    fireEvent.click(screen.getByText('More Info'));
    expect(mockPush).toHaveBeenCalledWith('/title/f1');
  });
});
