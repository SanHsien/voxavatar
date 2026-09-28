import * as THREE from 'three';

export type AnimationPlayback = 'loop' | 'once';

export function configureAnimationAction(
  action: THREE.AnimationAction,
  playback: AnimationPlayback,
): THREE.AnimationAction {
  if (playback === 'once') {
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
  } else {
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.clampWhenFinished = false;
  }
  return action;
}

export function crossFadeAnimationActions(
  previous: THREE.AnimationAction | null,
  next: THREE.AnimationAction,
  duration: number,
): void {
  previous?.fadeOut(duration);
  next.setEffectiveWeight(1).fadeIn(duration).play();
}
