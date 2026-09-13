/**
 * Idle once 播放的完成逾時與 clip 快取輔助（純邏輯）。
 * 避免每次 play 新建 AnimationClip 導致 mixer 堆積，以及 finished 漏發時永久停住。
 */

import type { VRM } from '@pixiv/three-vrm';
import { createVRMAnimationClip, type VRMAnimation } from '@pixiv/three-vrm-animation';
import * as THREE from 'three';

/** once 播放在 clip 時長＋淡入後仍未 finished 時的緩衝秒數。 */
export const ONCE_COMPLETION_SLACK_SECONDS = 0.75;

export function oncePlaybackTimeoutSeconds(
  clipDuration: number,
  fadeSeconds: number,
): number {
  const duration = Number.isFinite(clipDuration)
    ? Math.max(0.05, clipDuration)
    : 1;
  const fade = Number.isFinite(fadeSeconds) ? Math.max(0, fadeSeconds) : 0;
  return duration + fade + ONCE_COMPLETION_SLACK_SECONDS;
}

/**
 * 依 URL 重用同一 AnimationClip／AnimationAction，避免 mixer 無限堆積。
 */
export function getCachedClipAction(
  mixer: THREE.AnimationMixer,
  clipCache: Map<string, THREE.AnimationClip>,
  url: string,
  animation: VRMAnimation,
  vrm: VRM,
): THREE.AnimationAction {
  let clip = clipCache.get(url);
  if (!clip) {
    clip = createVRMAnimationClip(animation, vrm);
    clipCache.set(url, clip);
  }
  return mixer.clipAction(clip);
}

/** 釋放 mixer 上快取的全部 clip／action（換模型或卸載時）。 */
export function clearClipCache(
  mixer: THREE.AnimationMixer | null,
  clipCache: Map<string, THREE.AnimationClip>,
): void {
  if (mixer) {
    mixer.stopAllAction();
    for (const clip of clipCache.values()) {
      mixer.uncacheAction(clip);
      mixer.uncacheClip(clip);
    }
  }
  clipCache.clear();
}
