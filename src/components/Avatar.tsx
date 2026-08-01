import { Suspense, useEffect, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';
import { useVrmLoader } from '../hooks/useVrmLoader';
import { useVrmAnimation } from '../hooks/useVrmAnimation';
import { useAmplitudeLipSync } from '../hooks/useAmplitudeLipSync';
import { useBlink } from '../hooks/useBlink';
import type { PlayableAnimationType } from '../animation-catalog';

interface AvatarProps {
  animation: PlayableAnimationType;
  animationRequest: number;
  animationUrls?: readonly string[];
  audioLevel: number;
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
  modelUrl,
  onAnimationComplete,
  playback,
  speaking,
  onReady,
}: AvatarProps) {
  const vrm = useVrmLoader(modelUrl);
  const { play, update: updateAnimation } = useVrmAnimation(vrm);
  const updateLipSync = useAmplitudeLipSync(vrm);
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
