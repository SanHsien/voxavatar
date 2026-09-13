import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { calculateFullBodyFraming } from './camera-framing';

describe('calculateFullBodyFraming', () => {
  it('centers and fits a full-height avatar in a portrait window', () => {
    const box = new THREE.Box3(
      new THREE.Vector3(-0.4, 0, -0.2),
      new THREE.Vector3(0.4, 2, 0.2),
    );
    const framing = calculateFullBodyFraming(box, 20, 430 / 680);

    expect(framing.target.toArray()).toEqual([0, 1, 0]);
    expect(framing.position.y).toBe(1);

    const nearestDepth = framing.distance - 0.2;
    const visibleHalfHeight =
      nearestDepth * Math.tan(THREE.MathUtils.degToRad(10));
    expect(visibleHalfHeight).toBeGreaterThanOrEqual(1.12);
  });

  it('moves farther back when model width is the limiting dimension', () => {
    const box = new THREE.Box3(
      new THREE.Vector3(-2, 0, -0.1),
      new THREE.Vector3(2, 1, 0.1),
    );
    const framing = calculateFullBodyFraming(box, 20, 430 / 680);
    const halfHorizontalFov = Math.atan(
      Math.tan(THREE.MathUtils.degToRad(10)) * (430 / 680),
    );
    const nearestDepth = framing.distance - 0.1;
    const visibleHalfWidth = nearestDepth * Math.tan(halfHorizontalFov);

    expect(visibleHalfWidth).toBeGreaterThanOrEqual(2 * 1.12);
  });

  it('supports a closer initial framing without scaling the avatar', () => {
    const box = new THREE.Box3(
      new THREE.Vector3(-0.4, 0, -0.2),
      new THREE.Vector3(0.4, 2, 0.2),
    );
    const normal = calculateFullBodyFraming(box, 20, 430 / 680);
    const zoomed = calculateFullBodyFraming(box, 20, 430 / 680, 1.12, 1.5);

    expect((normal.distance - 0.2) / (zoomed.distance - 0.2)).toBeCloseTo(
      1.5,
    );
    expect(zoomed.target.toArray()).toEqual(normal.target.toArray());
  });
});
