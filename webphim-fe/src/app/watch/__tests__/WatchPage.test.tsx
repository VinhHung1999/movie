import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Track VideoPlayer mount/unmount
let videoPlayerMountCount = 0;
let lastMountedProps: Record<string, unknown> = {};

vi.mock('@/components/player/VideoPlayer', () => ({
  default: (props: Record<string, unknown>) => {
    videoPlayerMountCount++;
    lastMountedProps = { ...props };
    return (
      <div data-testid="mock-video-player" data-content-id={props.contentId as string}>
        <video data-testid="video-element" title={props.title as string} />
      </div>
    );
  },
}));

vi.mock('@/components/player/PlayerControls', () => ({
  default: () => <div data-testid="player-controls" />,
}));

vi.mock('@/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: vi.fn(),
}));

vi.mock('@/hooks/useWatchProgress', () => ({
  useWatchProgress: vi.fn(),
}));

// Mock SWRProvider to be a passthrough
vi.mock('@/lib/swr-config', () => ({
  SWRProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Control useParams per test
let mockParamsId = 'content-1';
vi.mock('next/navigation', async () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  useParams: () => ({ id: mockParamsId }),
  usePathname: () => `/watch/${mockParamsId}`,
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/store/auth.store', () => ({
  useAuthStore: Object.assign(
    () => ({
      isAuthenticated: true,
      setAuth: vi.fn(),
      clearAuth: vi.fn(),
    }),
    {
      getState: () => ({
        isAuthenticated: true,
        accessToken: 'mock-token',
      }),
    }
  ),
}));

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock SWR to return data based on key
const swrDataMap: Record<string, unknown> = {};

vi.mock('swr', () => ({
  default: (key: string | null) => {
    if (!key) return { data: undefined, error: undefined, isLoading: false };
    const data = swrDataMap[key];
    return {
      data,
      error: data ? undefined : undefined,
      isLoading: !data,
      mutate: vi.fn(),
    };
  },
  SWRConfig: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function setupSWRData(contentId: string, videoId: string) {
  swrDataMap[`/content/${contentId}`] = {
    success: true,
    data: {
      id: contentId,
      type: 'MOVIE',
      title: `Movie ${contentId}`,
      description: 'Test movie',
      releaseYear: 2024,
      maturityRating: 'PG13',
      duration: 120,
      thumbnailUrl: `/thumb-${contentId}.jpg`,
      bannerUrl: `/banner-${contentId}.jpg`,
      viewCount: 100,
      genres: [],
      cast: [],
      seasons: [],
    },
  };
  swrDataMap[`/videos?contentId=${contentId}`] = {
    success: true,
    data: {
      videos: [{ id: videoId, status: 'COMPLETED' }],
    },
  };
  swrDataMap[`/videos/${videoId}/status`] = {
    success: true,
    data: {
      id: videoId,
      status: 'COMPLETED',
      hlsPath: `hls/${videoId}/master.m3u8`,
      thumbnailPaths: [`thumbnails/${videoId}/thumb.jpg`],
    },
  };
  swrDataMap[`/watch-history/${contentId}`] = {
    success: true,
    data: null,
  };
}

let WatchPage: React.ComponentType;

beforeEach(async () => {
  vi.clearAllMocks();
  videoPlayerMountCount = 0;
  lastMountedProps = {};
  mockParamsId = 'content-1';
  // Clear SWR data
  Object.keys(swrDataMap).forEach((k) => delete swrDataMap[k]);

  // Dynamic import after mocks
  vi.resetModules();
  const mod = await import('../[id]/page');
  WatchPage = mod.default;
});

describe('WatchPage — Video Player key={contentId} remount (Task 9.8)', () => {
  it('renders VideoPlayer when content and stream are available', () => {
    setupSWRData('content-1', 'vid-1');

    render(<WatchPage />);

    expect(screen.getByTestId('mock-video-player')).toBeInTheDocument();
    expect(videoPlayerMountCount).toBe(1);
    expect(lastMountedProps.contentId).toBe('content-1');
    expect(lastMountedProps.title).toBe('Movie content-1');
  });

  it('VideoPlayer receives correct streamUrl derived from video status', () => {
    setupSWRData('content-1', 'vid-1');

    render(<WatchPage />);

    expect(lastMountedProps.streamUrl).toContain('hls/vid-1/master.m3u8');
  });

  it('mounts new VideoPlayer instance for different contentId (key prop)', () => {
    // First render with content-1
    setupSWRData('content-1', 'vid-1');
    const { unmount } = render(<WatchPage />);
    expect(screen.getByTestId('mock-video-player')).toBeInTheDocument();
    expect(lastMountedProps.contentId).toBe('content-1');
    const countAfterFirst = videoPlayerMountCount;
    unmount();

    // Second render with content-2
    mockParamsId = 'content-2';
    setupSWRData('content-2', 'vid-2');
    render(<WatchPage />);

    expect(screen.getByTestId('mock-video-player')).toBeInTheDocument();
    expect(lastMountedProps.contentId).toBe('content-2');
    expect(lastMountedProps.streamUrl).toContain('hls/vid-2/master.m3u8');
    expect(videoPlayerMountCount).toBeGreaterThan(countAfterFirst);
  });
});
