import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterBar from '../FilterBar';

describe('FilterBar (Task 15.2)', () => {
  const defaultProps = {
    sort: 'newest',
    onTypeChange: vi.fn(),
    onSortChange: vi.fn(),
    onRatingChange: vi.fn(),
  };

  it('renders type chips, sort and rating dropdowns', () => {
    render(<FilterBar {...defaultProps} />);

    expect(screen.getByTestId('filter-bar')).toBeInTheDocument();
    expect(screen.getByTestId('type-chip-all')).toBeInTheDocument();
    expect(screen.getByTestId('type-chip-movies')).toBeInTheDocument();
    expect(screen.getByTestId('type-chip-series')).toBeInTheDocument();
    expect(screen.getByTestId('sort-select')).toBeInTheDocument();
    expect(screen.getByTestId('rating-select')).toBeInTheDocument();
  });

  it('highlights active type chip', () => {
    render(<FilterBar {...defaultProps} type="MOVIE" />);

    const moviesChip = screen.getByTestId('type-chip-movies');
    expect(moviesChip).toHaveAttribute('aria-pressed', 'true');

    const allChip = screen.getByTestId('type-chip-all');
    expect(allChip).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onTypeChange when chip clicked', () => {
    const onTypeChange = vi.fn();
    render(<FilterBar {...defaultProps} onTypeChange={onTypeChange} />);

    fireEvent.click(screen.getByTestId('type-chip-series'));
    expect(onTypeChange).toHaveBeenCalledWith('SERIES');
  });

  it('calls onSortChange when sort dropdown changes', () => {
    const onSortChange = vi.fn();
    render(<FilterBar {...defaultProps} onSortChange={onSortChange} />);

    fireEvent.change(screen.getByTestId('sort-select'), { target: { value: 'views' } });
    expect(onSortChange).toHaveBeenCalledWith('views');
  });

  it('calls onRatingChange when rating dropdown changes', () => {
    const onRatingChange = vi.fn();
    render(<FilterBar {...defaultProps} onRatingChange={onRatingChange} />);

    fireEvent.change(screen.getByTestId('rating-select'), { target: { value: 'PG13' } });
    expect(onRatingChange).toHaveBeenCalledWith('PG13');
  });

  it('clears rating when "All Ratings" selected', () => {
    const onRatingChange = vi.fn();
    render(<FilterBar {...defaultProps} maturityRating="R" onRatingChange={onRatingChange} />);

    fireEvent.change(screen.getByTestId('rating-select'), { target: { value: '' } });
    expect(onRatingChange).toHaveBeenCalledWith(undefined);
  });

  it('has accessible labels for dropdowns', () => {
    render(<FilterBar {...defaultProps} />);

    expect(screen.getByLabelText('Sort by')).toBeInTheDocument();
    expect(screen.getByLabelText('Rating')).toBeInTheDocument();
  });

  it('has aria-label for type filter group', () => {
    render(<FilterBar {...defaultProps} />);

    expect(screen.getByRole('group', { name: 'Content type filter' })).toBeInTheDocument();
  });
});
