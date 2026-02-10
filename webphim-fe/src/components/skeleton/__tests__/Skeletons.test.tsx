import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import HeroBannerSkeleton from '../HeroBannerSkeleton';
import ContentRowSkeleton from '../ContentRowSkeleton';
import MovieCardSkeleton from '../MovieCardSkeleton';

describe('HeroBannerSkeleton', () => {
  it('renders with correct height', () => {
    const { container } = render(<HeroBannerSkeleton />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton.className).toContain('h-[85vh]');
  });

  it('renders pulse animation elements', () => {
    const { container } = render(<HeroBannerSkeleton />);
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThanOrEqual(4);
  });
});

describe('ContentRowSkeleton', () => {
  it('renders title placeholder and 6 card skeletons', () => {
    const { container } = render(<ContentRowSkeleton />);
    const pulseElements = container.querySelectorAll('.animate-pulse');
    // 1 title bar + 6 card skeletons
    expect(pulseElements.length).toBe(7);
  });
});

describe('MovieCardSkeleton', () => {
  it('renders with correct aspect ratio', () => {
    const { container } = render(<MovieCardSkeleton />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton.className).toContain('aspect-[2/3]');
    expect(skeleton.className).toContain('animate-pulse');
  });
});
