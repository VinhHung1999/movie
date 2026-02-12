import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthNavbar from '../AuthNavbar';

// Mock the auth store
const mockClearAuth = vi.fn();
vi.mock('@/store/auth.store', () => ({
  useAuthStore: () => ({
    user: { id: '1', name: 'John Doe', email: 'john@test.com', avatar: null, createdAt: '' },
    clearAuth: mockClearAuth,
  }),
}));

// Mock the API module
vi.mock('@/lib/api', () => ({
  default: { post: vi.fn().mockResolvedValue({}) },
}));

// Mock useScrollPosition hook
let mockScrolled = false;
vi.mock('@/hooks/useScrollPosition', () => ({
  useScrollPosition: () => mockScrolled,
}));

describe('AuthNavbar', () => {
  beforeEach(() => {
    mockScrolled = false;
    mockClearAuth.mockClear();
  });

  it('renders logo and nav links', () => {
    render(<AuthNavbar />);

    expect(screen.getByText('WEBPHIM')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Series')).toBeInTheDocument();
    expect(screen.getByText('Movies')).toBeInTheDocument();
    expect(screen.getByText('My List')).toBeInTheDocument();
  });

  it('renders search icon and no notification bell', () => {
    render(<AuthNavbar />);

    expect(screen.getByLabelText('Search')).toBeInTheDocument();
    expect(screen.queryByLabelText('Notifications')).not.toBeInTheDocument();
  });

  it('has transparent background when not scrolled', () => {
    mockScrolled = false;
    const { container } = render(<AuthNavbar />);
    const nav = container.querySelector('nav');

    expect(nav?.className).toContain('from-black/80');
    expect(nav?.className).not.toContain('bg-netflix-black');
  });

  it('has solid background when scrolled', () => {
    mockScrolled = true;
    const { container } = render(<AuthNavbar />);
    const nav = container.querySelector('nav');

    expect(nav?.className).toContain('bg-netflix-black');
  });

  it('shows profile avatar with first letter of name', () => {
    render(<AuthNavbar />);

    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('toggles profile dropdown on click', async () => {
    const user = userEvent.setup();
    render(<AuthNavbar />);

    // Dropdown should not be visible initially
    expect(screen.queryByText('john@test.com')).not.toBeInTheDocument();

    // Click the profile button (the one containing 'J' avatar)
    const avatar = screen.getByText('J');
    await user.click(avatar.closest('button')!);

    // Dropdown should be visible
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@test.com')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('Sign out of WebPhim')).toBeInTheDocument();
  });

  it('closes profile dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    render(<AuthNavbar />);

    // Open dropdown
    const avatar = screen.getByText('J');
    await user.click(avatar.closest('button')!);
    expect(screen.getByText('john@test.com')).toBeInTheDocument();

    // Click outside
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('john@test.com')).not.toBeInTheDocument();
  });

  it('renders hamburger button for mobile', () => {
    render(<AuthNavbar />);

    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
  });
});
