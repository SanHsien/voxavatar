import { describe, expect, it } from 'vitest';
import {
  ambientIdleMotionUrls,
  animationUrlsForType,
  immediateVoiceAnimation,
  motionRestMsForAnimation,
  randomAnimationUrl,
  shouldCycleRandomMotions,
} from './animation-catalog';

describe('VoxAvatar animation contract', () => {
  it('enters speaking directly when voice is already active at startup', () => {
    expect(
      immediateVoiceAnimation({
        activity: 'speaking',
        outputMuted: false,
        phase: 'active',
      }),
    ).toBe('TALK');
    expect(
      immediateVoiceAnimation({
        activity: 'listening',
        outputMuted: false,
        phase: 'active',
      }),
    ).toBeNull();
    expect(
      immediateVoiceAnimation({
        activity: 'speaking',
        outputMuted: true,
        phase: 'active',
      }),
    ).toBe('IDLE');
  });

  it('uses no clip for the empty idle pose when no asset is configured', () => {
    expect(randomAnimationUrl([])).toBeNull();
  });

  // 迴歸：輪播原本硬綁 IDLE，說話一律 loop，指派多支 Speaking 片段也只會用到一支。
  it('cycles both idle and talk pools, never an empty pool', () => {
    expect(shouldCycleRandomMotions('IDLE', 3)).toBe(true);
    expect(shouldCycleRandomMotions('TALK', 3)).toBe(true);
    expect(shouldCycleRandomMotions('IDLE', 0)).toBe(false);
    expect(shouldCycleRandomMotions('TALK', 0)).toBe(false);
    expect(shouldCycleRandomMotions('CUSTOM', 3)).toBe(false);
    expect(shouldCycleRandomMotions('DANCE', 3)).toBe(false);
  });

  // 說話時套用待機休息會讓角色在句子中間凍住，所以 TALK 的停頓必須是 0。
  it('rests between idle clips but chains talk clips without a gap', () => {
    expect(motionRestMsForAnimation('IDLE', 8000)).toBe(8000);
    expect(motionRestMsForAnimation('TALK', 8000)).toBe(0);
    expect(motionRestMsForAnimation('IDLE', Number.NaN)).toBe(0);
    expect(motionRestMsForAnimation('IDLE', -5)).toBe(0);
  });

  it('chooses randomly while avoiding an immediate repeat', () => {
    const choices = ['first.vrma', 'second.vrma', 'third.vrma'];
    expect(randomAnimationUrl(choices, null, () => 0)).toBe('first.vrma');
    expect(randomAnimationUrl(choices, 'first.vrma', () => 0)).toBe(
      'second.vrma',
    );
    expect(randomAnimationUrl(choices, 'first.vrma', () => 0.99)).toBe(
      'third.vrma',
    );
  });

  it('builds an ambient idle pool from non-talk motions without duplicates', () => {
    const animations = [
      {
        animation_type: 'IDLE',
        asset_urls: ['idle-a.vrma', 'idle-b.vrma'],
      },
      {
        animation_type: 'GREETING',
        asset_urls: ['wave.vrma'],
      },
      {
        animation_type: 'TALK',
        asset_urls: ['talk.vrma'],
      },
      {
        animation_type: 'HAPPY',
        asset_urls: ['wave.vrma', 'happy.vrma'],
      },
    ] as VoxAvatarAnimationSettings[];

    expect(ambientIdleMotionUrls(animations)).toEqual([
      'idle-a.vrma',
      'idle-b.vrma',
      'wave.vrma',
      'happy.vrma',
    ]);
  });

  it('combines every configured asset for the same live role', () => {
    const animations = [
      {
        animation_type: 'TALK',
        asset_urls: ['talk1.vrma'],
      },
      {
        animation_type: 'IDLE',
        asset_urls: ['idle.vrma'],
      },
      {
        animation_type: 'TALK',
        asset_urls: ['talk2.vrma', 'talk3.vrma'],
      },
    ] as VoxAvatarAnimationSettings[];

    expect(animationUrlsForType(animations, 'TALK')).toEqual([
      'talk1.vrma',
      'talk2.vrma',
      'talk3.vrma',
    ]);
  });
});
