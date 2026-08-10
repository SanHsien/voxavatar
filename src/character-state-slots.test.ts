import { describe, expect, it } from 'vitest';
import {
  bindingsFromActionPackActions,
  isSystemSlotFallbackMotion,
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

describe('isSystemSlotFallbackMotion', () => {
  // 迴歸：快照的預設綁定 {idle:'idle', listening:'idle', speaking:'speaking'} 會讓
  // idle 解析出具名動作，呼叫端若當成 override 就會把 Idle 鎖成單一動作無限循環。
  it('treats default idle/listening/speaking bindings as no named motion', () => {
    const defaults = {
      idle: 'idle',
      listening: 'idle',
      speaking: 'speaking',
    };
    for (const [state, type] of [
      ['idle', 'IDLE'],
      ['listening', 'IDLE'],
      ['speaking', 'TALK'],
    ] as const) {
      const motion = resolveStateMotion({
        state,
        bindings: defaults,
        playableNames: ['idle', 'speaking'],
      });
      expect(motion.animationName, state).not.toBeNull();
      expect(isSystemSlotFallbackMotion(motion, type), state).toBe(true);
    }
  });

  it('keeps a real custom action bound to a non-system slot', () => {
    const motion = resolveStateMotion({
      state: 'working',
      bindings: { working: 'work-nod' },
      playableNames: ['work-nod'],
    });
    expect(isSystemSlotFallbackMotion(motion, null)).toBe(false);
  });

  it('keeps a named action whose type differs from the state hint', () => {
    const motion = resolveStateMotion({
      state: 'idle',
      bindings: { idle: 'dance' },
      playableNames: ['dance'],
    });
    expect(isSystemSlotFallbackMotion(motion, 'DANCE')).toBe(false);
  });

  it('is false without a named motion', () => {
    const motion = resolveStateMotion({ state: 'idle', playableNames: [] });
    expect(motion.animationName).toBeNull();
    expect(isSystemSlotFallbackMotion(motion, 'IDLE')).toBe(false);
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
