import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import NextEpisodeOverlay from '../NextEpisodeOverlay';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div
        data-testid={props['data-testid'] as string}
        role={props.role as string}
        aria-label={props['aria-label'] as string}
        className={props.className as string}
      >
        {children}
      </div>
    ),
  },
}));

const nextEpisode = {
  episodeId: 'ep-2',
  seasonNumber: 1,
  episodeNumber: 3,
  title: 'The Third Episode',
};

describe('NextEpisodeOverlay', () => {
  const onPlay = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders with episode info', () => {
    render(<NextEpisodeOverlay nextEpisode={nextEpisode} onPlay={onPlay} onCancel={onCancel} />);

    expect(screen.getByTestId('next-episode-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('next-episode-title')).toHaveTextContent('The Third Episode');
    expect(screen.getByText('S1 E3')).toBeInTheDocument();
  });

  it('shows countdown starting at 10', () => {
    render(<NextEpisodeOverlay nextEpisode={nextEpisode} onPlay={onPlay} onCancel={onCancel} />);
    expect(screen.getByText('10s')).toBeInTheDocument();
  });

  it('counts down each second', () => {
    render(<NextEpisodeOverlay nextEpisode={nextEpisode} onPlay={onPlay} onCancel={onCancel} />);

    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByText('9s')).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByText('8s')).toBeInTheDocument();
  });

  it('calls onPlay when countdown reaches 0', () => {
    render(<NextEpisodeOverlay nextEpisode={nextEpisode} onPlay={onPlay} onCancel={onCancel} />);

    act(() => { vi.advanceTimersByTime(10000); });
    expect(onPlay).toHaveBeenCalled();
  });

  it('calls onPlay when Play Now button is clicked', () => {
    render(<NextEpisodeOverlay nextEpisode={nextEpisode} onPlay={onPlay} onCancel={onCancel} />);

    fireEvent.click(screen.getByTestId('next-episode-play'));
    expect(onPlay).toHaveBeenCalled();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<NextEpisodeOverlay nextEpisode={nextEpisode} onPlay={onPlay} onCancel={onCancel} />);

    fireEvent.click(screen.getByTestId('next-episode-cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('stops countdown when cancelled', () => {
    render(<NextEpisodeOverlay nextEpisode={nextEpisode} onPlay={onPlay} onCancel={onCancel} />);

    fireEvent.click(screen.getByTestId('next-episode-cancel'));

    act(() => { vi.advanceTimersByTime(15000); });
    expect(onPlay).not.toHaveBeenCalled();
  });

  it('has correct aria attributes', () => {
    render(<NextEpisodeOverlay nextEpisode={nextEpisode} onPlay={onPlay} onCancel={onCancel} />);

    const overlay = screen.getByTestId('next-episode-overlay');
    expect(overlay).toHaveAttribute('role', 'dialog');
    expect(overlay).toHaveAttribute('aria-label', 'Next episode');
  });
});
