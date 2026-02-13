import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GlobalError from '../global-error';

describe('GlobalError', () => {
  const mockError = new Error('Root error') as Error & { digest?: string };
  const mockReset = vi.fn();

  it('renders Error heading', () => {
    render(<GlobalError error={mockError} reset={mockReset} />);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('renders "Something went wrong" text', () => {
    render(<GlobalError error={mockError} reset={mockReset} />);
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
  });

  it('calls reset when Try Again clicked', () => {
    render(<GlobalError error={mockError} reset={mockReset} />);
    fireEvent.click(screen.getByText('Try Again'));
    expect(mockReset).toHaveBeenCalled();
  });

  it('renders its own html and body elements', () => {
    const { container } = render(<GlobalError error={mockError} reset={mockReset} />);
    expect(container.querySelector('h1')).toHaveTextContent('Error');
    expect(container.querySelector('button')).toHaveTextContent('Try Again');
  });
});
