import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBodyScrollLock } from '../useBodyScrollLock';

describe('useBodyScrollLock', () => {
  beforeEach(() => {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
  });

  it('locks body scroll when isLocked is true', () => {
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true });

    renderHook(() => useBodyScrollLock(true));

    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.top).toBe('-100px');
    expect(document.body.style.width).toBe('100%');
  });

  it('does not lock scroll when isLocked is false', () => {
    renderHook(() => useBodyScrollLock(false));

    expect(document.body.style.position).toBe('');
    expect(document.body.style.top).toBe('');
  });

  it('restores scroll position on unmount', () => {
    Object.defineProperty(window, 'scrollY', { value: 200, writable: true });
    const scrollToSpy = vi.fn();
    window.scrollTo = scrollToSpy as unknown as typeof window.scrollTo;

    const { unmount } = renderHook(() => useBodyScrollLock(true));

    expect(document.body.style.position).toBe('fixed');

    unmount();

    expect(document.body.style.position).toBe('');
    expect(document.body.style.top).toBe('');
    expect(document.body.style.width).toBe('');
    expect(scrollToSpy).toHaveBeenCalledWith(0, 200);
  });

  it('restores scroll when isLocked changes from true to false', () => {
    Object.defineProperty(window, 'scrollY', { value: 150, writable: true });
    const scrollToSpy = vi.fn();
    window.scrollTo = scrollToSpy as unknown as typeof window.scrollTo;

    const { rerender } = renderHook(
      ({ locked }: { locked: boolean }) => useBodyScrollLock(locked),
      { initialProps: { locked: true } }
    );

    expect(document.body.style.position).toBe('fixed');

    rerender({ locked: false });

    expect(document.body.style.position).toBe('');
    expect(scrollToSpy).toHaveBeenCalledWith(0, 150);
  });
});
