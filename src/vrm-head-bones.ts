/**
 * 從 VRM humanoid 讀取頭部／胸口世界座標（供投影用）。
 */

import type { VRM } from '@pixiv/three-vrm';
import type { VRMHumanBoneName } from '@pixiv/three-vrm-core';
import * as THREE from 'three';
import type { WorldPoint } from './head-projection';

const CHEST_CANDIDATES = [
  'upperChest',
  'chest',
  'spine',
] as const satisfies ReadonlyArray<VRMHumanBoneName>;

const _world = new THREE.Vector3();

/**
 * 讀取指定 humanoid 骨點的世界座標。
 * 優先 normalized bone（與 VRMA 綁定一致），缺則退回 raw。
 */
export function readVrmBoneWorldPoint(
  vrm: VRM,
  boneName: VRMHumanBoneName,
): WorldPoint | null {
  const humanoid = vrm.humanoid;
  if (!humanoid) return null;
  const node =
    humanoid.getNormalizedBoneNode(boneName) ??
    humanoid.getRawBoneNode(boneName);
  if (!node) return null;
  node.getWorldPosition(_world);
  if (![_world.x, _world.y, _world.z].every(Number.isFinite)) return null;
  return { x: _world.x, y: _world.y, z: _world.z };
}

/**
 * 取頭部與胸口（或肩／脊椎退回）世界座標。無 head 骨則回傳 null。
 */
export function sampleVrmHeadWorldPoints(vrm: VRM): {
  head: WorldPoint;
  chest: WorldPoint | null;
} | null {
  const head = readVrmBoneWorldPoint(vrm, 'head');
  if (!head) return null;
  let chest: WorldPoint | null = null;
  for (const name of CHEST_CANDIDATES) {
    chest = readVrmBoneWorldPoint(vrm, name);
    if (chest) break;
  }
  return { head, chest };
}
