import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotFound from '../not-found';

describe('NotFound (404)', () => {
  it('renders 404 heading', () => {
    render(<NotFound />);
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('shows "Lost your way?" message', () => {
    render(<NotFound />);
    expect(screen.getByText('Lost your way?')).toBeInTheDocument();
  });

  it('has link to home page', () => {
    render(<NotFound />);
    const link = screen.getByTestId('not-found-home-link');
    expect(link).toHaveAttribute('href', '/home');
    expect(link).toHaveTextContent('WebPhim Home');
  });

  it('uses <a> tag not Link (server component compatibility)', () => {
    render(<NotFound />);
    const link = screen.getByTestId('not-found-home-link');
    expect(link.tagName).toBe('A');
  });
});
