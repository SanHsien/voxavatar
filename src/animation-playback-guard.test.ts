import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  ONCE_COMPLETION_SLACK_SECONDS,
  clearClipCache,
  oncePlaybackTimeoutSeconds,
} from './animation-playback-guard';

describe('oncePlaybackTimeoutSeconds', () => {
  it('adds fade and slack on top of clip duration', () => {
    expect(oncePlaybackTimeoutSeconds(2, 0.7)).toBe(
      2 + 0.7 + ONCE_COMPLETION_SLACK_SECONDS,
    );
  });

  it('floors invalid duration to a small positive value', () => {
    expect(oncePlaybackTimeoutSeconds(Number.NaN, 0)).toBe(
      1 + ONCE_COMPLETION_SLACK_SECONDS,
    );
  });
});

describe('clearClipCache', () => {
  it('stops actions and empties the clip map', () => {
    const root = new THREE.Object3D();
    const mixer = new THREE.AnimationMixer(root);
    const clip = new THREE.AnimationClip('once', 0.1, [
      new THREE.NumberKeyframeTrack('.position[x]', [0, 0.1], [0, 1]),
    ]);
    const clipCache = new Map<string, THREE.AnimationClip>([['u', clip]]);
    const action = mixer.clipAction(clip);
    action.play();
    mixer.update(0.05);
    expect(action.isRunning()).toBe(true);
    clearClipCache(mixer, clipCache);
    expect(clipCache.size).toBe(0);
    expect(action.isRunning()).toBe(false);
  });
});
