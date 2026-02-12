import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SWRConfig } from 'swr';
import UserTable from '../UserTable';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/admin/users',
  useSearchParams: () => new URLSearchParams(),
}));

const mockUsers = [
  {
    id: 'u1',
    email: 'boss@webphim.com',
    name: 'Boss',
    role: 'ADMIN',
    profileCount: 2,
    createdAt: '2026-02-06T10:00:00Z',
  },
  {
    id: 'u2',
    email: 'user@test.com',
    name: 'Regular User',
    role: 'USER',
    profileCount: 1,
    createdAt: '2026-02-10T10:00:00Z',
  },
];

function renderWithSWR(data: unknown = { success: true, data: mockUsers, meta: { page: 1, limit: 20, total: 2, totalPages: 1 } }) {
  return render(
    <SWRConfig value={{ provider: () => new Map(), fetcher: () => Promise.resolve(data) }}>
      <UserTable />
    </SWRConfig>,
  );
}

describe('UserTable', () => {
  it('renders page title', () => {
    renderWithSWR();
    expect(screen.getByText('Users')).toBeInTheDocument();
  });

  it('renders user data', async () => {
    renderWithSWR();
    expect(await screen.findByText('Boss')).toBeInTheDocument();
    expect(await screen.findByText('boss@webphim.com')).toBeInTheDocument();
    expect(await screen.findByText('Regular User')).toBeInTheDocument();
    expect(await screen.findByText('user@test.com')).toBeInTheDocument();
  });

  it('renders role badges', async () => {
    renderWithSWR();
    expect(await screen.findByText('ADMIN')).toBeInTheDocument();
    expect(await screen.findByText('USER')).toBeInTheDocument();
  });

  it('renders profile counts', async () => {
    renderWithSWR();
    expect(await screen.findByText('2')).toBeInTheDocument();
    expect(await screen.findByText('1')).toBeInTheDocument();
  });

  it('has search input', () => {
    renderWithSWR();
    expect(screen.getByPlaceholderText('Search by name or email...')).toBeInTheDocument();
  });

  it('shows empty state when no users', async () => {
    renderWithSWR({ success: true, data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } });
    expect(await screen.findByText('No users found.')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    renderWithSWR();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
  });
});
