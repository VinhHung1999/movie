import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';
import WatchlistButton from '../WatchlistButton';

vi.mock('@/lib/api', () => ({
  default: {
    post: vi.fn(() => Promise.resolve({ data: { success: true, data: {} } })),
    delete: vi.fn(() => Promise.resolve({ data: { success: true, data: {} } })),
  },
}));

function renderWithSWR(
  ui: React.ReactElement,
  fetcher?: (key: string) => unknown,
) {
  return render(
    <SWRConfig
      value={{
        provider: () => new Map(),
        fetcher: fetcher ?? (() => Promise.resolve({ success: true, data: { inWatchlist: false } })),
        dedupingInterval: 0,
      }}
    >
      {ui}
    </SWRConfig>,
  );
}

describe('WatchlistButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with Plus icon when not in watchlist', async () => {
    renderWithSWR(<WatchlistButton contentId="c-1" />);

    const button = await screen.findByTestId('watchlist-button');
    expect(button).toHaveAttribute('aria-label', 'Add to My List');
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders with Check icon when in watchlist', async () => {
    renderWithSWR(
      <WatchlistButton contentId="c-1" />,
      () => Promise.resolve({ success: true, data: { inWatchlist: true } }),
    );

    const button = await screen.findByTestId('watchlist-button');
    expect(button).toHaveAttribute('aria-label', 'Remove from My List');
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('toggles from not-in-list to in-list on click (optimistic)', async () => {
    renderWithSWR(<WatchlistButton contentId="c-1" />);

    const button = await screen.findByTestId('watchlist-button');
    expect(button).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });
  });

  it('calls api.post when adding to watchlist', async () => {
    const apiMock = await import('@/lib/api');
    renderWithSWR(<WatchlistButton contentId="c-1" />);

    const button = await screen.findByTestId('watchlist-button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(apiMock.default.post).toHaveBeenCalledWith('/watchlist/c-1');
    });
  });

  it('calls api.delete when removing from watchlist', async () => {
    const apiMock = await import('@/lib/api');
    renderWithSWR(
      <WatchlistButton contentId="c-1" />,
      () => Promise.resolve({ success: true, data: { inWatchlist: true } }),
    );

    const button = await screen.findByTestId('watchlist-button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(apiMock.default.delete).toHaveBeenCalledWith('/watchlist/c-1');
    });
  });
});
