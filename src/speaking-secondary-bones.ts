import * as THREE from 'three';
import type { VRM } from '@pixiv/three-vrm';
import type { VRMHumanBoneName } from '@pixiv/three-vrm-core';
import type { SpeakingSecondaryOffsets } from './speaking-secondary-motion';

export const SPEAKING_HEAD_BONE: VRMHumanBoneName = 'head';
export const SPEAKING_CHEST_CANDIDATES = [
  'upperChest',
  'chest',
  'spine',
] as const satisfies ReadonlyArray<VRMHumanBoneName>;

const _euler = new THREE.Euler(0, 0, 0, 'YXZ');
const _offset = new THREE.Quaternion();

export function getSpeakingBoneNode(vrm: VRM, name: VRMHumanBoneName) {
  const humanoid = vrm.humanoid;
  if (!humanoid) return null;
  return (
    humanoid.getNormalizedBoneNode(name) ?? humanoid.getRawBoneNode(name)
  );
}

export function applySpeakingEulerOffset(
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

/** 將第二層偏移套到 head／第一個可用的 chest 候選骨。 */
export function applySpeakingSecondaryBoneOffsets(
  vrm: VRM,
  offsets: SpeakingSecondaryOffsets,
) {
  if (!vrm.humanoid) return { head: false, chest: null as string | null };
  const head = getSpeakingBoneNode(vrm, SPEAKING_HEAD_BONE);
  if (head) {
    applySpeakingEulerOffset(
      head,
      offsets.headPitch,
      offsets.headYaw,
      offsets.headRoll,
    );
  }
  let chestName: string | null = null;
  for (const name of SPEAKING_CHEST_CANDIDATES) {
    const chest = getSpeakingBoneNode(vrm, name);
    if (chest) {
      applySpeakingEulerOffset(chest, offsets.chestPitch, 0, 0);
      chestName = name;
      break;
    }
  }
  return { head: Boolean(head), chest: chestName };
}
