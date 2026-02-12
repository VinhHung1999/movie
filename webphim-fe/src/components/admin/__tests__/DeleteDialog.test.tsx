import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DeleteDialog from '../DeleteDialog';

describe('DeleteDialog', () => {
  it('renders nothing when not open', () => {
    const { container } = render(
      <DeleteDialog isOpen={false} title="Movie" onCancel={vi.fn()} onConfirm={vi.fn()} isDeleting={false} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders title and warning when open', () => {
    render(
      <DeleteDialog isOpen={true} title="Test Movie" onCancel={vi.fn()} onConfirm={vi.fn()} isDeleting={false} />,
    );
    expect(screen.getByText(/Delete "Test Movie"\?/)).toBeInTheDocument();
    expect(screen.getByText(/permanently delete/)).toBeInTheDocument();
  });

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn();
    render(
      <DeleteDialog isOpen={true} title="Test" onCancel={onCancel} onConfirm={vi.fn()} isDeleting={false} />,
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when Delete is clicked', () => {
    const onConfirm = vi.fn();
    render(
      <DeleteDialog isOpen={true} title="Test" onCancel={vi.fn()} onConfirm={onConfirm} isDeleting={false} />,
    );
    fireEvent.click(screen.getByText('Delete'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('shows deleting state', () => {
    render(
      <DeleteDialog isOpen={true} title="Test" onCancel={vi.fn()} onConfirm={vi.fn()} isDeleting={true} />,
    );
    expect(screen.getByText('Deleting...')).toBeInTheDocument();
  });

  it('has alertdialog role', () => {
    render(
      <DeleteDialog isOpen={true} title="Test" onCancel={vi.fn()} onConfirm={vi.fn()} isDeleting={false} />,
    );
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });
});
