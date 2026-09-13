import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import type { VRM } from '@pixiv/three-vrm';
import type { VRMHumanBoneName } from '@pixiv/three-vrm-core';
import {
  readVrmBoneWorldPoint,
  sampleVrmHeadWorldPoints,
} from './vrm-head-bones';

function boneAt(x: number, y: number, z: number): THREE.Object3D {
  const node = new THREE.Object3D();
  node.position.set(x, y, z);
  node.updateMatrixWorld(true);
  return node;
}

function mockVrm(
  bones: Partial<Record<VRMHumanBoneName, THREE.Object3D>>,
): VRM {
  return {
    humanoid: {
      getNormalizedBoneNode: (name: VRMHumanBoneName) => bones[name] ?? null,
      getRawBoneNode: () => null,
    },
  } as unknown as VRM;
}

describe('vrm-head-bones', () => {
  it('reads normalized bone world points', () => {
    const vrm = mockVrm({
      head: boneAt(0.1, 1.7, 0),
      chest: boneAt(0, 1.3, 0),
    });
    expect(readVrmBoneWorldPoint(vrm, 'head')).toEqual({
      x: 0.1,
      y: 1.7,
      z: 0,
    });
    const sample = sampleVrmHeadWorldPoints(vrm);
    expect(sample).not.toBeNull();
    expect(sample!.head).toEqual({ x: 0.1, y: 1.7, z: 0 });
    expect(sample!.chest).toEqual({ x: 0, y: 1.3, z: 0 });
  });

  it('falls back through upperChest → chest → spine', () => {
    const withSpine = mockVrm({
      head: boneAt(0, 1.8, 0),
      spine: boneAt(0, 1.2, 0),
    });
    expect(sampleVrmHeadWorldPoints(withSpine)?.chest).toEqual({
      x: 0,
      y: 1.2,
      z: 0,
    });

    const headOnly = mockVrm({
      head: boneAt(0, 1.8, 0),
    });
    expect(sampleVrmHeadWorldPoints(headOnly)?.chest).toBeNull();
  });

  it('returns null when head bone is missing', () => {
    const vrm = mockVrm({
      chest: boneAt(0, 1.3, 0),
    });
    expect(sampleVrmHeadWorldPoints(vrm)).toBeNull();
  });
});
