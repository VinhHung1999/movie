import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EpisodeList from '../EpisodeList';
import { SeasonDetail } from '@/types';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

const mockSeasons: SeasonDetail[] = [
  {
    id: 's1',
    seasonNumber: 1,
    title: null,
    episodes: [
      { id: 'e1', episodeNumber: 1, title: 'Pilot', description: 'First episode of the series', duration: 45, thumbnailUrl: '/images/ep1.jpg' },
      { id: 'e2', episodeNumber: 2, title: 'The Discovery', description: 'A mysterious discovery', duration: 52, thumbnailUrl: null },
    ],
  },
  {
    id: 's2',
    seasonNumber: 2,
    title: 'Season 2',
    episodes: [
      { id: 'e3', episodeNumber: 1, title: 'The Return', description: 'Everyone returns', duration: 48, thumbnailUrl: '/images/ep3.jpg' },
    ],
  },
];

describe('EpisodeList', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders nothing when seasons array is empty', () => {
    const { container } = render(<EpisodeList seasons={[]} contentId="c1" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders Episodes header', () => {
    render(<EpisodeList seasons={mockSeasons} contentId="c1" />);
    expect(screen.getByText('Episodes')).toBeInTheDocument();
  });

  it('renders season selector when multiple seasons exist', () => {
    render(<EpisodeList seasons={mockSeasons} contentId="c1" />);
    expect(screen.getByTestId('season-selector')).toBeInTheDocument();
  });

  it('does not render season selector for single season', () => {
    render(<EpisodeList seasons={[mockSeasons[0]]} contentId="c1" />);
    expect(screen.queryByTestId('season-selector')).not.toBeInTheDocument();
  });

  it('renders season 1 episodes by default', () => {
    render(<EpisodeList seasons={mockSeasons} contentId="c1" />);
    expect(screen.getByText('Pilot')).toBeInTheDocument();
    expect(screen.getByText('The Discovery')).toBeInTheDocument();
    expect(screen.queryByText('The Return')).not.toBeInTheDocument();
  });

  it('switches to season 2 when selector changes', () => {
    render(<EpisodeList seasons={mockSeasons} contentId="c1" />);
    const selector = screen.getByTestId('season-selector');
    fireEvent.change(selector, { target: { value: '1' } });
    expect(screen.getByText('The Return')).toBeInTheDocument();
    expect(screen.queryByText('Pilot')).not.toBeInTheDocument();
  });

  it('displays season title in dropdown options', () => {
    render(<EpisodeList seasons={mockSeasons} contentId="c1" />);
    expect(screen.getByText('Season 1')).toBeInTheDocument();
    expect(screen.getByText('Season 2')).toBeInTheDocument();
  });

  it('renders episode card with title and duration', () => {
    render(<EpisodeList seasons={mockSeasons} contentId="c1" />);
    expect(screen.getByText('Pilot')).toBeInTheDocument();
    expect(screen.getByText('45m')).toBeInTheDocument();
  });

  it('renders episode description', () => {
    render(<EpisodeList seasons={mockSeasons} contentId="c1" />);
    expect(screen.getByText('First episode of the series')).toBeInTheDocument();
  });

  it('navigates to watch page on episode click', () => {
    render(<EpisodeList seasons={mockSeasons} contentId="c1" />);
    const episodeCard = screen.getByTestId('episode-card-e1');
    fireEvent.click(episodeCard);
    expect(mockPush).toHaveBeenCalledWith('/watch/c1?episode=e1');
  });

  it('renders episode thumbnail when available', () => {
    render(<EpisodeList seasons={mockSeasons} contentId="c1" />);
    const img = screen.getByAltText('Pilot');
    expect(img).toBeInTheDocument();
  });
});
