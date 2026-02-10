import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VideoPlayer from '../VideoPlayer';

// Mock hls.js (jsdom has no MediaSource API)
const mockHlsInstance = {
  loadSource: vi.fn(),
  attachMedia: vi.fn(),
  on: vi.fn(),
  destroy: vi.fn(),
  startLoad: vi.fn(),
  recoverMediaError: vi.fn(),
  currentLevel: -1,
  levels: [],
};

vi.mock('hls.js', () => ({
  default: Object.assign(
    vi.fn().mockImplementation(() => ({ ...mockHlsInstance })),
    {
      isSupported: vi.fn().mockReturnValue(true),
      Events: {
        MANIFEST_PARSED: 'hlsManifestParsed',
        ERROR: 'hlsError',
        LEVEL_SWITCHED: 'hlsLevelSwitched',
      },
      ErrorTypes: {
        NETWORK_ERROR: 'networkError',
        MEDIA_ERROR: 'mediaError',
      },
    }
  ),
  Events: {
    MANIFEST_PARSED: 'hlsManifestParsed',
    ERROR: 'hlsError',
    LEVEL_SWITCHED: 'hlsLevelSwitched',
  },
  ErrorTypes: {
    NETWORK_ERROR: 'networkError',
    MEDIA_ERROR: 'mediaError',
  },
}));

const defaultProps = {
  streamUrl: '/test/master.m3u8',
  title: 'Test Movie',
  contentId: 'content-1',
};

describe('VideoPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders video element with correct attributes', () => {
    render(<VideoPlayer {...defaultProps} thumbnailUrl="/thumb.jpg" />);

    const video = screen.getByTestId('video-element');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('title', 'Test Movie');
    expect(video).toHaveAttribute('poster', '/thumb.jpg');
  });

  it('renders player container', () => {
    render(<VideoPlayer {...defaultProps} />);
    expect(screen.getByTestId('video-player-container')).toBeInTheDocument();
  });

  it('renders children as render prop with player state', () => {
    render(
      <VideoPlayer {...defaultProps}>
        {(player) => (
          <div data-testid="controls">
            <span data-testid="is-playing">{String(player.isPlaying)}</span>
            <span data-testid="duration">{player.duration}</span>
          </div>
        )}
      </VideoPlayer>
    );

    expect(screen.getByTestId('controls')).toBeInTheDocument();
    expect(screen.getByTestId('is-playing')).toHaveTextContent('false');
    expect(screen.getByTestId('duration')).toHaveTextContent('0');
  });

  it('does not show error overlay initially', () => {
    render(<VideoPlayer {...defaultProps} />);

    // No error overlay initially
    expect(screen.queryByTestId('error-overlay')).not.toBeInTheDocument();
  });

  it('does not show buffering spinner when not buffering', () => {
    render(<VideoPlayer {...defaultProps} />);
    expect(screen.queryByTestId('buffering-spinner')).not.toBeInTheDocument();
  });

  it('shows buffering spinner when video is waiting', () => {
    render(<VideoPlayer {...defaultProps} />);

    const video = screen.getByTestId('video-element');
    fireEvent.waiting(video);

    expect(screen.getByTestId('buffering-spinner')).toBeInTheDocument();
  });

  it('hides buffering spinner when canplay fires', () => {
    render(<VideoPlayer {...defaultProps} />);

    const video = screen.getByTestId('video-element');
    fireEvent.waiting(video);
    expect(screen.getByTestId('buffering-spinner')).toBeInTheDocument();

    fireEvent.canPlay(video);
    expect(screen.queryByTestId('buffering-spinner')).not.toBeInTheDocument();
  });

  it('renders without poster when thumbnailUrl not provided', () => {
    render(<VideoPlayer {...defaultProps} />);
    const video = screen.getByTestId('video-element');
    expect(video).not.toHaveAttribute('poster');
  });
});
