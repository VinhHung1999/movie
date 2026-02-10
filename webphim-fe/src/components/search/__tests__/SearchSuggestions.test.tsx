import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SWRConfig } from 'swr';
import SearchSuggestions from '../SearchSuggestions';

const mockSuggestions = [
  { id: '1', title: 'The Dark Knight', type: 'MOVIE' as const, thumbnailUrl: '/thumb1.jpg', releaseYear: 2008 },
  { id: '2', title: 'Dark Shadows', type: 'MOVIE' as const, thumbnailUrl: null, releaseYear: 2012 },
  { id: '3', title: 'Dark Waters', type: 'MOVIE' as const, thumbnailUrl: '/thumb3.jpg', releaseYear: 2019 },
];

const defaultProps = {
  query: 'dark',
  isVisible: true,
  onSelect: vi.fn(),
  onViewAll: vi.fn(),
  selectedIndex: -1,
};

function renderWithSWR(
  ui: React.ReactElement,
  fetcher?: (key: string) => unknown,
) {
  return render(
    <SWRConfig
      value={{
        provider: () => new Map(),
        fetcher:
          fetcher ??
          (() => Promise.resolve({ success: true, data: mockSuggestions })),
        dedupingInterval: 0,
      }}
    >
      {ui}
    </SWRConfig>,
  );
}

describe('SearchSuggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when not visible', () => {
    renderWithSWR(<SearchSuggestions {...defaultProps} isVisible={false} />);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('renders listbox with suggestions', async () => {
    renderWithSWR(<SearchSuggestions {...defaultProps} />);

    // Wait for SWR to resolve
    const items = await screen.findAllByTestId(/suggestion-item-/);
    expect(items).toHaveLength(3);
  });

  it('renders suggestion items with correct content', async () => {
    renderWithSWR(<SearchSuggestions {...defaultProps} />);

    const firstItem = await screen.findByTestId('suggestion-item-0');
    expect(firstItem).toHaveTextContent('The Dark Knight');
    expect(firstItem).toHaveTextContent('MOVIE');
    expect(firstItem).toHaveTextContent('2008');
  });

  it('renders thumbnail image when available', async () => {
    renderWithSWR(
      <SearchSuggestions {...defaultProps} />,
      () => Promise.resolve({
        success: true,
        data: [{ id: '1', title: 'The Dark Knight', type: 'MOVIE', thumbnailUrl: '/thumb1.jpg', releaseYear: 2008 }],
      }),
    );

    await screen.findByTestId('suggestion-item-0');
    const img = screen.getByAltText('');
    expect(img).toHaveAttribute('src', 'http://localhost:5001/thumb1.jpg');
  });

  it('renders placeholder when no thumbnail', async () => {
    renderWithSWR(
      <SearchSuggestions {...defaultProps} />,
      () => Promise.resolve({
        success: true,
        data: [{ id: '2', title: 'Dark Shadows', type: 'MOVIE', thumbnailUrl: null, releaseYear: 2012 }],
      }),
    );

    await screen.findByTestId('suggestion-item-0');
    // No img for null thumbnailUrl, just the placeholder div
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders "View all results" link', async () => {
    renderWithSWR(<SearchSuggestions {...defaultProps} />);

    const viewAll = await screen.findByTestId('view-all-results');
    expect(viewAll).toHaveTextContent("View all results for 'dark'");
  });

  it('calls onSelect when suggestion clicked', async () => {
    const onSelect = vi.fn();
    renderWithSWR(<SearchSuggestions {...defaultProps} onSelect={onSelect} />);

    const firstItem = await screen.findByTestId('suggestion-item-0');
    fireEvent.click(firstItem);

    expect(onSelect).toHaveBeenCalledWith('1');
  });

  it('calls onViewAll when "View all results" clicked', async () => {
    const onViewAll = vi.fn();
    renderWithSWR(<SearchSuggestions {...defaultProps} onViewAll={onViewAll} />);

    const viewAll = await screen.findByTestId('view-all-results');
    fireEvent.click(viewAll);

    expect(onViewAll).toHaveBeenCalled();
  });

  it('highlights selected suggestion with aria-selected', async () => {
    renderWithSWR(<SearchSuggestions {...defaultProps} selectedIndex={1} />);

    const secondItem = await screen.findByTestId('suggestion-item-1');
    expect(secondItem).toHaveAttribute('aria-selected', 'true');

    const firstItem = screen.getByTestId('suggestion-item-0');
    expect(firstItem).toHaveAttribute('aria-selected', 'false');
  });

  it('shows "No suggestions" when query returns empty results', async () => {
    renderWithSWR(
      <SearchSuggestions {...defaultProps} />,
      () => Promise.resolve({ success: true, data: [] }),
    );

    const noSuggestions = await screen.findByTestId('no-suggestions');
    expect(noSuggestions).toHaveTextContent('No suggestions');
  });

  it('has correct ARIA attributes for accessibility', async () => {
    renderWithSWR(<SearchSuggestions {...defaultProps} />);

    const listbox = await screen.findByRole('listbox');
    expect(listbox).toHaveAttribute('id', 'search-suggestions');
    expect(listbox).toHaveAttribute('aria-label', 'Search suggestions');

    const options = await screen.findAllByRole('option');
    expect(options.length).toBeGreaterThan(0);
  });
});
