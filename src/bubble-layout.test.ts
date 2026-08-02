import { describe, expect, it } from 'vitest';
import { resolveBubbleLayout } from './bubble-layout';

describe('resolveBubbleLayout', () => {
  it('keeps preferred right side when there is room', () => {
    const layout = resolveBubbleLayout({
      viewportWidth: 400,
      viewportHeight: 600,
      anchorX: 200,
      anchorY: 180,
      bubbleWidth: 120,
      bubbleHeight: 48,
      preferredSide: 'right',
    });
    expect(layout.side).toBe('right');
    expect(layout.left).toBeGreaterThan(200);
    expect(layout.top).toBeLessThan(180);
  });

  it('flips to left near the right edge', () => {
    const layout = resolveBubbleLayout({
      viewportWidth: 400,
      viewportHeight: 600,
      anchorX: 360,
      anchorY: 200,
      bubbleWidth: 140,
      bubbleHeight: 48,
      preferredSide: 'right',
      margin: 8,
    });
    expect(layout.side).toBe('left');
    expect(layout.left + 140).toBeLessThanOrEqual(360);
  });

  it('clamps inside the viewport', () => {
    const layout = resolveBubbleLayout({
      viewportWidth: 200,
      viewportHeight: 200,
      anchorX: 10,
      anchorY: 10,
      bubbleWidth: 80,
      bubbleHeight: 40,
      preferredSide: 'left',
      margin: 4,
    });
    expect(layout.left).toBeGreaterThanOrEqual(4);
    expect(layout.top).toBeGreaterThanOrEqual(4);
    expect(layout.left + 80).toBeLessThanOrEqual(200);
  });
});
