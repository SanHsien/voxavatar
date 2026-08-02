import { useCallback, useRef } from 'react';
import type { VRM } from '@pixiv/three-vrm';
import { computeLipSyncOpen } from '../lip-sync-gain';

const VISEMES = ['aa', 'ee', 'ih', 'oh', 'ou'] as const;

export interface AmplitudeLipSyncOptions {
  /** 預設頭部螢幕高度（px）；每幀可再以第四參數覆寫。 */
  headHeightPx?: number | null;
  intensity?: number;
  minOpen?: number;
}

export function useAmplitudeLipSync(
  vrm: VRM | null,
  options: AmplitudeLipSyncOptions = {},
) {
  const smoothed = useRef(0);
  const phase = useRef(0);
  const defaultHeadHeightPx = options.headHeightPx ?? null;
  const intensity = options.intensity;
  const minOpen = options.minOpen;

  return useCallback(
    (
      delta: number,
      level: number,
      speaking: boolean,
      headHeightPx: number | null = defaultHeadHeightPx,
    ) => {
      if (!vrm?.expressionManager) return;
      const audible = speaking && level > 0.008;
      const { open } = computeLipSyncOpen({
        level: audible ? level : 0,
        headHeightPx,
        intensity,
        minOpen,
      });
      const smoothing = 1 - Math.exp(-delta / (open > smoothed.current ? 0.055 : 0.1));
      smoothed.current += (open - smoothed.current) * smoothing;
      phase.current += delta * (8 + smoothed.current * 9);
      const active = Math.floor(phase.current) % VISEMES.length;

      for (let index = 0; index < VISEMES.length; index += 1) {
        const shape = Math.max(0, 1 - Math.abs(index - active) * 0.72);
        const flutter = 0.74 + Math.sin(phase.current * 5.7 + index) * 0.18;
        vrm.expressionManager.setValue(
          VISEMES[index],
          Math.min(1, smoothed.current * shape * flutter),
        );
      }
    },
    [vrm, defaultHeadHeightPx, intensity, minOpen],
  );
}
