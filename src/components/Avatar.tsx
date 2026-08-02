import { Suspense, useEffect, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';
import { useVrmLoader } from '../hooks/useVrmLoader';
import { useVrmAnimation } from '../hooks/useVrmAnimation';
import { useAmplitudeLipSync } from '../hooks/useAmplitudeLipSync';
import { useBlink } from '../hooks/useBlink';
import { estimateHeadAnchorFromCharacterSize } from '../head-projection';
import type { PlayableAnimationType } from '../animation-catalog';

interface AvatarProps {
  animation: PlayableAnimationType;
  animationRequest: number;
  animationUrls?: readonly string[];
  audioLevel: number;
  characterSize?: number;
  modelUrl: string;
  onAnimationComplete: () => void;
  playback: 'loop' | 'once';
  speaking: boolean;
  onReady?: (scene: THREE.Object3D) => void;
}

function AvatarModel({
  animation,
  animationRequest,
  animationUrls = [],
  audioLevel,
  characterSize = 1,
  modelUrl,
  onAnimationComplete,
  playback,
  speaking,
  onReady,
}: AvatarProps) {
  const vrm = useVrmLoader(modelUrl);
  const { play, update: updateAnimation } = useVrmAnimation(vrm);
  const updateLipSync = useAmplitudeLipSync(vrm, {
    // 精確骨點投影接線前，與氣泡共用尺寸估算路徑。
    headHeightPx: estimateHeadAnchorFromCharacterSize(
      typeof window !== 'undefined' ? window.innerWidth : 800,
      typeof window !== 'undefined' ? window.innerHeight : 600,
      characterSize,
    ).headHeightPx,
    intensity: 1,
    minOpen: 0.08,
  });
  const updateBlink = useBlink(vrm);

  useEffect(() => {
    void play(animation, {
      animationUrls,
      onComplete: onAnimationComplete,
      playback,
    });
  }, [
    animation,
    animationRequest,
    animationUrls,
    onAnimationComplete,
    play,
    playback,
  ]);

  useLayoutEffect(() => {
    if (vrm) onReady?.(vrm.scene);
  }, [onReady, vrm]);

  useFrame((_, delta) => {
    if (!vrm) return;
    updateAnimation(delta);
    updateBlink(delta);
    updateLipSync(delta, audioLevel, speaking);
    vrm.update(delta);
  });

  return vrm ? <primitive object={vrm.scene} /> : null;
}

export function Avatar(props: AvatarProps) {
  return (
    <Suspense fallback={null}>
      <AvatarModel {...props} />
    </Suspense>
  );
}
