import { describe, expect, it } from 'vitest';
import {
  assignableVrmaSuggestions,
  suggestVrmaAssignment,
  suggestVrmaAssignments,
} from './vrma-assignment-suggest';

const animations = [
  { id: 'a-idle', animation_name: 'idle', animation_type: 'IDLE' as const },
  {
    id: 'a-speak',
    animation_name: 'speaking',
    animation_type: 'TALK' as const,
  },
  { id: 'a-work', animation_name: 'working', animation_type: null },
  { id: 'a-wave', animation_name: 'wave', animation_type: null },
];

describe('suggestVrmaAssignment', () => {
  it('matches exact animation name', () => {
    const result = suggestVrmaAssignment('wave.vrma', animations);
    expect(result.matchKind).toBe('exact_name');
    expect(result.animationId).toBe('a-wave');
  });

  it('matches name prefix before whitelist', () => {
    const result = suggestVrmaAssignment('wave_happy.vrma', animations);
    expect(result.matchKind).toBe('name_prefix');
    expect(result.animationId).toBe('a-wave');

    const idlePrefix = suggestVrmaAssignment('idle-breathe.vrma', animations);
    expect(idlePrefix.matchKind).toBe('name_prefix');
    expect(idlePrefix.animationId).toBe('a-idle');
  });

  it('uses whitelist for idle/talk stems without name prefix', () => {
    const idle = suggestVrmaAssignment('rest_loop.vrma', animations);
    expect(idle.matchKind).toBe('whitelist_slot');
    expect(idle.animationId).toBe('a-idle');
    expect(idle.stateSlotHint).toBe('idle');

    const talk = suggestVrmaAssignment('talk-soft.vrma', animations);
    expect(talk.matchKind).toBe('whitelist_slot');
    expect(talk.animationId).toBe('a-speak');
  });

  it('returns none when no whitelist or name match', () => {
    const result = suggestVrmaAssignment('mystery-dance.vrma', animations);
    expect(result.matchKind).toBe('none');
    expect(result.animationId).toBeNull();
  });

  it('does not invent targets for whitelist without installed action', () => {
    const result = suggestVrmaAssignment('success-pose.vrma', animations);
    expect(result.matchKind).toBe('none');
    expect(result.stateSlotHint).toBe('success');
    expect(result.animationId).toBeNull();
  });
});

describe('suggestVrmaAssignments / assignable', () => {
  it('filters assignable suggestions', () => {
    const all = suggestVrmaAssignments(
      ['idle.vrma', 'mystery.vrma', 'speaking_01.vrma'],
      animations,
    );
    const assignable = assignableVrmaSuggestions(all);
    expect(assignable).toHaveLength(2);
    expect(assignable.every((item) => item.animationId)).toBe(true);
  });
});
