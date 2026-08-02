import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  estimateHeadAnchorFromCharacterSize,
  estimateHeadHeightPxFromProjectedPoints,
  projectHeadWorldPointsToReport,
  projectWorldPointToViewport,
  resolveHeadAnchor,
  shouldPublishHeadProjection,
} from './head-projection';

describe('estimateHeadAnchorFromCharacterSize', () => {
  it('keeps the historical right-leaning layout and scales with character size', () => {
    const large = estimateHeadAnchorFromCharacterSize(800, 600, 1);
    const small = estimateHeadAnchorFromCharacterSize(800, 600, 0.3);
    expect(large.x).toBeCloseTo(800 * 0.62);
    expect(large.preferredSide).toBe('left');
    expect(small.headHeightPx).toBeLessThan(large.headHeightPx);
    expect(small.y).toBeGreaterThan(large.y);
  });
});

describe('projectWorldPointToViewport', () => {
  it('projects a point in front of the camera into CSS pixels', () => {
    const camera = new THREE.PerspectiveCamera(40, 800 / 600, 0.1, 100);
    camera.position.set(0, 1, 4);
    camera.lookAt(0, 1, 0);
    camera.updateMatrixWorld(true);
    const viewProjection = new THREE.Matrix4()
      .multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
      .elements;
    const projected = projectWorldPointToViewport(
      { x: 0, y: 1.6, z: 0 },
      viewProjection,
      { width: 800, height: 600 },
    );
    expect(projected).not.toBeNull();
    expect(projected!.x).toBeGreaterThan(300);
    expect(projected!.x).toBeLessThan(500);
    expect(projected!.y).toBeGreaterThan(0);
    expect(projected!.y).toBeLessThan(600);
  });

  it('returns null for points behind the camera', () => {
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0, 2);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld(true);
    const viewProjection = new THREE.Matrix4()
      .multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
      .elements;
    expect(
      projectWorldPointToViewport(
        { x: 0, y: 0, z: 5 },
        viewProjection,
        { width: 100, height: 100 },
      ),
    ).toBeNull();
  });
});

describe('resolveHeadAnchor', () => {
  it('uses projected head when available and falls back otherwise', () => {
    const fallback = resolveHeadAnchor({
      viewportWidth: 1000,
      viewportHeight: 800,
      characterSize: 1,
    });
    const projected = resolveHeadAnchor({
      viewportWidth: 1000,
      viewportHeight: 800,
      characterSize: 1,
      projectedHead: { x: 700, y: 200 },
      projectedChest: { x: 700, y: 320 },
    });
    expect(projected.x).toBe(700);
    expect(projected.y).toBe(200);
    expect(projected.headHeightPx).toBeCloseTo(
      estimateHeadHeightPxFromProjectedPoints(
        { x: 700, y: 200 },
        { x: 700, y: 320 },
        fallback.headHeightPx,
      ),
    );
    expect(fallback.x).not.toBe(700);
  });
});

describe('projectHeadWorldPointsToReport', () => {
  it('builds a screen report from head and chest world points', () => {
    const camera = new THREE.PerspectiveCamera(40, 800 / 600, 0.1, 100);
    camera.position.set(0, 1.2, 4);
    camera.lookAt(0, 1.2, 0);
    camera.updateMatrixWorld(true);
    const viewProjection = new THREE.Matrix4()
      .multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
      .elements;
    const report = projectHeadWorldPointsToReport(
      {
        head: { x: 0, y: 1.85, z: 0 },
        chest: { x: 0, y: 1.15, z: 0 },
      },
      viewProjection,
      { width: 800, height: 600 },
      1,
    );
    expect(report).not.toBeNull();
    expect(report!.projectedHead.x).toBeGreaterThan(300);
    expect(report!.projectedHead.x).toBeLessThan(500);
    expect(report!.projectedChest).not.toBeNull();
    expect(report!.projectedChest!.y).toBeGreaterThan(report!.projectedHead.y);
    expect(report!.headHeightPx).toBeGreaterThanOrEqual(40);
    expect(report!.viewport).toEqual({ width: 800, height: 600 });
  });
});

describe('shouldPublishHeadProjection', () => {
  it('publishes on first report and meaningful moves', () => {
    const base = {
      projectedHead: { x: 100, y: 200 },
      projectedChest: { x: 100, y: 280 },
      headHeightPx: 60,
      viewport: { width: 800, height: 600 },
    };
    expect(shouldPublishHeadProjection(null, base)).toBe(true);
    expect(
      shouldPublishHeadProjection(base, {
        ...base,
        projectedHead: { x: 100.2, y: 200.1 },
      }),
    ).toBe(false);
    expect(
      shouldPublishHeadProjection(base, {
        ...base,
        projectedHead: { x: 110, y: 200 },
      }),
    ).toBe(true);
    expect(
      shouldPublishHeadProjection(base, {
        ...base,
        headHeightPx: 70,
      }),
    ).toBe(true);
  });
});
