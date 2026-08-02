import { useCallback, useRef } from 'react';
import type { VRM } from '@pixiv/three-vrm';
import type { VRMHumanBoneName } from '@pixiv/three-vrm-core';
import * as THREE from 'three';
import {
  createSpeakingSecondaryMotionState,
  isSpeakingSecondaryNearlyIdle,
  stepSpeakingSecondaryMotion,
  type SpeakingSecondaryOffsets,
} from '../speaking-secondary-motion';

const HEAD_BONE: VRMHumanBoneName = 'head';
const CHEST_CANDIDATES = [
  'upperChest',
  'chest',
  'spine',
] as const satisfies ReadonlyArray<VRMHumanBoneName>;

const _euler = new THREE.Euler(0, 0, 0, 'YXZ');
const _offset = new THREE.Quaternion();

function getBoneNode(vrm: VRM, name: VRMHumanBoneName) {
  const humanoid = vrm.humanoid;
  if (!humanoid) return null;
  return (
    humanoid.getNormalizedBoneNode(name) ?? humanoid.getRawBoneNode(name)
  );
}

function applyEulerOffset(
  node: THREE.Object3D,
  pitch: number,
  yaw: number,
  roll: number,
) {
  if (pitch === 0 && yaw === 0 && roll === 0) return;
  _euler.set(pitch, yaw, roll);
  _offset.setFromEuler(_euler);
  node.quaternion.multiply(_offset);
}

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
      const offsets: SpeakingSecondaryOffsets = stateRef.current.offsets;
      if (isSpeakingSecondaryNearlyIdle(offsets)) return;

      const head = getBoneNode(vrm, HEAD_BONE);
      if (head) {
        applyEulerOffset(
          head,
          offsets.headPitch,
          offsets.headYaw,
          offsets.headRoll,
        );
      }
      for (const name of CHEST_CANDIDATES) {
        const chest = getBoneNode(vrm, name);
        if (chest) {
          applyEulerOffset(chest, offsets.chestPitch, 0, 0);
          break;
        }
      }
    },
    [vrm],
  );
}
