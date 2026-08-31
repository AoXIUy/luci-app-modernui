import { useEffect, useRef } from 'react';

export function usePolling(
  fn: () => Promise<void>,
  intervalSeconds: number,
  enabled = true,
): void {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!enabled || intervalSeconds <= 0) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      if (cancelled) return;
      try {
        await fnRef.current();
      } catch {
        // errors are handled inside the callback
      }
      if (!cancelled) {
        timer = setTimeout(tick, intervalSeconds * 1000);
      }
    };

    void tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [intervalSeconds, enabled]);
}
