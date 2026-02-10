import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useIntersectionObserver } from '../useIntersectionObserver';

let observeCallback: IntersectionObserverCallback;
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  global.IntersectionObserver = vi.fn(function (
    this: IntersectionObserver,
    callback: IntersectionObserverCallback
  ) {
    observeCallback = callback;
    Object.assign(this, {
      observe: mockObserve,
      disconnect: mockDisconnect,
      unobserve: vi.fn(),
      root: null,
      rootMargin: '',
      thresholds: [],
      takeRecords: vi.fn(() => []),
    });
  }) as unknown as typeof IntersectionObserver;
});

function TestComponent({ callback }: { callback: () => void }) {
  const ref = useIntersectionObserver(callback);
  return <div ref={ref} data-testid="sentinel" />;
}

describe('useIntersectionObserver', () => {
  it('creates IntersectionObserver and observes sentinel', () => {
    const callback = vi.fn();
    render(<TestComponent callback={callback} />);
    expect(global.IntersectionObserver).toHaveBeenCalled();
    expect(mockObserve).toHaveBeenCalled();
  });

  it('calls callback when sentinel intersects', () => {
    const callback = vi.fn();
    render(<TestComponent callback={callback} />);
    observeCallback(
      [{ isIntersecting: true }] as IntersectionObserverEntry[],
      {} as IntersectionObserver
    );
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('does not call callback when not intersecting', () => {
    const callback = vi.fn();
    render(<TestComponent callback={callback} />);
    observeCallback(
      [{ isIntersecting: false }] as IntersectionObserverEntry[],
      {} as IntersectionObserver
    );
    expect(callback).not.toHaveBeenCalled();
  });

  it('disconnects observer on unmount', () => {
    const callback = vi.fn();
    const { unmount } = render(<TestComponent callback={callback} />);
    unmount();
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('renders sentinel element in DOM', () => {
    const callback = vi.fn();
    render(<TestComponent callback={callback} />);
    expect(screen.getByTestId('sentinel')).toBeInTheDocument();
  });
});
