import { describe, expect, it } from 'vitest';
import {
  finishBodyAnimationOverride,
  resolveBodyAnimation,
  type BodyAnimationOverride,
} from './animation-priority';

describe('commanded body animation priority', () => {
  it('keeps the override visible while voice state changes, then restores voice state', () => {
    const override: BodyAnimationOverride = {
      animation: 'DANCE',
      requestId: 1,
    };

    expect(resolveBodyAnimation('IDLE', override)).toBe('DANCE');
    expect(resolveBodyAnimation('TALK', override)).toBe('DANCE');

    const finished = finishBodyAnimationOverride(override, 1);
    expect(resolveBodyAnimation('TALK', finished)).toBe('TALK');
  });

  it('ignores completion from an override replaced by a newer command', () => {
    const newerOverride: BodyAnimationOverride = {
      animation: 'FINGER_GUN',
      requestId: 2,
    };

    expect(finishBodyAnimationOverride(newerOverride, 1)).toBe(newerOverride);
    expect(resolveBodyAnimation('IDLE', newerOverride)).toBe('FINGER_GUN');
    expect(finishBodyAnimationOverride(newerOverride, 2)).toBeNull();
  });

  it('supports custom animation assets without replacing voice state', () => {
    const override: BodyAnimationOverride = {
      animation: 'CUSTOM',
      animationName: 'wave-hello',
      animationUrls: ['voxavatar-asset://animation/wave-hello.vrma'],
      requestId: 3,
    };

    expect(resolveBodyAnimation('TALK', override)).toBe('CUSTOM');
    expect(finishBodyAnimationOverride(override, 3)).toBeNull();
    expect(resolveBodyAnimation('TALK', null)).toBe('TALK');
  });
});
