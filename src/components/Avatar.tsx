import { Suspense, startTransition, useEffect, useLayoutEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useVrmLoader } from '../hooks/useVrmLoader';
import { useVrmAnimation } from '../hooks/useVrmAnimation';
import { useAmplitudeLipSync } from '../hooks/useAmplitudeLipSync';
import { useBlink } from '../hooks/useBlink';
import { useSpeakingSecondaryMotion } from '../hooks/useSpeakingSecondaryMotion';
import {
  estimateHeadAnchorFromCharacterSize,
  projectHeadWorldPointsToReport,
  shouldPublishHeadProjection,
  type ProjectedHeadReport,
} from '../head-projection';
import { sampleVrmHeadWorldPoints } from '../vrm-head-bones';
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
  /** 頭部骨點螢幕投影（節流後回報；卸載或無骨點時為 null）。 */
  onHeadProjection?: (report: ProjectedHeadReport | null) => void;
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
  onHeadProjection,
}: AvatarProps) {
  const vrm = useVrmLoader(modelUrl);
  const { play, update: updateAnimation } = useVrmAnimation(vrm);
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const viewProjection = useRef(new THREE.Matrix4());
  const fallbackHeadHeight = estimateHeadAnchorFromCharacterSize(
    size.width > 0 ? size.width : 800,
    size.height > 0 ? size.height : 600,
    characterSize,
  ).headHeightPx;
  const headHeightPxRef = useRef(fallbackHeadHeight);
  const lastPublishedRef = useRef<ProjectedHeadReport | null>(null);
  const lastPublishAtRef = useRef(0);
  const updateLipSync = useAmplitudeLipSync(vrm, {
    intensity: 1,
    minOpen: 0.08,
  });
  const updateBlink = useBlink(vrm);
  const updateSpeakingSecondary = useSpeakingSecondaryMotion(vrm);

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

  useEffect(() => {
    return () => {
      lastPublishedRef.current = null;
      onHeadProjection?.(null);
    };
  }, [onHeadProjection, modelUrl]);

  useFrame((_, delta) => {
    if (!vrm) return;
    updateAnimation(delta);
    updateBlink(delta);

    let liveHeadHeight = headHeightPxRef.current;
    const points = sampleVrmHeadWorldPoints(vrm);
    if (points && size.width > 0 && size.height > 0) {
      camera.updateMatrixWorld(true);
      viewProjection.current.multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse,
      );
      const report = projectHeadWorldPointsToReport(
        points,
        viewProjection.current.elements,
        { width: size.width, height: size.height },
        characterSize,
      );
      if (report) {
        liveHeadHeight = report.headHeightPx;
        headHeightPxRef.current = liveHeadHeight;
        if (onHeadProjection) {
          const now =
            typeof performance !== 'undefined' ? performance.now() : Date.now();
          const moved = shouldPublishHeadProjection(
            lastPublishedRef.current,
            report,
          );
          const due = now - lastPublishAtRef.current >= 80;
          if (moved || due) {
            lastPublishedRef.current = report;
            lastPublishAtRef.current = now;
            startTransition(() => {
              onHeadProjection(report);
            });
          }
        }
      }
    }

    updateLipSync(delta, audioLevel, speaking, liveHeadHeight);
    // VRMA 更新後疊加低幅度頭部／上身反應（第二層提示）。
    updateSpeakingSecondary(delta, audioLevel, speaking);
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
