import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchFilters from '../SearchFilters';
import type { SearchFilterState, Genre } from '@/types';

const mockGenres: Genre[] = [
  { id: '1', name: 'Action', slug: 'action' },
  { id: '2', name: 'Drama', slug: 'drama' },
  { id: '3', name: 'Comedy', slug: 'comedy' },
];

const defaultFilters: SearchFilterState = {
  type: undefined,
  genre: undefined,
  yearFrom: undefined,
  yearTo: undefined,
  sort: 'relevance',
};

describe('SearchFilters', () => {
  let onFilterChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onFilterChange = vi.fn();
  });

  it('renders type filter with All, Movies, Series options', () => {
    render(
      <SearchFilters filters={defaultFilters} onFilterChange={onFilterChange} genres={mockGenres} />,
    );

    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByLabelText('All')).toBeInTheDocument();
    expect(screen.getByLabelText('Movies')).toBeInTheDocument();
    expect(screen.getByLabelText('Series')).toBeInTheDocument();
  });

  it('renders genre filter checkboxes', () => {
    render(
      <SearchFilters filters={defaultFilters} onFilterChange={onFilterChange} genres={mockGenres} />,
    );

    expect(screen.getByText('Genre')).toBeInTheDocument();
    expect(screen.getByLabelText('Action')).toBeInTheDocument();
    expect(screen.getByLabelText('Drama')).toBeInTheDocument();
    expect(screen.getByLabelText('Comedy')).toBeInTheDocument();
  });

  it('calls onFilterChange with MOVIE when Movies clicked', () => {
    render(
      <SearchFilters filters={defaultFilters} onFilterChange={onFilterChange} genres={mockGenres} />,
    );

    fireEvent.click(screen.getByLabelText('Movies'));

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'MOVIE' }),
    );
  });

  it('calls onFilterChange with genre slug when genre clicked', () => {
    render(
      <SearchFilters filters={defaultFilters} onFilterChange={onFilterChange} genres={mockGenres} />,
    );

    fireEvent.click(screen.getByLabelText('Action'));

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ genre: 'action' }),
    );
  });

  it('selects "All Genres" to clear genre filter', () => {
    render(
      <SearchFilters
        filters={{ ...defaultFilters, genre: 'action' }}
        onFilterChange={onFilterChange}
        genres={mockGenres}
      />,
    );

    fireEvent.click(screen.getByLabelText('All Genres'));

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ genre: undefined }),
    );
  });

  it('renders year range inputs', () => {
    render(
      <SearchFilters filters={defaultFilters} onFilterChange={onFilterChange} genres={mockGenres} />,
    );

    expect(screen.getByText('Year Range')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('From')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('To')).toBeInTheDocument();
  });

  it('calls onFilterChange with yearFrom when From input changes', () => {
    render(
      <SearchFilters filters={defaultFilters} onFilterChange={onFilterChange} genres={mockGenres} />,
    );

    fireEvent.change(screen.getByPlaceholderText('From'), { target: { value: '2000' } });

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ yearFrom: 2000 }),
    );
  });

  it('renders sort dropdown with correct options', () => {
    render(
      <SearchFilters filters={defaultFilters} onFilterChange={onFilterChange} genres={mockGenres} />,
    );

    expect(screen.getByText('Sort By')).toBeInTheDocument();
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('relevance');
  });

  it('calls onFilterChange when sort changes', () => {
    render(
      <SearchFilters filters={defaultFilters} onFilterChange={onFilterChange} genres={mockGenres} />,
    );

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'newest' } });

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ sort: 'newest' }),
    );
  });

  it('has fieldset/legend for accessibility', () => {
    render(
      <SearchFilters filters={defaultFilters} onFilterChange={onFilterChange} genres={mockGenres} />,
    );

    const fieldsets = screen.getAllByRole('group');
    expect(fieldsets.length).toBeGreaterThanOrEqual(3);
  });

  it('toggles mobile filter panel', () => {
    // Set viewport to mobile-like (md breakpoint)
    render(
      <SearchFilters filters={defaultFilters} onFilterChange={onFilterChange} genres={mockGenres} />,
    );

    const toggle = screen.getByTestId('mobile-filter-toggle');
    expect(toggle).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.getByTestId('mobile-filters')).toBeInTheDocument();
  });

  it('renders maturity rating filter with all options', () => {
    render(
      <SearchFilters filters={defaultFilters} onFilterChange={onFilterChange} genres={mockGenres} />,
    );

    expect(screen.getByText('Rating')).toBeInTheDocument();
    expect(screen.getByLabelText('All Ratings')).toBeInTheDocument();
    expect(screen.getByLabelText('G')).toBeInTheDocument();
    expect(screen.getByLabelText('PG')).toBeInTheDocument();
    expect(screen.getByLabelText('PG-13')).toBeInTheDocument();
    expect(screen.getByLabelText('R')).toBeInTheDocument();
    expect(screen.getByLabelText('NC-17')).toBeInTheDocument();
  });

  it('calls onFilterChange with maturityRating when rating clicked', () => {
    render(
      <SearchFilters filters={defaultFilters} onFilterChange={onFilterChange} genres={mockGenres} />,
    );

    fireEvent.click(screen.getByLabelText('PG-13'));

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ maturityRating: 'PG13' }),
    );
  });

  it('clears maturityRating when All Ratings selected', () => {
    render(
      <SearchFilters
        filters={{ ...defaultFilters, maturityRating: 'R' }}
        onFilterChange={onFilterChange}
        genres={mockGenres}
      />,
    );

    fireEvent.click(screen.getByLabelText('All Ratings'));

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ maturityRating: undefined }),
    );
  });

  it('has radiogroup role for maturity rating filter', () => {
    render(
      <SearchFilters filters={defaultFilters} onFilterChange={onFilterChange} genres={mockGenres} />,
    );

    expect(screen.getByRole('radiogroup', { name: 'Maturity rating filter' })).toBeInTheDocument();
  });
});
