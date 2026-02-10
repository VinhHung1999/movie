import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';
import RatingButtons from '../RatingButtons';

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
        fetcher: fetcher ?? (() => Promise.resolve({ success: true, data: null })),
        dedupingInterval: 0,
      }}
    >
      {ui}
    </SWRConfig>,
  );
}

describe('RatingButtons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders thumbs up and thumbs down buttons', async () => {
    renderWithSWR(<RatingButtons contentId="c-1" />);

    const up = await screen.findByTestId('rate-thumbs-up');
    const down = screen.getByTestId('rate-thumbs-down');
    expect(up).toBeInTheDocument();
    expect(down).toBeInTheDocument();
  });

  it('shows no active rating when data is null', async () => {
    renderWithSWR(<RatingButtons contentId="c-1" />);

    const up = await screen.findByTestId('rate-thumbs-up');
    const down = screen.getByTestId('rate-thumbs-down');
    expect(up).toHaveAttribute('aria-pressed', 'false');
    expect(down).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows thumbs up active when score is 1', async () => {
    renderWithSWR(
      <RatingButtons contentId="c-1" />,
      () => Promise.resolve({
        success: true,
        data: { contentId: 'c-1', score: 1, updatedAt: '2026-01-01T00:00:00Z' },
      }),
    );

    const up = await screen.findByTestId('rate-thumbs-up');
    expect(up).toHaveAttribute('aria-pressed', 'true');

    const down = screen.getByTestId('rate-thumbs-down');
    expect(down).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows thumbs down active when score is 2', async () => {
    renderWithSWR(
      <RatingButtons contentId="c-1" />,
      () => Promise.resolve({
        success: true,
        data: { contentId: 'c-1', score: 2, updatedAt: '2026-01-01T00:00:00Z' },
      }),
    );

    const down = await screen.findByTestId('rate-thumbs-down');
    expect(down).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls api.post with score on thumbs up click', async () => {
    const apiMock = await import('@/lib/api');
    renderWithSWR(<RatingButtons contentId="c-1" />);

    const up = await screen.findByTestId('rate-thumbs-up');
    fireEvent.click(up);

    await waitFor(() => {
      expect(apiMock.default.post).toHaveBeenCalledWith('/ratings/c-1', { score: 1 });
    });
  });

  it('calls api.delete when clicking active rating (toggle off)', async () => {
    const apiMock = await import('@/lib/api');
    renderWithSWR(
      <RatingButtons contentId="c-1" />,
      () => Promise.resolve({
        success: true,
        data: { contentId: 'c-1', score: 1, updatedAt: '2026-01-01T00:00:00Z' },
      }),
    );

    const up = await screen.findByTestId('rate-thumbs-up');
    fireEvent.click(up);

    await waitFor(() => {
      expect(apiMock.default.delete).toHaveBeenCalledWith('/ratings/c-1');
    });
  });

  it('has accessible group wrapper', async () => {
    renderWithSWR(<RatingButtons contentId="c-1" />);

    const group = await screen.findByRole('group');
    expect(group).toHaveAttribute('aria-label', 'Rate this title');
  });
});
