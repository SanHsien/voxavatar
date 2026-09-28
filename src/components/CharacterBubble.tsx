import { useLayoutEffect, useRef, useState } from 'react';
import type { CharacterMessage } from '../character-message';
import {
  resolveBubbleLayout,
  type BubbleLayout,
} from '../bubble-layout';
import { resolveHeadAnchor } from '../head-projection';

export interface CharacterBubbleProps {
  message: CharacterMessage | null;
  /** 角色縮放（settings.character_size，約 0.3–1）。 */
  characterSize?: number;
  /** 測試或外部覆寫；未提供時依視窗與角色尺寸估算錨點。 */
  layout?: BubbleLayout | null;
  /** 可選：由 Scene 投影的頭部／胸口螢幕座標（與 projectionViewport 同一空間）。 */
  projectedHead?: { x: number; y: number } | null;
  projectedChest?: { x: number; y: number } | null;
  /** 與投影座標同一空間的尺寸；未提供時量測 offsetParent／window。 */
  projectionViewport?: { width: number; height: number } | null;
}

export function CharacterBubble({
  message,
  characterSize = 1,
  layout: layoutOverride = null,
  projectedHead = null,
  projectedChest = null,
  projectionViewport = null,
}: CharacterBubbleProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<BubbleLayout | null>(layoutOverride);

  useLayoutEffect(() => {
    if (layoutOverride) {
      setLayout(layoutOverride);
      return;
    }
    if (!message || typeof window === 'undefined') {
      setLayout(null);
      return;
    }

    const measure = () => {
      const el = rootRef.current;
      const host = el?.offsetParent as HTMLElement | null;
      const viewportWidth =
        projectionViewport?.width && projectionViewport.width > 0
          ? projectionViewport.width
          : host?.clientWidth || window.innerWidth;
      const viewportHeight =
        projectionViewport?.height && projectionViewport.height > 0
          ? projectionViewport.height
          : host?.clientHeight || window.innerHeight;
      const bubbleWidth = el?.offsetWidth || 200;
      const bubbleHeight = el?.offsetHeight || 64;
      const anchor = resolveHeadAnchor({
        viewportWidth,
        viewportHeight,
        characterSize,
        projectedHead,
        projectedChest,
      });
      setLayout(
        resolveBubbleLayout({
          viewportWidth,
          viewportHeight,
          anchorX: anchor.x,
          anchorY: anchor.y,
          bubbleWidth,
          bubbleHeight,
          preferredSide: anchor.preferredSide,
          margin: 12,
        }),
      );
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [
    message,
    characterSize,
    layoutOverride,
    projectedHead,
    projectedChest,
    projectionViewport,
  ]);

  if (!message) return null;

  const positioned = layout != null;
  const style = positioned
    ? {
        left: layout.left,
        top: layout.top,
        transform: 'none',
      }
    : undefined;

  return (
    <div
      ref={rootRef}
      aria-live="polite"
      className={`character-bubble mood-${message.mood}${
        positioned ? ` side-${layout.side}` : ''
      }`}
      data-side={positioned ? layout.side : undefined}
      data-testid="character-bubble"
      role="status"
      style={style}
    >
      <span className="character-bubble-text">{message.text}</span>
    </div>
  );
}
