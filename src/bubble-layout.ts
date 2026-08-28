/**
 * 氣泡邊緣避讓（純邏輯）。
 * 以偏好錨點與視窗邊界決定 left/right／上方偏移，不依賴 DOM。
 */

export type BubbleHorizontalSide = 'left' | 'right';

export interface BubbleLayoutInput {
  viewportWidth: number;
  viewportHeight: number;
  /** 頭部錨點（相對 viewport，左上原點）。 */
  anchorX: number;
  anchorY: number;
  bubbleWidth: number;
  bubbleHeight: number;
  /** 偏好側；空間不足時換邊。 */
  preferredSide?: BubbleHorizontalSide;
  margin?: number;
}

export interface BubbleLayout {
  side: BubbleHorizontalSide;
  left: number;
  top: number;
}

export function resolveBubbleLayout(input: BubbleLayoutInput): BubbleLayout {
  const margin = Math.max(0, input.margin ?? 12);
  const width = Math.max(1, input.viewportWidth);
  const height = Math.max(1, input.viewportHeight);
  const bubbleW = Math.max(1, input.bubbleWidth);
  const bubbleH = Math.max(1, input.bubbleHeight);
  const preferred = input.preferredSide ?? 'right';

  const roomRight = width - input.anchorX - margin;
  const roomLeft = input.anchorX - margin;
  let side: BubbleHorizontalSide = preferred;
  if (preferred === 'right' && roomRight < bubbleW && roomLeft >= bubbleW) {
    side = 'left';
  } else if (preferred === 'left' && roomLeft < bubbleW && roomRight >= bubbleW) {
    side = 'right';
  } else if (roomRight < bubbleW && roomLeft >= roomRight) {
    side = 'left';
  } else if (roomLeft < bubbleW) {
    side = 'right';
  }

  let left =
    side === 'right'
      ? input.anchorX + margin
      : input.anchorX - margin - bubbleW;
  left = Math.min(Math.max(margin, left), Math.max(margin, width - bubbleW - margin));

  let top = input.anchorY - bubbleH - margin;
  if (top < margin) {
    top = Math.min(input.anchorY + margin, height - bubbleH - margin);
  }
  top = Math.min(Math.max(margin, top), Math.max(margin, height - bubbleH - margin));

  return { side, left, top };
}
