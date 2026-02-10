import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfileDeleteDialog from '../ProfileDeleteDialog';

describe('ProfileDeleteDialog', () => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when not open', () => {
    render(
      <ProfileDeleteDialog
        profileName="Boss"
        isOpen={false}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    expect(screen.queryByTestId('delete-dialog')).not.toBeInTheDocument();
  });

  it('renders dialog when open', () => {
    render(
      <ProfileDeleteDialog
        profileName="Boss"
        isOpen={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
    expect(screen.getByText(/Boss/)).toBeInTheDocument();
  });

  it('has role="alertdialog" for accessibility', () => {
    render(
      <ProfileDeleteDialog
        profileName="Boss"
        isOpen={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'delete-dialog-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'delete-dialog-description');
  });

  it('calls onConfirm when Delete clicked', () => {
    render(
      <ProfileDeleteDialog
        profileName="Boss"
        isOpen={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    fireEvent.click(screen.getByTestId('delete-confirm-button'));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('calls onCancel when Cancel clicked', () => {
    render(
      <ProfileDeleteDialog
        profileName="Boss"
        isOpen={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    fireEvent.click(screen.getByTestId('delete-cancel-button'));
    expect(onCancel).toHaveBeenCalled();
  });
});
