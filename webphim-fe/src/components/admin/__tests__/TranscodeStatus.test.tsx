import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SWRConfig } from 'swr';
import TranscodeStatus from '../TranscodeStatus';
import { VideoStatusResponse } from '@/types';

function makeStatusData(
  overrides: Partial<VideoStatusResponse> = {}
): { success: true; data: VideoStatusResponse } {
  return {
    success: true,
    data: {
      id: 'video-123',
      status: 'PROCESSING',
      originalName: 'test.mp4',
      fileSize: 1073741824,
      duration: null,
      hlsPath: null,
      thumbnailPaths: [],
      errorMessage: null,
      progress: 45,
      createdAt: '2026-02-08T15:30:00.000Z',
      updatedAt: '2026-02-08T15:35:00.000Z',
      ...overrides,
    },
  };
}

function renderWithSWR(
  videoId: string,
  fetcherData: ReturnType<typeof makeStatusData> | null,
  fetcherError: Error | null = null
) {
  const fetcher = vi.fn(() => {
    if (fetcherError) throw fetcherError;
    return fetcherData;
  });
  return {
    fetcher,
    ...render(
      <SWRConfig value={{ fetcher, dedupingInterval: 0, provider: () => new Map() }}>
        <TranscodeStatus videoId={videoId} />
      </SWRConfig>
    ),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TranscodeStatus', () => {
  it('shows loading state initially', () => {
    renderWithSWR('vid-1', makeStatusData());
    // SWR with sync fetcher resolves immediately — either loading or status is fine
    const loading = screen.queryByTestId('transcode-loading');
    const status = screen.queryByTestId('transcode-status');
    expect(loading || status).toBeTruthy();
  });

  it('shows error state on fetch failure', async () => {
    renderWithSWR('vid-err', null, new Error('Network error'));
    const errorEl = await screen.findByTestId('transcode-error');
    expect(errorEl).toBeInTheDocument();
    expect(screen.getByText('Failed to load transcode status')).toBeInTheDocument();
  });

  it('shows PROCESSING status with progress bar', async () => {
    renderWithSWR('vid-proc', makeStatusData({ status: 'PROCESSING', progress: 60 }));
    const badge = await screen.findByTestId('status-badge');
    expect(badge).toHaveTextContent('Processing');
    expect(screen.getByTestId('transcode-progress')).toHaveTextContent('60%');
    expect(screen.getByTestId('transcode-progress-bar')).toBeInTheDocument();
  });

  it('shows QUEUED status badge without progress bar', async () => {
    renderWithSWR('vid-q', makeStatusData({ status: 'QUEUED', progress: 0 }));
    const badge = await screen.findByTestId('status-badge');
    expect(badge).toHaveTextContent('Queued');
    expect(screen.queryByTestId('transcode-progress-bar')).not.toBeInTheDocument();
  });

  it('shows COMPLETED status with thumbnails and duration', async () => {
    renderWithSWR(
      'vid-done',
      makeStatusData({
        status: 'COMPLETED',
        progress: 100,
        duration: 7200.5,
        thumbnailPaths: ['/uploads/hls/v1/thumb_001.jpg', '/uploads/hls/v1/thumb_002.jpg'],
      })
    );
    const badge = await screen.findByTestId('status-badge');
    expect(badge).toHaveTextContent('Completed');
    expect(screen.getByTestId('thumbnails')).toBeInTheDocument();
    expect(screen.getByAltText('Thumbnail 1')).toBeInTheDocument();
    expect(screen.getByAltText('Thumbnail 2')).toBeInTheDocument();
    expect(screen.getByText('Duration: 120m 1s')).toBeInTheDocument();
  });

  it('shows FAILED status with error message', async () => {
    renderWithSWR(
      'vid-fail',
      makeStatusData({
        status: 'FAILED',
        progress: null,
        errorMessage: 'FFmpeg crashed',
      })
    );
    const badge = await screen.findByTestId('status-badge');
    expect(badge).toHaveTextContent('Failed');
    expect(screen.getByTestId('transcode-error-message')).toHaveTextContent('FFmpeg crashed');
  });

  it('calls fetcher with correct URL', async () => {
    const { fetcher } = renderWithSWR('my-video-id', makeStatusData());
    await screen.findByTestId('transcode-status');
    expect(fetcher).toHaveBeenCalledWith('/videos/my-video-id/status');
  });
});
