import { describe, expect, it } from 'vitest';
import { applyDefaultStateSlotBindings } from './state-slot-defaults';

describe('applyDefaultStateSlotBindings', () => {
  it('fills idle/listening/speaking from system names when playable', () => {
    const result = applyDefaultStateSlotBindings({}, [
      { animation_name: 'idle', animation_type: 'IDLE' },
      { animation_name: 'speaking', animation_type: 'TALK' },
      { animation_name: 'work-loop', animation_type: null },
    ]);
    expect(result).toEqual({
      idle: 'idle',
      listening: 'idle',
      speaking: 'speaking',
    });
  });

  it('does not overwrite explicit null (user cleared)', () => {
    const result = applyDefaultStateSlotBindings(
      { idle: null, speaking: 'speaking' },
      [
        { animation_name: 'idle', animation_type: 'IDLE' },
        { animation_name: 'speaking', animation_type: 'TALK' },
      ],
    );
    expect(result.idle).toBeNull();
    expect(result.speaking).toBe('speaking');
    expect(result.listening).toBe('idle');
  });

  it('binds same-named custom states when playable', () => {
    const result = applyDefaultStateSlotBindings({}, [
      { animation_name: 'working', animation_type: null },
      { animation_name: 'success', animation_type: null },
    ]);
    expect(result.working).toBe('working');
    expect(result.success).toBe('success');
    expect(result.failed).toBeUndefined();
  });

  it('falls back to first IDLE/TALK type when names differ', () => {
    const result = applyDefaultStateSlotBindings({}, [
      { animation_name: 'calm-loop', animation_type: 'IDLE' },
      { animation_name: 'talk-soft', animation_type: 'TALK' },
    ]);
    expect(result.idle).toBe('calm-loop');
    expect(result.listening).toBe('calm-loop');
    expect(result.speaking).toBe('talk-soft');
  });

  it('returns existing bindings unchanged when nothing playable', () => {
    expect(applyDefaultStateSlotBindings({ working: 'x' }, [])).toEqual({
      working: 'x',
    });
  });
});
