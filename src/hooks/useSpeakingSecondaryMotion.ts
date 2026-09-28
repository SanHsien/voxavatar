import { useCallback, useRef } from 'react';
import type { VRM } from '@pixiv/three-vrm';
import {
  createSpeakingSecondaryMotionState,
  isSpeakingSecondaryNearlyIdle,
  stepSpeakingSecondaryMotion,
} from '../speaking-secondary-motion';
import { applySpeakingSecondaryBoneOffsets } from '../speaking-secondary-bones';

/**
 * 在 VRMA／mixer 更新之後、vrm.update 之前呼叫，
 * 以低幅度局部旋轉疊加頭部／上身反應。
 */
export function useSpeakingSecondaryMotion(vrm: VRM | null) {
  const stateRef = useRef(createSpeakingSecondaryMotionState());

  return useCallback(
    (delta: number, level: number, speaking: boolean) => {
      if (!vrm?.humanoid) return;
      stateRef.current = stepSpeakingSecondaryMotion({
        speaking,
        level,
        delta,
        current: stateRef.current,
      });
      const offsets = stateRef.current.offsets;
      if (isSpeakingSecondaryNearlyIdle(offsets)) return;
      applySpeakingSecondaryBoneOffsets(vrm, offsets);
    },
    [vrm],
  );
}
