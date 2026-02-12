import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MobileDrawer from '../MobileDrawer';

const mockNavLinks = [
  { href: '/home', label: 'Home' },
  { href: '/browse/series', label: 'Series' },
];

const mockUser = {
  id: '1',
  name: 'Jane Doe',
  email: 'jane@test.com',
  avatar: null,
  createdAt: '',
};

const mockOnClose = vi.fn();
const mockOnSignOut = vi.fn();

const mockActiveProfile = {
  id: 'p1',
  name: 'Jane Profile',
  avatarUrl: '#0073E6',
  isKids: false,
  createdAt: '',
};

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  navLinks: mockNavLinks,
  user: mockUser,
  activeProfile: mockActiveProfile,
  onSignOut: mockOnSignOut,
};

describe('MobileDrawer', () => {
  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSignOut.mockClear();
    document.body.style.overflow = '';
  });

  it('renders nav links and profile info when open', () => {
    render(<MobileDrawer {...defaultProps} />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Series')).toBeInTheDocument();
    expect(screen.getByText('Jane Profile')).toBeInTheDocument();
    expect(screen.getByText('jane@test.com')).toBeInTheDocument();
  });

  it('does not render content when closed', () => {
    render(<MobileDrawer {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Home')).not.toBeInTheDocument();
    expect(screen.queryByText('Jane Profile')).not.toBeInTheDocument();
  });

  it('shows close button', () => {
    render(<MobileDrawer {...defaultProps} />);

    expect(screen.getByLabelText('Close menu')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<MobileDrawer {...defaultProps} />);

    await user.click(screen.getByLabelText('Close menu'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onSignOut and onClose when sign out is clicked', async () => {
    const user = userEvent.setup();
    render(<MobileDrawer {...defaultProps} />);

    await user.click(screen.getByText('Sign out of WebPhim'));
    expect(mockOnSignOut).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('locks body scroll when open', () => {
    render(<MobileDrawer {...defaultProps} />);

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body scroll when closed', () => {
    const { rerender } = render(<MobileDrawer {...defaultProps} />);
    expect(document.body.style.overflow).toBe('hidden');

    rerender(<MobileDrawer {...defaultProps} isOpen={false} />);
    expect(document.body.style.overflow).toBe('');
  });

  it('shows active profile avatar initial', () => {
    render(<MobileDrawer {...defaultProps} />);

    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('falls back to user name when no active profile', () => {
    render(<MobileDrawer {...defaultProps} activeProfile={null} />);

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('includes Account link', () => {
    render(<MobileDrawer {...defaultProps} />);

    expect(screen.getByText('Account')).toBeInTheDocument();
  });
});
