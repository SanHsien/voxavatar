import { useCallback, useEffect, useRef } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  VRMAnimationLoaderPlugin,
  createVRMAnimationClip,
  type VRMAnimation,
} from '@pixiv/three-vrm-animation';
import type { VRM } from '@pixiv/three-vrm';
import * as THREE from 'three';
import {
  randomAnimationUrl,
  type PlayableAnimationType,
} from '../animation-catalog';
import {
  configureAnimationAction,
  crossFadeAnimationActions,
  type AnimationPlayback,
} from '../animation-action';

interface PlayOptions {
  animationUrls?: readonly string[];
  onComplete?: () => void;
  playback?: AnimationPlayback;
}

interface PendingCompletion {
  action: THREE.AnimationAction;
  callback: () => void;
  generation: number;
}

function transitionSeconds(
  previous: PlayableAnimationType | null,
  next: PlayableAnimationType,
): number {
  if (previous === 'TALK' && next === 'IDLE') return 1.15;
  if (next === 'TALK') return 0.85;
  return 0.7;
}

export function useVrmAnimation(vrm: VRM | null) {
  const mixer = useRef<THREE.AnimationMixer | null>(null);
  const current = useRef<THREE.AnimationAction | null>(null);
  const currentType = useRef<PlayableAnimationType | null>(null);
  const cache = useRef(new Map<string, VRMAnimation>());
  const previousAnimation = useRef(
    new Map<PlayableAnimationType, string>(),
  );
  const requestGeneration = useRef(0);
  const pendingCompletion = useRef<PendingCompletion | null>(null);

  useEffect(() => {
    if (!vrm) return;
    const animationHistory = previousAnimation.current;
    const animationMixer = new THREE.AnimationMixer(vrm.scene);
    const handleFinished = ({ action }: { action: THREE.AnimationAction }) => {
      const pending = pendingCompletion.current;
      if (
        pending?.action !== action ||
        pending.generation !== requestGeneration.current
      ) {
        return;
      }
      pendingCompletion.current = null;
      pending.callback();
    };
    animationMixer.addEventListener('finished', handleFinished);
    mixer.current = animationMixer;
    return () => {
      animationMixer.removeEventListener('finished', handleFinished);
      animationMixer.stopAllAction();
      mixer.current = null;
      current.current = null;
      currentType.current = null;
      pendingCompletion.current = null;
      animationHistory.clear();
    };
  }, [vrm]);

  const load = useCallback(async (url: string) => {
    const cached = cache.current.get(url);
    if (cached) return cached;
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMAnimationLoaderPlugin(parser));
    const gltf = await loader.loadAsync(url);
    const animation = gltf.userData.vrmAnimations?.[0] as VRMAnimation | undefined;
    if (!animation) throw new Error(`No VRM animation found in ${url}`);
    cache.current.set(url, animation);
    return animation;
  }, []);

  const play = useCallback(
    async (
      type: PlayableAnimationType,
      {
        animationUrls = [],
        onComplete,
        playback = 'loop',
      }: PlayOptions = {},
    ) => {
      if (!vrm || !mixer.current) {
        if (playback === 'once') onComplete?.();
        return;
      }
      const generation = ++requestGeneration.current;
      pendingCompletion.current = null;
      try {
        const url = randomAnimationUrl(
          animationUrls,
          previousAnimation.current.get(type) ?? null,
        );
        if (!url) {
          const fadeSeconds = transitionSeconds(currentType.current, type);
          current.current?.fadeOut(fadeSeconds);
          current.current = null;
          currentType.current = type;
          if (playback === 'once') onComplete?.();
          return;
        }
        previousAnimation.current.set(type, url);
        const animation = await load(url);
        if (generation !== requestGeneration.current || !mixer.current) return;
        const action = mixer.current.clipAction(createVRMAnimationClip(animation, vrm));
        const fadeSeconds = transitionSeconds(currentType.current, type);
        action.reset();
        configureAnimationAction(action, playback);
        if (playback === 'once') {
          if (onComplete) {
            pendingCompletion.current = {
              action,
              callback: onComplete,
              generation,
            };
          }
        }
        crossFadeAnimationActions(current.current, action, fadeSeconds);
        current.current = action;
        currentType.current = type;
      } catch (error) {
        console.warn('[voxavatar] animation load failed', error);
        if (generation === requestGeneration.current && playback === 'once') {
          onComplete?.();
        }
      }
    },
    [load, vrm],
  );

  const update = useCallback((delta: number) => mixer.current?.update(delta), []);
  return { play, update };
}
