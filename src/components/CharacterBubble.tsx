import { useLayoutEffect, useRef, useState } from 'react';
import type { CharacterMessage } from '../character-message';
import {
  resolveBubbleLayout,
  type BubbleHorizontalSide,
  type BubbleLayout,
} from '../bubble-layout';

export interface CharacterBubbleProps {
  message: CharacterMessage | null;
  /** 角色縮放（settings.character_size，約 0.3–1）。 */
  characterSize?: number;
  /** 測試或外部覆寫；未提供時依視窗與角色尺寸估算錨點。 */
  layout?: BubbleLayout | null;
}

function estimateHeadAnchor(
  viewportWidth: number,
  viewportHeight: number,
  characterSize: number,
): { x: number; y: number; preferredSide: BubbleHorizontalSide } {
  const size = Math.min(1, Math.max(0.3, characterSize));
  // 角色多靠視窗右下；頭部約在角色高度上緣。
  const characterHeight = viewportHeight * (0.42 + size * 0.38);
  const characterWidth = viewportWidth * (0.28 + size * 0.22);
  const feetY = viewportHeight * 0.92;
  const centerX = viewportWidth * 0.62;
  return {
    x: centerX,
    y: Math.max(viewportHeight * 0.12, feetY - characterHeight * 0.82),
    preferredSide:
      centerX + characterWidth * 0.35 > viewportWidth * 0.72 ? 'left' : 'right',
  };
}

export function CharacterBubble({
  message,
  characterSize = 1,
  layout: layoutOverride = null,
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
      const bubbleWidth = el?.offsetWidth || 200;
      const bubbleHeight = el?.offsetHeight || 64;
      const anchor = estimateHeadAnchor(
        window.innerWidth,
        window.innerHeight,
        characterSize,
      );
      setLayout(
        resolveBubbleLayout({
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
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
  }, [message, characterSize, layoutOverride]);

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
