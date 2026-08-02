import { useCallback, useEffect, useRef } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  VRMAnimationLoaderPlugin,
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
import {
  clearClipCache,
  getCachedClipAction,
  oncePlaybackTimeoutSeconds,
} from '../animation-playback-guard';

interface PlayOptions {
  animationUrls?: readonly string[];
  onComplete?: () => void;
  playback?: AnimationPlayback;
}

interface PendingCompletion {
  action: THREE.AnimationAction;
  callback: () => void;
  generation: number;
  /** 累計 delta；超過 timeoutSeconds 則強制完成。 */
  elapsedSeconds: number;
  timeoutSeconds: number;
}

function transitionSeconds(
  previous: PlayableAnimationType | null,
  next: PlayableAnimationType,
): number {
  if (previous === 'TALK' && next === 'IDLE') return 1.15;
  if (next === 'TALK') return 0.85;
  return 0.7;
}

function settlePendingCompletion(
  pendingCompletion: { current: PendingCompletion | null },
  requestGeneration: { current: number },
  action: THREE.AnimationAction | null,
): void {
  const pending = pendingCompletion.current;
  if (!pending) return;
  if (action && pending.action !== action) return;
  if (pending.generation !== requestGeneration.current) return;
  pendingCompletion.current = null;
  pending.callback();
}

export function useVrmAnimation(vrm: VRM | null) {
  const mixer = useRef<THREE.AnimationMixer | null>(null);
  const current = useRef<THREE.AnimationAction | null>(null);
  const currentType = useRef<PlayableAnimationType | null>(null);
  const cache = useRef(new Map<string, VRMAnimation>());
  const clipCache = useRef(new Map<string, THREE.AnimationClip>());
  const previousAnimation = useRef(
    new Map<PlayableAnimationType, string>(),
  );
  const requestGeneration = useRef(0);
  const pendingCompletion = useRef<PendingCompletion | null>(null);

  useEffect(() => {
    if (!vrm) return;
    const animationHistory = previousAnimation.current;
    const clips = clipCache.current;
    const animationMixer = new THREE.AnimationMixer(vrm.scene);
    const handleFinished = ({ action }: { action: THREE.AnimationAction }) => {
      settlePendingCompletion(pendingCompletion, requestGeneration, action);
    };
    animationMixer.addEventListener('finished', handleFinished);
    mixer.current = animationMixer;
    return () => {
      animationMixer.removeEventListener('finished', handleFinished);
      clearClipCache(animationMixer, clips);
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
    const animation = gltf.userData.vrmAnimations?.[0] as
      | VRMAnimation
      | undefined;
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
        if (generation !== requestGeneration.current || !mixer.current) {
          // 已被更新的 play 取代；完成責任交給新 generation。
          return;
        }
        const action = getCachedClipAction(
          mixer.current,
          clipCache.current,
          url,
          animation,
          vrm,
        );
        const fadeSeconds = transitionSeconds(currentType.current, type);
        action.reset();
        configureAnimationAction(action, playback);
        if (playback === 'once' && onComplete) {
          pendingCompletion.current = {
            action,
            callback: onComplete,
            generation,
            elapsedSeconds: 0,
            timeoutSeconds: oncePlaybackTimeoutSeconds(
              action.getClip().duration,
              fadeSeconds,
            ),
          };
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

  const update = useCallback((delta: number) => {
    mixer.current?.update(delta);
    const pending = pendingCompletion.current;
    if (!pending) return;
    if (pending.generation !== requestGeneration.current) {
      pendingCompletion.current = null;
      return;
    }
    pending.elapsedSeconds += Math.max(0, delta);
    if (pending.elapsedSeconds >= pending.timeoutSeconds) {
      settlePendingCompletion(pendingCompletion, requestGeneration, null);
    }
  }, []);

  return { play, update };
}
