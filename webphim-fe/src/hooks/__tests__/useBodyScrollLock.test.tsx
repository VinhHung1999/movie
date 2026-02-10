import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBodyScrollLock } from '../useBodyScrollLock';

describe('useBodyScrollLock', () => {
  beforeEach(() => {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
  });

  it('sets body position to fixed when locked', () => {
    renderHook(() => useBodyScrollLock(true));
    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.width).toBe('100%');
  });

  it('does not modify body styles when not locked', () => {
    renderHook(() => useBodyScrollLock(false));
    expect(document.body.style.position).toBe('');
  });

  it('restores body styles on unmount', () => {
    const { unmount } = renderHook(() => useBodyScrollLock(true));
    expect(document.body.style.position).toBe('fixed');

    unmount();
    expect(document.body.style.position).toBe('');
    expect(document.body.style.top).toBe('');
    expect(document.body.style.width).toBe('');
  });

  it('restores body styles when toggled from locked to unlocked', () => {
    const { rerender } = renderHook(
      ({ locked }) => useBodyScrollLock(locked),
      { initialProps: { locked: true } }
    );

    expect(document.body.style.position).toBe('fixed');

    rerender({ locked: false });
    expect(document.body.style.position).toBe('');
  });
});
