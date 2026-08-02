import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CharacterBubble } from './CharacterBubble';

describe('CharacterBubble', () => {
  it('renders nothing without a message', () => {
    expect(renderToStaticMarkup(<CharacterBubble message={null} />)).toBe('');
  });

  it('renders sanitized text with mood class', () => {
    const html = renderToStaticMarkup(
      <CharacterBubble
        message={{
          id: '1',
          text: '完成！',
          durationMs: 4000,
          mood: 'cheerful',
          sourceId: 's',
          atMs: 1,
        }}
      />,
    );
    expect(html).toContain('character-bubble');
    expect(html).toContain('mood-cheerful');
    expect(html).toContain('完成！');
    expect(html).not.toContain('<script');
  });

  it('applies edge-aware layout when provided', () => {
    const html = renderToStaticMarkup(
      <CharacterBubble
        layout={{ side: 'left', left: 24, top: 40 }}
        message={{
          id: '2',
          text: '靠左',
          durationMs: 2000,
          mood: 'neutral',
          sourceId: 's',
          atMs: 2,
        }}
      />,
    );
    expect(html).toContain('side-left');
    expect(html).toContain('data-side="left"');
    expect(html).toContain('left:24px');
    expect(html).toContain('top:40px');
  });
});
