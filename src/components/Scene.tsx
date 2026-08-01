import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import {
  ContactShadows,
  Environment,
  OrbitControls,
} from '@react-three/drei';
import dawnEnvironment from '@pmndrs/assets/hdri/dawn.exr';
import * as THREE from 'three';
import { Avatar } from './Avatar';
import type { PlayableAnimationType } from '../animation-catalog';
import { calculateFullBodyFraming } from '../camera-framing';
import { resolveLightingSettings } from '../settings-defaults';

interface SceneProps {
  animation: PlayableAnimationType;
  animationRequest: number;
  animationUrls?: readonly string[];
  audioLevel: number;
  characterSize: number;
  enablePan?: boolean;
  framingMargin?: number;
  groundShadow?: boolean;
  lighting?: VoxAvatarLightingSettings;
  modelUrl: string;
  onAnimationComplete: () => void;
  playback: 'loop' | 'once';
  speaking: boolean;
  /** 桌面 overlay：穿透／拖曳／右鍵選單；Settings 預覽關閉。 */
  interactiveOverlay?: boolean;
}

interface TargetControls {
  target: THREE.Vector3;
  update: () => void;
}

interface Grounding {
  far: number;
  position: [number, number, number];
  scale: number;
}

function supportsTarget(controls: unknown): controls is TargetControls {
  if (!controls || typeof controls !== 'object') return false;
  const candidate = controls as Partial<TargetControls>;
  return (
    candidate.target instanceof THREE.Vector3 &&
    typeof candidate.update === 'function'
  );
}

function LightingController({
  lighting,
}: {
  lighting: VoxAvatarLightingSettings;
}) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);

  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    gl.toneMapping =
      lighting.tone_mapping === 'aces'
        ? THREE.ACESFilmicToneMapping
        : THREE.NoToneMapping;
    gl.toneMappingExposure = lighting.exposure;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    // eslint-disable-next-line react-hooks/immutability
    scene.environmentIntensity = lighting.environment_enabled
      ? lighting.environment_intensity
      : 0;
  }, [
    gl,
    scene,
    lighting.tone_mapping,
    lighting.exposure,
    lighting.environment_enabled,
    lighting.environment_intensity,
  ]);

  return null;
}

function FullBodyCamera({
  characterSize,
  framingMargin,
  object,
  resetToken,
}: {
  characterSize: number;
  framingMargin: number;
  object: THREE.Object3D | null;
  resetToken: number;
}) {
  const getThreeState = useThree((state) => state.get);
  const controlsReady = useThree((state) => Boolean(state.controls));
  const framedObject = useRef<THREE.Object3D | null>(null);
  const framedCharacterSize = useRef<number | null>(null);
  const framedMargin = useRef<number | null>(null);
  const framedResetToken = useRef(-1);

  useLayoutEffect(() => {
    const { camera, controls } = getThreeState();
    const forceReset = framedResetToken.current !== resetToken;
    if (
      !object ||
      (!forceReset &&
        framedObject.current === object &&
        framedCharacterSize.current === characterSize &&
        framedMargin.current === framingMargin) ||
      !(camera instanceof THREE.PerspectiveCamera) ||
      !supportsTarget(controls)
    ) {
      return;
    }

    object.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(object);
    if (box.isEmpty()) return;

    // characterSize 1 = 全身；>1 拉近。不再額外乘 1.5，避免預設就裁切。
    const framing = calculateFullBodyFraming(
      box,
      camera.fov,
      camera.aspect,
      framingMargin,
      characterSize,
    );
    camera.position.copy(framing.position);
    camera.near = Math.max(0.01, framing.distance / 100);
    camera.far = Math.max(100, framing.distance * 100);
    camera.lookAt(framing.target);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    controls.target.copy(framing.target);
    controls.update();
    framedObject.current = object;
    framedCharacterSize.current = characterSize;
    framedMargin.current = framingMargin;
    framedResetToken.current = resetToken;
  }, [
    characterSize,
    controlsReady,
    framingMargin,
    getThreeState,
    object,
    resetToken,
  ]);

  return null;
}

function OverlayInteraction({
  enabled,
  object,
}: {
  enabled: boolean;
  object: THREE.Object3D | null;
}) {
  const { camera, gl } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const pointer = useRef(new THREE.Vector2());
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const lastIgnore = useRef<boolean | null>(null);

  const hitTest = useCallback(
    (clientX: number, clientY: number) => {
      if (!object) return false;
      const rect = gl.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return false;
      pointer.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.current.setFromCamera(pointer.current, camera);
      return raycaster.current.intersectObject(object, true).length > 0;
    },
    [camera, gl.domElement, object],
  );

  useEffect(() => {
    if (!enabled) return;

    const canvas = gl.domElement;
    const bridge = window.voxavatarBridge;
    const setIgnoreMouse = bridge?.setIgnoreMouse;
    if (!setIgnoreMouse) return;

    const applyIgnore = (ignore: boolean) => {
      if (lastIgnore.current === ignore) return;
      lastIgnore.current = ignore;
      setIgnoreMouse(ignore);
    };

    applyIgnore(true);

    const onPointerMove = (event: PointerEvent) => {
      if (dragging.current) {
        bridge?.moveWindow?.(
          event.screenX - dragOffset.current.x,
          event.screenY - dragOffset.current.y,
        );
        return;
      }
      applyIgnore(!hitTest(event.clientX, event.clientY));
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button === 2) {
        event.preventDefault();
        if (hitTest(event.clientX, event.clientY)) {
          bridge.showContextMenu?.();
        }
        return;
      }
      if (event.button !== 0) return;
      if (!hitTest(event.clientX, event.clientY)) return;

      void (async () => {
        const bounds = await bridge.getWindowBounds?.();
        if (!bounds) return;
        dragging.current = true;
        dragOffset.current = {
          x: event.screenX - bounds.x,
          y: event.screenY - bounds.y,
        };
        applyIgnore(false);
        try {
          canvas.setPointerCapture(event.pointerId);
        } catch {
          // ignore
        }
      })();
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!dragging.current) return;
      dragging.current = false;
      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch {
        // ignore
      }
      applyIgnore(!hitTest(event.clientX, event.clientY));
    };

    const onContextMenu = (event: Event) => {
      event.preventDefault();
    };

    window.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('contextmenu', onContextMenu);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('contextmenu', onContextMenu);
      lastIgnore.current = null;
      setIgnoreMouse(true);
    };
  }, [enabled, gl.domElement, hitTest]);

  return null;
}

export function Scene(props: SceneProps) {
  const lighting = resolveLightingSettings(props.lighting);
  const interactiveOverlay = props.interactiveOverlay ?? false;
  const [avatarScene, setAvatarScene] = useState<THREE.Object3D | null>(null);
  const [grounding, setGrounding] = useState<Grounding | null>(null);
  const [resetToken, setResetToken] = useState(0);
  const handleAvatarReady = useCallback((scene: THREE.Object3D) => {
    setAvatarScene(scene);
    scene.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(scene);
    if (box.isEmpty()) {
      setGrounding(null);
      return;
    }
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    setGrounding({
      far: Math.max(size.y, 1),
      position: [center.x, box.min.y + 0.005, center.z],
      scale: Math.max(size.x, size.z, 0.8) * 1.8,
    });
  }, []);

  useEffect(() => {
    if (!interactiveOverlay) return;
    return window.voxavatarBridge?.subscribeResetView?.(() => {
      setResetToken((token) => token + 1);
    });
  }, [interactiveOverlay]);

  return (
    <Canvas
      camera={{ position: [0, 2, 4.8], fov: 20 }}
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        alpha: true,
        toneMapping:
          lighting.tone_mapping === 'aces'
            ? THREE.ACESFilmicToneMapping
            : THREE.NoToneMapping,
        toneMappingExposure: lighting.exposure,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      style={{ background: 'transparent' }}
    >
      <LightingController lighting={lighting} />
      <directionalLight
        color={[1, 1, 1]}
        position={[-3, 3, 3]}
        intensity={lighting.key_light_intensity}
      />
      <ambientLight
        color={[
          0.0036765073221525194,
          0.0036765073221525194,
          0.0036765073221525194,
        ]}
        intensity={lighting.ambient_intensity}
      />
      {lighting.environment_enabled && (
        <Environment files={dawnEnvironment} />
      )}
      <FullBodyCamera
        characterSize={props.characterSize}
        framingMargin={props.framingMargin ?? 1.28}
        object={avatarScene}
        resetToken={resetToken}
      />
      <Avatar {...props} onReady={handleAvatarReady} />
      {props.groundShadow && grounding && (
        <ContactShadows
          blur={2.4}
          color="#050506"
          far={grounding.far}
          frames={1}
          key={`${props.modelUrl}-ground-shadow`}
          opacity={0.42}
          position={grounding.position}
          resolution={256}
          scale={grounding.scale}
        />
      )}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        enablePan={interactiveOverlay ? false : (props.enablePan ?? true)}
        enableRotate
        enableZoom
        minDistance={0.8}
        maxDistance={18}
        mouseButtons={
          interactiveOverlay
            ? {
                LEFT: undefined as unknown as THREE.MOUSE,
                MIDDLE: THREE.MOUSE.ROTATE,
                RIGHT: undefined as unknown as THREE.MOUSE,
              }
            : undefined
        }
        panSpeed={0.7}
        rotateSpeed={0.45}
        screenSpacePanning
        zoomSpeed={0.9}
      />
      <OverlayInteraction enabled={interactiveOverlay} object={avatarScene} />
    </Canvas>
  );
}
