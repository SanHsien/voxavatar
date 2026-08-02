import { describe, expect, it } from 'vitest';
import {
  bindingsFromActionPackActions,
  resolveStateMotion,
} from './character-state-slots';

describe('resolveStateMotion', () => {
  it('uses bound playable action for working', () => {
    const resolved = resolveStateMotion({
      state: 'working',
      bindings: { working: 'work-nod' },
      playableNames: ['work-nod', 'idle-breathe'],
    });
    expect(resolved.animationName).toBe('work-nod');
    expect(resolved.fallback).toBe('none');
  });

  it('falls back to idle when binding missing or not playable', () => {
    expect(
      resolveStateMotion({
        state: 'failed',
        bindings: { failed: 'missing-clip' },
        playableNames: ['idle-breathe'],
      }).fallback,
    ).toBe('idle');
    expect(
      resolveStateMotion({ state: 'reviewing', playableNames: [] }).animationHint,
    ).toBe('IDLE');
  });

  it('keeps speaking on TALK hint without requiring a named clip', () => {
    const resolved = resolveStateMotion({ state: 'speaking' });
    expect(resolved.animationHint).toBe('TALK');
    expect(resolved.fallback).toBe('none');
  });
});

describe('bindingsFromActionPackActions', () => {
  it('maps first slot wins', () => {
    const bindings = bindingsFromActionPackActions([
      { animation_name: 'a', state_slot: 'success' },
      { animation_name: 'b', state_slot: 'success' },
      { animation_name: 'c', state_slot: 'working' },
    ]);
    expect(bindings.success).toBe('a');
    expect(bindings.working).toBe('c');
  });
});
