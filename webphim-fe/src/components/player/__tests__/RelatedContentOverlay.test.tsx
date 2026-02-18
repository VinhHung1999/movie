import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

const mockPush = vi.fn();

vi.mock('next/navigation', async () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/watch/c1',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div data-testid={props['data-testid'] as string} role={props['role'] as string} aria-label={props['aria-label'] as string}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

const mockSimilar = {
  success: true,
  data: [
    {
      id: 's1',
      type: 'MOVIE',
      title: 'Similar Movie 1',
      description: 'desc',
      releaseYear: 2024,
      maturityRating: 'PG',
      duration: 100,
      thumbnailUrl: '/similar1.jpg',
      bannerUrl: null,
      viewCount: 500,
      genres: [],
    },
    {
      id: 's2',
      type: 'SERIES',
      title: 'Similar Series 1',
      description: 'desc',
      releaseYear: 2023,
      maturityRating: 'PG13',
      duration: null,
      thumbnailUrl: null,
      bannerUrl: null,
      viewCount: 300,
      genres: [],
    },
  ],
};

const swrDataMap: Record<string, unknown> = {};

vi.mock('swr', () => ({
  default: (key: string | null) => {
    if (!key) return { data: undefined, error: undefined, isLoading: false };
    const data = swrDataMap[key];
    return {
      data,
      error: undefined,
      isLoading: !data,
      mutate: vi.fn(),
    };
  },
  SWRConfig: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

let RelatedContentOverlay: React.ComponentType<{ contentId: string; onDismiss: () => void }>;

beforeEach(async () => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  Object.keys(swrDataMap).forEach((k) => delete swrDataMap[k]);
  swrDataMap['/content/c1/similar?limit=4'] = mockSimilar;

  vi.resetModules();
  const mod = await import('../RelatedContentOverlay');
  RelatedContentOverlay = mod.default;
});

describe('RelatedContentOverlay (Task 15.3)', () => {
  it('renders "More Like This" heading', () => {
    render(<RelatedContentOverlay contentId="c1" onDismiss={vi.fn()} />);

    expect(screen.getByText('More Like This')).toBeInTheDocument();
  });

  it('renders related content items', () => {
    render(<RelatedContentOverlay contentId="c1" onDismiss={vi.fn()} />);

    expect(screen.getByTestId('related-item-s1')).toBeInTheDocument();
    expect(screen.getByTestId('related-item-s2')).toBeInTheDocument();
  });

  it('shows thumbnail for items with thumbnailUrl', () => {
    render(<RelatedContentOverlay contentId="c1" onDismiss={vi.fn()} />);

    expect(screen.getByAltText('Similar Movie 1')).toBeInTheDocument();
  });

  it('shows fallback for items without thumbnail', () => {
    render(<RelatedContentOverlay contentId="c1" onDismiss={vi.fn()} />);

    // The item without thumbnail should show its title as text
    const items = screen.getAllByText('Similar Series 1');
    expect(items.length).toBeGreaterThanOrEqual(1);
  });

  it('navigates to title page on item click', () => {
    render(<RelatedContentOverlay contentId="c1" onDismiss={vi.fn()} />);

    fireEvent.click(screen.getByTestId('related-item-s1'));
    expect(mockPush).toHaveBeenCalledWith('/title/s1');
  });

  it('calls onDismiss when dismiss button clicked', () => {
    const onDismiss = vi.fn();
    render(<RelatedContentOverlay contentId="c1" onDismiss={onDismiss} />);

    fireEvent.click(screen.getByTestId('related-content-dismiss'));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('auto-dismisses after 15 seconds', () => {
    const onDismiss = vi.fn();
    render(<RelatedContentOverlay contentId="c1" onDismiss={onDismiss} />);

    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(15000);
    });

    expect(onDismiss).toHaveBeenCalled();
  });

  it('has role="dialog" and aria-label', () => {
    render(<RelatedContentOverlay contentId="c1" onDismiss={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: 'Related content' })).toBeInTheDocument();
  });

  it('dismiss button has aria-label', () => {
    render(<RelatedContentOverlay contentId="c1" onDismiss={vi.fn()} />);

    expect(screen.getByLabelText('Dismiss')).toBeInTheDocument();
  });

  it('returns null when no similar content', () => {
    swrDataMap['/content/c1/similar?limit=4'] = { success: true, data: [] };

    const { container } = render(<RelatedContentOverlay contentId="c1" onDismiss={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });
});
