import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorPage from '../error';

describe('Error (500)', () => {
  const mockError = new Error('Test error') as Error & { digest?: string };
  const mockReset = vi.fn();

  it('renders 500 heading', () => {
    render(<ErrorPage error={mockError} reset={mockReset} />);
    expect(screen.getByText('500')).toBeInTheDocument();
  });

  it('shows "Something went wrong" message', () => {
    render(<ErrorPage error={mockError} reset={mockReset} />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('calls reset when Try Again clicked', () => {
    render(<ErrorPage error={mockError} reset={mockReset} />);
    fireEvent.click(screen.getByTestId('error-retry-button'));
    expect(mockReset).toHaveBeenCalled();
  });

  it('has link to home page', () => {
    render(<ErrorPage error={mockError} reset={mockReset} />);
    const link = screen.getByTestId('error-home-link');
    expect(link).toHaveAttribute('href', '/home');
  });

  it('logs error to console', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ErrorPage error={mockError} reset={mockReset} />);
    expect(consoleSpy).toHaveBeenCalledWith('Application error:', mockError);
    consoleSpy.mockRestore();
  });
});
