import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfileForm from '../ProfileForm';

describe('ProfileForm', () => {
  const onSubmit = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Add Profile" heading for new profile', () => {
    render(<ProfileForm onSubmit={onSubmit} onCancel={onCancel} />);
    expect(screen.getByText('Add Profile')).toBeInTheDocument();
  });

  it('renders "Edit Profile" heading for existing profile', () => {
    render(
      <ProfileForm
        profile={{ id: 'p-1', name: 'Boss', avatarUrl: null, isKids: false, createdAt: '' }}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
    );
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
  });

  it('pre-fills name for existing profile', () => {
    render(
      <ProfileForm
        profile={{ id: 'p-1', name: 'Boss', avatarUrl: null, isKids: false, createdAt: '' }}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
    );
    expect(screen.getByTestId('profile-name-input')).toHaveValue('Boss');
  });

  it('calls onSubmit with form data', () => {
    render(<ProfileForm onSubmit={onSubmit} onCancel={onCancel} />);

    fireEvent.change(screen.getByTestId('profile-name-input'), { target: { value: 'New Profile' } });
    fireEvent.click(screen.getByTestId('profile-save-button'));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'New Profile',
      avatarUrl: '#E50914', // default color
      isKids: false,
    });
  });

  it('calls onCancel when Cancel clicked', () => {
    render(<ProfileForm onSubmit={onSubmit} onCancel={onCancel} />);
    fireEvent.click(screen.getByTestId('profile-cancel-button'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('renders kids toggle checkbox', () => {
    render(<ProfileForm onSubmit={onSubmit} onCancel={onCancel} />);
    const toggle = screen.getByTestId('kids-toggle');
    expect(toggle).not.toBeChecked();

    fireEvent.click(toggle);
    expect(toggle).toBeChecked();
  });

  it('renders color picker with 8 options', () => {
    render(<ProfileForm onSubmit={onSubmit} onCancel={onCancel} />);
    const picker = screen.getByTestId('color-picker');
    const buttons = picker.querySelectorAll('button');
    expect(buttons).toHaveLength(8);
  });

  it('disables save button when name is empty', () => {
    render(<ProfileForm onSubmit={onSubmit} onCancel={onCancel} />);
    expect(screen.getByTestId('profile-save-button')).toBeDisabled();
  });
});
