import { describe, expect, it } from 'vitest';
import {
  clearMessagesForSource,
  countGraphemes,
  enqueueCharacterMessage,
  isMessageVisible,
  normalizeCharacterMessage,
  type CharacterMessage,
} from './character-message';

describe('normalizeCharacterMessage', () => {
  it('accepts short unicode text and clamps duration', () => {
    const result = normalizeCharacterMessage({
      text: '  完成！✨  ',
      durationMs: 99_000,
      mood: 'cheerful',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.message.text).toBe('完成！✨');
    expect(result.message.durationMs).toBe(15_000);
    expect(result.message.mood).toBe('cheerful');
  });

  it('rejects empty, control-only, and overlong text', () => {
    expect(normalizeCharacterMessage({ text: '   ' }).ok).toBe(false);
    expect(normalizeCharacterMessage({ text: '\u0007' }).ok).toBe(false);
    expect(
      normalizeCharacterMessage({ text: '字'.repeat(81) }).ok,
    ).toBe(false);
  });

  it('falls back unknown mood to neutral', () => {
    const result = normalizeCharacterMessage({
      text: 'hi',
      mood: 'rainbow',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.message.mood).toBe('neutral');
  });

  it('counts grapheme clusters when Segmenter exists', () => {
    expect(countGraphemes('👨‍💻')).toBeGreaterThanOrEqual(1);
  });
});

describe('message queue', () => {
  const base = (id: string, text: string): CharacterMessage => ({
    id,
    text,
    durationMs: 4000,
    mood: 'neutral',
    sourceId: 's1',
    atMs: 100,
  });

  it('merges duplicate trailing messages', () => {
    const queue = enqueueCharacterMessage(
      [base('1', '完成！')],
      { ...base('2', '完成！'), durationMs: 8000, atMs: 200 },
    );
    expect(queue).toHaveLength(1);
    expect(queue[0]?.durationMs).toBe(8000);
  });

  it('drops oldest when over capacity', () => {
    let queue: CharacterMessage[] = [];
    for (let i = 0; i < 6; i += 1) {
      queue = enqueueCharacterMessage(queue, base(String(i), `m${i}`), 4);
    }
    expect(queue).toHaveLength(4);
    expect(queue[0]?.text).toBe('m2');
  });

  it('clears by source and tracks visibility', () => {
    const queue = [
      base('1', 'a'),
      { ...base('2', 'b'), sourceId: 'other' },
    ];
    expect(clearMessagesForSource(queue, 's1')).toHaveLength(1);
    expect(isMessageVisible(base('1', 'a'), 100)).toBe(true);
    expect(isMessageVisible(base('1', 'a'), 5000)).toBe(false);
  });
});
