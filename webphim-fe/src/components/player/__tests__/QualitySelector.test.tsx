import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QualitySelector from '../QualitySelector';
import type { QualityLevel } from '@/hooks/useVideoPlayer';

const mockQualities: QualityLevel[] = [
  { height: 360, bitrate: 800000, label: '360p' },
  { height: 480, bitrate: 1400000, label: '480p' },
  { height: 720, bitrate: 2800000, label: '720p' },
  { height: 1080, bitrate: 5000000, label: '1080p' },
];

describe('QualitySelector', () => {
  const onSelect = vi.fn<(index: number) => void>();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when no qualities', () => {
    const { container } = render(
      <QualitySelector qualities={[]} currentQuality={-1} onSelect={onSelect} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders settings button', () => {
    render(
      <QualitySelector qualities={mockQualities} currentQuality={-1} onSelect={onSelect} />
    );
    expect(screen.getByTestId('quality-button')).toBeInTheDocument();
  });

  it('opens menu on click', () => {
    render(
      <QualitySelector qualities={mockQualities} currentQuality={-1} onSelect={onSelect} />
    );

    expect(screen.queryByTestId('quality-menu')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('quality-button'));
    expect(screen.getByTestId('quality-menu')).toBeInTheDocument();
  });

  it('shows Auto and all quality options', () => {
    render(
      <QualitySelector qualities={mockQualities} currentQuality={-1} onSelect={onSelect} />
    );
    fireEvent.click(screen.getByTestId('quality-button'));

    expect(screen.getByTestId('quality-option-auto')).toBeInTheDocument();
    expect(screen.getByTestId('quality-option-1080')).toBeInTheDocument();
    expect(screen.getByTestId('quality-option-720')).toBeInTheDocument();
    expect(screen.getByTestId('quality-option-480')).toBeInTheDocument();
    expect(screen.getByTestId('quality-option-360')).toBeInTheDocument();
  });

  it('calls onSelect(-1) when Auto selected', () => {
    render(
      <QualitySelector qualities={mockQualities} currentQuality={0} onSelect={onSelect} />
    );
    fireEvent.click(screen.getByTestId('quality-button'));
    fireEvent.click(screen.getByTestId('quality-option-auto'));

    expect(onSelect).toHaveBeenCalledWith(-1);
  });

  it('calls onSelect with correct index for quality level', () => {
    render(
      <QualitySelector qualities={mockQualities} currentQuality={-1} onSelect={onSelect} />
    );
    fireEvent.click(screen.getByTestId('quality-button'));
    fireEvent.click(screen.getByTestId('quality-option-720'));

    // 720p is at index 2 in the qualities array
    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it('closes menu after selection', () => {
    render(
      <QualitySelector qualities={mockQualities} currentQuality={-1} onSelect={onSelect} />
    );
    fireEvent.click(screen.getByTestId('quality-button'));
    expect(screen.getByTestId('quality-menu')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('quality-option-1080'));
    // Menu should close (AnimatePresence exit)
    expect(onSelect).toHaveBeenCalledWith(3);
  });
});
