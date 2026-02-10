import { useCallback, useEffect, useRef } from 'react';

export function useIntersectionObserver(
  callback: () => void,
  options?: IntersectionObserverInit
): React.RefCallback<HTMLDivElement> {
  const callbackRef = useRef(callback);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  });

  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (!node) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            callbackRef.current();
          }
        },
        { threshold: 0.1, ...options }
      );

      observer.observe(node);
      observerRef.current = observer;
    },
    [options]
  );

  return ref;
}
