import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminLayout from '../AdminLayout';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/admin',
  useSearchParams: () => new URLSearchParams(),
}));

const mockUseAuthStore = vi.fn();
vi.mock('@/store/auth.store', () => ({
  useAuthStore: (selector: (s: unknown) => unknown) => mockUseAuthStore(selector),
}));

describe('AdminLayout', () => {
  it('renders sidebar nav and children when user is ADMIN', () => {
    mockUseAuthStore.mockImplementation((selector: (s: { user: { role: string } }) => unknown) =>
      selector({ user: { role: 'ADMIN' } } as never),
    );

    render(<AdminLayout><div>Dashboard Content</div></AdminLayout>);

    // Both sidebar and mobile nav render in jsdom (no CSS media queries)
    expect(screen.getAllByText('Dashboard')).toHaveLength(2);
    expect(screen.getAllByText('Content')).toHaveLength(2);
    expect(screen.getAllByText('Upload')).toHaveLength(2);
    expect(screen.getAllByText('Users')).toHaveLength(2);
    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
  });

  it('shows checking permissions when user is not admin', () => {
    mockUseAuthStore.mockImplementation((selector: (s: { user: { role: string } }) => unknown) =>
      selector({ user: { role: 'USER' } } as never),
    );

    render(<AdminLayout><div>Dashboard Content</div></AdminLayout>);

    expect(screen.getByText('Checking permissions...')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
  });

  it('redirects non-admin user to /home', () => {
    mockUseAuthStore.mockImplementation((selector: (s: { user: { role: string } }) => unknown) =>
      selector({ user: { role: 'USER' } } as never),
    );

    render(<AdminLayout><div>Dashboard Content</div></AdminLayout>);

    expect(mockPush).toHaveBeenCalledWith('/home');
  });

  it('highlights active nav link', () => {
    mockUseAuthStore.mockImplementation((selector: (s: { user: { role: string } }) => unknown) =>
      selector({ user: { role: 'ADMIN' } } as never),
    );

    render(<AdminLayout><div>Content</div></AdminLayout>);

    // Dashboard link should have aria-current="page" since pathname is /admin
    const dashboardLinks = screen.getAllByText('Dashboard');
    const sidebarLink = dashboardLinks.find((el) => el.closest('a')?.getAttribute('aria-current') === 'page');
    expect(sidebarLink).toBeDefined();
  });
});
