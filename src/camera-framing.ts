import * as THREE from 'three';

export interface FullBodyFraming {
  position: THREE.Vector3;
  target: THREE.Vector3;
  distance: number;
}

export function calculateFullBodyFraming(
  box: THREE.Box3,
  verticalFovDegrees: number,
  aspect: number,
  margin = 1.12,
  zoom = 1,
): FullBodyFraming {
  const size = box.getSize(new THREE.Vector3());
  const target = box.getCenter(new THREE.Vector3());
  const halfVerticalFov = THREE.MathUtils.degToRad(verticalFovDegrees) / 2;
  const halfHorizontalFov = Math.atan(Math.tan(halfVerticalFov) * aspect);
  const depthPadding = size.z / 2;
  const heightDistance = size.y / 2 / Math.tan(halfVerticalFov);
  const widthDistance = size.x / 2 / Math.tan(halfHorizontalFov);
  const distance =
    Math.max(heightDistance, widthDistance) * margin / zoom + depthPadding;

  return {
    position: target.clone().add(new THREE.Vector3(0, 0, distance)),
    target,
    distance,
  };
}
