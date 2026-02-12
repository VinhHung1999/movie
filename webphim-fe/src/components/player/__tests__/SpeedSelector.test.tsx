import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SpeedSelector from '../SpeedSelector';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div data-testid={props['data-testid'] as string} role={props.role as string}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

describe('SpeedSelector', () => {
  const onSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders speed button with current speed', () => {
    render(<SpeedSelector currentSpeed={1} onSelect={onSelect} />);
    expect(screen.getByTestId('speed-button')).toHaveTextContent('1x');
  });

  it('shows non-1x speed label', () => {
    render(<SpeedSelector currentSpeed={1.5} onSelect={onSelect} />);
    expect(screen.getByTestId('speed-button')).toHaveTextContent('1.5x');
  });

  it('opens menu on click', () => {
    render(<SpeedSelector currentSpeed={1} onSelect={onSelect} />);
    expect(screen.queryByTestId('speed-menu')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('speed-button'));
    expect(screen.getByTestId('speed-menu')).toBeInTheDocument();
  });

  it('shows all 6 speed options', () => {
    render(<SpeedSelector currentSpeed={1} onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId('speed-button'));

    expect(screen.getByTestId('speed-option-0.5')).toBeInTheDocument();
    expect(screen.getByTestId('speed-option-0.75')).toBeInTheDocument();
    expect(screen.getByTestId('speed-option-1')).toBeInTheDocument();
    expect(screen.getByTestId('speed-option-1.25')).toBeInTheDocument();
    expect(screen.getByTestId('speed-option-1.5')).toBeInTheDocument();
    expect(screen.getByTestId('speed-option-2')).toBeInTheDocument();
  });

  it('calls onSelect and closes menu when option clicked', () => {
    render(<SpeedSelector currentSpeed={1} onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId('speed-button'));
    fireEvent.click(screen.getByTestId('speed-option-1.5'));

    expect(onSelect).toHaveBeenCalledWith(1.5);
  });

  it('marks current speed with aria-checked', () => {
    render(<SpeedSelector currentSpeed={1.25} onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId('speed-button'));

    expect(screen.getByTestId('speed-option-1.25')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('speed-option-1')).toHaveAttribute('aria-checked', 'false');
  });

  it('has correct aria-label on button', () => {
    render(<SpeedSelector currentSpeed={1} onSelect={onSelect} />);
    expect(screen.getByTestId('speed-button')).toHaveAttribute('aria-label', 'Playback speed');
  });
});
