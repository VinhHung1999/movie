import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SWRConfig } from 'swr';
import ContentTable from '../ContentTable';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/admin/content',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/api', () => ({
  default: { delete: vi.fn().mockResolvedValue({}) },
}));

const mockItems = [
  {
    id: 'c1',
    type: 'MOVIE',
    title: 'Test Movie',
    releaseYear: 2025,
    maturityRating: 'PG13',
    duration: 120,
    viewCount: 5000,
    hasVideo: true,
    videoStatus: 'COMPLETED',
    genreNames: ['Action'],
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'c2',
    type: 'SERIES',
    title: 'Test Series',
    releaseYear: 2024,
    maturityRating: 'R',
    duration: null,
    viewCount: 1000,
    hasVideo: false,
    videoStatus: null,
    genreNames: ['Drama'],
    createdAt: '2026-01-01T00:00:00Z',
  },
];

function renderWithSWR(data: unknown = { success: true, data: mockItems, meta: { page: 1, limit: 20, total: 2, totalPages: 1 } }) {
  return render(
    <SWRConfig value={{ provider: () => new Map(), fetcher: () => Promise.resolve(data) }}>
      <ContentTable />
    </SWRConfig>,
  );
}

describe('ContentTable', () => {
  it('renders table header and content title', async () => {
    renderWithSWR();
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(await screen.findByText('Test Movie')).toBeInTheDocument();
    expect(await screen.findByText('Test Series')).toBeInTheDocument();
  });

  it('renders Add Content link', () => {
    renderWithSWR();
    expect(screen.getByText('Add Content')).toBeInTheDocument();
  });

  it('renders type badges', async () => {
    renderWithSWR();
    expect(await screen.findByText('MOVIE')).toBeInTheDocument();
    expect(await screen.findByText('SERIES')).toBeInTheDocument();
  });

  it('renders video status for items with video', async () => {
    renderWithSWR();
    expect(await screen.findByText('COMPLETED')).toBeInTheDocument();
    expect(await screen.findByText('No video')).toBeInTheDocument();
  });

  it('has edit and delete actions', async () => {
    renderWithSWR();
    await screen.findByText('Test Movie');
    expect(screen.getByLabelText('Edit Test Movie')).toBeInTheDocument();
    expect(screen.getByLabelText('Delete Test Movie')).toBeInTheDocument();
  });

  it('opens delete dialog when delete button is clicked', async () => {
    renderWithSWR();
    await screen.findByText('Test Movie');
    fireEvent.click(screen.getByLabelText('Delete Test Movie'));
    expect(screen.getByText(/Delete "Test Movie"\?/)).toBeInTheDocument();
  });

  it('shows search input', () => {
    renderWithSWR();
    expect(screen.getByPlaceholderText('Search by title...')).toBeInTheDocument();
  });

  it('shows type filter', () => {
    renderWithSWR();
    expect(screen.getByText('All Types')).toBeInTheDocument();
  });

  it('shows empty state when no items', async () => {
    renderWithSWR({ success: true, data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } });
    expect(await screen.findByText('No content found.')).toBeInTheDocument();
  });
});
