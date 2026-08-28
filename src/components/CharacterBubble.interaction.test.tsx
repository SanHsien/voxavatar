/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CharacterBubble } from './CharacterBubble';

describe('CharacterBubble interaction', () => {
  it('anchors to projected head coordinates in the host viewport', () => {
    render(
      <div style={{ position: 'relative', width: 800, height: 600 }}>
        <CharacterBubble
          characterSize={1}
          projectedHead={{ x: 120, y: 180 }}
          projectedChest={{ x: 120, y: 280 }}
          projectionViewport={{ width: 800, height: 600 }}
          message={{
            id: 'm1',
            text: '投影氣泡',
            durationMs: 4000,
            mood: 'cheerful',
            sourceId: 's',
            atMs: 1,
          }}
        />
      </div>,
    );

    const bubble = screen.getByTestId('character-bubble');
    expect(bubble.textContent).toContain('投影氣泡');
    expect(bubble.getAttribute('data-side')).toBe('right');
    expect(bubble.className).toContain('side-right');
    expect(bubble.style.left).toMatch(/px$/);
    expect(bubble.style.top).toMatch(/px$/);
    expect(Number.parseFloat(bubble.style.left)).toBeGreaterThan(120);
    expect(bubble.className).toContain('mood-cheerful');
  });
});
