import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SearchEmptyState from '../SearchEmptyState';

describe('SearchEmptyState (Task 9.6)', () => {
  it('renders the empty state container', () => {
    render(<SearchEmptyState query="xyznonexistent" />);

    expect(screen.getByTestId('search-empty-state')).toBeInTheDocument();
  });

  it('displays "No results found" with the query', () => {
    render(<SearchEmptyState query="dark knight" />);

    expect(screen.getByText(/No results found for/)).toBeInTheDocument();
    expect(screen.getByText(/dark knight/)).toBeInTheDocument();
  });

  it('shows 3 suggestion tips', () => {
    render(<SearchEmptyState query="test" />);

    const list = screen.getByTestId('suggestions-list');
    expect(list).toBeInTheDocument();

    expect(screen.getByText('Try different keywords')).toBeInTheDocument();
    expect(screen.getByText('Check your spelling')).toBeInTheDocument();
    expect(screen.getByText('Try more general terms')).toBeInTheDocument();
  });

  it('has role="status" for screen readers', () => {
    render(<SearchEmptyState query="test" />);

    const container = screen.getByTestId('search-empty-state');
    expect(container).toHaveAttribute('role', 'status');
  });

  it('has aria-live="polite" so screen readers announce empty state', () => {
    render(<SearchEmptyState query="test" />);

    const container = screen.getByTestId('search-empty-state');
    expect(container).toHaveAttribute('aria-live', 'polite');
  });

  it('renders search icon', () => {
    render(<SearchEmptyState query="test" />);

    // lucide-react Search icon renders as SVG
    const svg = screen.getByTestId('search-empty-state').querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
