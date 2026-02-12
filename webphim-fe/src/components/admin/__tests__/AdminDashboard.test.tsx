import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SWRConfig } from 'swr';
import AdminDashboardPage from '@/app/(main)/admin/page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/admin',
  useSearchParams: () => new URLSearchParams(),
}));

const mockStats = {
  totalUsers: 5,
  totalContent: 37,
  totalMovies: 31,
  totalSeries: 6,
  totalViews: 152340,
  totalVideos: 10,
  videosCompleted: 8,
  videosProcessing: 1,
  videosFailed: 1,
};

function renderWithSWR(fetcher: () => unknown) {
  return render(
    <SWRConfig value={{ provider: () => new Map(), fetcher }}>
      <AdminDashboardPage />
    </SWRConfig>,
  );
}

describe('AdminDashboardPage', () => {
  it('renders dashboard title', () => {
    renderWithSWR(() => Promise.resolve({ success: true, data: mockStats }));
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders stat cards with data', async () => {
    renderWithSWR(() => Promise.resolve({ success: true, data: mockStats }));

    expect(await screen.findByText('5')).toBeInTheDocument(); // total users
    expect(await screen.findByText('37')).toBeInTheDocument(); // total content
    expect(await screen.findByText('31 Movies, 6 Series')).toBeInTheDocument();
    expect(await screen.findByText('152,340')).toBeInTheDocument(); // views formatted
    expect(await screen.findByText('10')).toBeInTheDocument(); // videos
    expect(await screen.findByText('8 Done, 1 Processing, 1 Failed')).toBeInTheDocument();
  });

  it('shows loading skeletons before data arrives', () => {
    renderWithSWR(() => new Promise(() => {})); // never resolves
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(4);
  });
});
