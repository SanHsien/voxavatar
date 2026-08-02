/**
 * 頭部錨點與螢幕投影（純邏輯）。
 * 精確骨點投影就緒前，氣泡／口型以角色尺寸估算為退回路徑。
 */

import type { BubbleHorizontalSide } from './bubble-layout';

export interface ViewportSize {
  width: number;
  height: number;
}

export interface HeadAnchorEstimate {
  x: number;
  y: number;
  preferredSide: BubbleHorizontalSide;
  /** 估算的頭部螢幕高度（CSS px），供口型增益使用。 */
  headHeightPx: number;
}

export interface WorldPoint {
  x: number;
  y: number;
  z: number;
}

/** 4×4 列主序或 three.js Matrix4.elements（列主序）。 */
export type Matrix4Elements = ReadonlyArray<number> | Float32Array;

/**
 * 依角色縮放與視窗尺寸估算頭部錨點（退回路徑）。
 * 與歷史 CharacterBubble 行為對齊。
 */
export function estimateHeadAnchorFromCharacterSize(
  viewportWidth: number,
  viewportHeight: number,
  characterSize: number,
): HeadAnchorEstimate {
  const width = Math.max(1, viewportWidth);
  const height = Math.max(1, viewportHeight);
  const size = Math.min(1, Math.max(0.3, characterSize));
  const characterHeight = height * (0.42 + size * 0.38);
  const characterWidth = width * (0.28 + size * 0.22);
  const feetY = height * 0.92;
  const centerX = width * 0.62;
  const headY = Math.max(height * 0.12, feetY - characterHeight * 0.82);
  return {
    x: centerX,
    y: headY,
    preferredSide:
      centerX + characterWidth * 0.35 > width * 0.72 ? 'left' : 'right',
    headHeightPx: Math.max(40, characterHeight * 0.18),
  };
}

/**
 * 將世界座標以 viewProjection 矩陣投影到 CSS 視窗像素。
 * matrix 為列主序 16 元素（與 three.js Matrix4.elements 相同）。
 * 回傳 null 表示在相機後方或矩陣無效。
 */
export function projectWorldPointToViewport(
  world: WorldPoint,
  viewProjection: Matrix4Elements,
  viewport: ViewportSize,
): { x: number; y: number; ndcZ: number } | null {
  if (!viewProjection || viewProjection.length < 16) return null;
  const width = viewport.width;
  const height = viewport.height;
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }

  const x = world.x;
  const y = world.y;
  const z = world.z;
  const m = viewProjection;
  const clipX = m[0]! * x + m[4]! * y + m[8]! * z + m[12]!;
  const clipY = m[1]! * x + m[5]! * y + m[9]! * z + m[13]!;
  const clipZ = m[2]! * x + m[6]! * y + m[10]! * z + m[14]!;
  const clipW = m[3]! * x + m[7]! * y + m[11]! * z + m[15]!;
  if (!Number.isFinite(clipW) || Math.abs(clipW) < 1e-8) return null;
  if (clipW < 0) return null;

  const ndcX = clipX / clipW;
  const ndcY = clipY / clipW;
  const ndcZ = clipZ / clipW;
  if (![ndcX, ndcY, ndcZ].every(Number.isFinite)) return null;

  return {
    x: (ndcX * 0.5 + 0.5) * width,
    y: (1 - (ndcY * 0.5 + 0.5)) * height,
    ndcZ,
  };
}

/**
 * 由頭部與胸口（或肩）投影點估算頭部螢幕高度。
 */
export function estimateHeadHeightPxFromProjectedPoints(
  head: { x: number; y: number } | null,
  reference: { x: number; y: number } | null,
  fallbackPx: number,
): number {
  if (!head || !reference) {
    return Math.max(40, fallbackPx);
  }
  const dy = Math.abs(head.y - reference.y);
  if (!Number.isFinite(dy) || dy < 8) {
    return Math.max(40, fallbackPx);
  }
  // 頭到胸口約為頭部高度的 1.6–2.2 倍；取中位係數。
  return Math.max(40, dy / 1.9);
}

/**
 * 優先使用骨點投影；缺資料時退回角色尺寸估算。
 */
export function resolveHeadAnchor(input: {
  viewportWidth: number;
  viewportHeight: number;
  characterSize: number;
  projectedHead?: { x: number; y: number } | null;
  projectedChest?: { x: number; y: number } | null;
}): HeadAnchorEstimate {
  const fallback = estimateHeadAnchorFromCharacterSize(
    input.viewportWidth,
    input.viewportHeight,
    input.characterSize,
  );
  const head = input.projectedHead;
  if (!head || !Number.isFinite(head.x) || !Number.isFinite(head.y)) {
    return fallback;
  }
  const headHeightPx = estimateHeadHeightPxFromProjectedPoints(
    head,
    input.projectedChest ?? null,
    fallback.headHeightPx,
  );
  const preferredSide: BubbleHorizontalSide =
    head.x > input.viewportWidth * 0.72 ? 'left' : 'right';
  return {
    x: head.x,
    y: head.y,
    preferredSide,
    headHeightPx,
  };
}
