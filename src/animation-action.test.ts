import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  configureAnimationAction,
  crossFadeAnimationActions,
} from './animation-action';

function createAction(duration = 0.1) {
  const mixer = new THREE.AnimationMixer(new THREE.Object3D());
  const action = mixer.clipAction(new THREE.AnimationClip('test', duration));
  return { action, mixer };
}

describe('animation playback configuration', () => {
  it('finishes a one-shot action once and holds its final pose', () => {
    const { action, mixer } = createAction();
    let finishes = 0;
    mixer.addEventListener('finished', () => {
      finishes += 1;
    });

    configureAnimationAction(action, 'once').play();
    mixer.update(0.2);

    expect(finishes).toBe(1);
    expect(action.loop).toBe(THREE.LoopOnce);
    expect(action.clampWhenFinished).toBe(true);
  });

  it('keeps ordinary voice-driven body animations looping', () => {
    const { action, mixer } = createAction();
    let finishes = 0;
    mixer.addEventListener('finished', () => {
      finishes += 1;
    });

    configureAnimationAction(action, 'loop').play();
    mixer.update(0.2);

    expect(finishes).toBe(0);
    expect(action.loop).toBe(THREE.LoopRepeat);
    expect(action.clampWhenFinished).toBe(false);
  });

  it('interpolates outgoing and incoming action weights during replacement', () => {
    const mixer = new THREE.AnimationMixer(new THREE.Object3D());
    const previous = mixer.clipAction(
      new THREE.AnimationClip('previous', 2),
    );
    const next = mixer.clipAction(new THREE.AnimationClip('next', 2));
    previous.play();
    mixer.update(0.01);

    crossFadeAnimationActions(previous, next, 1);
    mixer.update(0.5);

    expect(previous.getEffectiveWeight()).toBeCloseTo(0.5, 1);
    expect(next.getEffectiveWeight()).toBeCloseTo(0.5, 1);

    mixer.update(0.5);
    expect(previous.getEffectiveWeight()).toBeCloseTo(0, 5);
    expect(next.getEffectiveWeight()).toBeCloseTo(1, 5);
  });
});
