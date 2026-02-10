import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';
import SearchBar from '../SearchBar';

// Mock framer-motion to avoid animation timing issues
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div
        data-testid={props['data-testid'] as string}
      >
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

const mockPush = vi.fn();
vi.mock('next/navigation', async () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

function renderWithSWR(ui: React.ReactElement, fetcher?: (key: string) => unknown) {
  return render(
    <SWRConfig
      value={{
        provider: () => new Map(),
        fetcher: fetcher ?? (() => ({ success: true, data: [] })),
        dedupingInterval: 0,
      }}
    >
      {ui}
    </SWRConfig>,
  );
}

describe('SearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders search toggle button', () => {
    renderWithSWR(<SearchBar />);
    expect(screen.getByTestId('search-toggle')).toBeInTheDocument();
    expect(screen.getByLabelText('Search')).toBeInTheDocument();
  });

  it('expands input when search icon is clicked', async () => {
    vi.useRealTimers();
    renderWithSWR(<SearchBar />);

    fireEvent.click(screen.getByTestId('search-toggle'));

    await waitFor(() => {
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });
  });

  it('has correct aria attributes for accessibility', async () => {
    vi.useRealTimers();
    renderWithSWR(<SearchBar />);

    const toggle = screen.getByTestId('search-toggle');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);

    await waitFor(() => {
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
    });

    const input = screen.getByTestId('search-input');
    expect(input).toHaveAttribute('aria-label', 'Search titles, people, genres');
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(input).toHaveAttribute('aria-controls', 'search-suggestions');
  });

  it('has role="search" container', async () => {
    vi.useRealTimers();
    renderWithSWR(<SearchBar />);
    expect(screen.getByRole('search')).toBeInTheDocument();
  });

  it('navigates to /search?q= on Enter key', async () => {
    vi.useRealTimers();
    renderWithSWR(<SearchBar />);

    fireEvent.click(screen.getByTestId('search-toggle'));

    await waitFor(() => {
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'dark knight' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockPush).toHaveBeenCalledWith('/search?q=dark%20knight');

    // Search bar should clear and collapse after submit
    await waitFor(() => {
      expect(screen.queryByTestId('search-input')).not.toBeInTheDocument();
    });
  });

  it('clears and collapses search bar on Enter submit', async () => {
    vi.useRealTimers();
    renderWithSWR(<SearchBar />);

    fireEvent.click(screen.getByTestId('search-toggle'));

    await waitFor(() => {
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'action' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockPush).toHaveBeenCalledWith('/search?q=action');

    // Input should be cleared and collapsed
    await waitFor(() => {
      expect(screen.queryByTestId('search-input')).not.toBeInTheDocument();
    });
  });

  it('shows clear button when input has text', async () => {
    vi.useRealTimers();
    renderWithSWR(<SearchBar />);

    fireEvent.click(screen.getByTestId('search-toggle'));

    await waitFor(() => {
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'test' } });

    expect(screen.getByTestId('search-clear')).toBeInTheDocument();
  });

  it('clears input when clear button clicked', async () => {
    vi.useRealTimers();
    renderWithSWR(<SearchBar />);

    fireEvent.click(screen.getByTestId('search-toggle'));

    await waitFor(() => {
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.click(screen.getByTestId('search-clear'));

    expect(input).toHaveValue('');
  });

  it('closes on Escape key', async () => {
    vi.useRealTimers();
    renderWithSWR(<SearchBar />);

    fireEvent.click(screen.getByTestId('search-toggle'));

    await waitFor(() => {
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    fireEvent.keyDown(screen.getByTestId('search-input'), { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByTestId('search-input')).not.toBeInTheDocument();
    });
  });

  it('does not show suggestions immediately on type (debounce)', async () => {
    vi.useRealTimers();
    renderWithSWR(<SearchBar />);

    fireEvent.click(screen.getByTestId('search-toggle'));

    await waitFor(() => {
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'test' } });

    // Immediately after typing, no suggestion items should be visible
    // because debounce hasn't fired yet
    expect(screen.queryByTestId('suggestion-item-0')).not.toBeInTheDocument();
  });
});
