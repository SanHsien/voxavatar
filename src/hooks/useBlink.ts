import { useCallback, useRef } from 'react';
import type { VRM } from '@pixiv/three-vrm';

const MIN_INTERVAL = 2;
const MAX_INTERVAL = 6;
const DURATION = 0.24;

function nextInterval(): number {
  return MIN_INTERVAL + Math.random() * (MAX_INTERVAL - MIN_INTERVAL);
}

export function useBlink(vrm: VRM | null) {
  const next = useRef(nextInterval());
  const progress = useRef(0);

  return useCallback(
    (delta: number) => {
      if (!vrm?.expressionManager) return;
      if (progress.current > 0) {
        progress.current += delta / DURATION;
        if (progress.current >= 1) {
          progress.current = 0;
          next.current = nextInterval();
          vrm.expressionManager.setValue('blink', 0);
        } else {
          vrm.expressionManager.setValue('blink', Math.sin(progress.current * Math.PI));
        }
        return;
      }
      next.current -= delta;
      if (next.current <= 0) progress.current = Number.EPSILON;
    },
    [vrm],
  );
}
