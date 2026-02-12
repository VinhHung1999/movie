import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import NewBadge from '../NewBadge';

describe('NewBadge', () => {
  it('renders with "New" text', () => {
    render(<NewBadge />);
    expect(screen.getByTestId('new-badge')).toHaveTextContent('New');
  });

  it('has correct aria-label for accessibility', () => {
    render(<NewBadge />);
    expect(screen.getByTestId('new-badge')).toHaveAttribute('aria-label', 'Recently added');
  });

  it('has absolute positioning classes', () => {
    render(<NewBadge />);
    const badge = screen.getByTestId('new-badge');
    expect(badge.className).toContain('absolute');
    expect(badge.className).toContain('z-10');
  });
});
