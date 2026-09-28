import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import {
  SPEAKING_CHEST_CANDIDATES,
  applySpeakingEulerOffset,
  applySpeakingSecondaryBoneOffsets,
  getSpeakingBoneNode,
} from './speaking-secondary-bones';

function fakeVrm(bones: Record<string, THREE.Object3D | null>) {
  return {
    humanoid: {
      getNormalizedBoneNode: vi.fn((name: string) => bones[name] ?? null),
      getRawBoneNode: vi.fn(() => null),
    },
  } as never;
}

describe('speaking-secondary-bones', () => {
  it('resolves normalized bone nodes and skips zero offsets', () => {
    const head = new THREE.Object3D();
    const before = head.quaternion.clone();
    const vrm = fakeVrm({ head });
    expect(getSpeakingBoneNode(vrm, 'head')).toBe(head);
    applySpeakingEulerOffset(head, 0, 0, 0);
    expect(head.quaternion.equals(before)).toBe(true);
  });

  it('applies head and first available chest candidate', () => {
    const head = new THREE.Object3D();
    const spine = new THREE.Object3D();
    const headBefore = head.quaternion.clone();
    const spineBefore = spine.quaternion.clone();
    const vrm = fakeVrm({
      head,
      upperChest: null,
      chest: null,
      spine,
    });

    const result = applySpeakingSecondaryBoneOffsets(vrm, {
      headPitch: 0.1,
      headYaw: -0.05,
      headRoll: 0.02,
      chestPitch: 0.08,
    });

    expect(result).toEqual({ head: true, chest: 'spine' });
    expect(head.quaternion.equals(headBefore)).toBe(false);
    expect(spine.quaternion.equals(spineBefore)).toBe(false);
    expect(SPEAKING_CHEST_CANDIDATES[0]).toBe('upperChest');
  });
});
