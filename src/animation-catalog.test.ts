import { describe, expect, it } from 'vitest';
import {
  ambientIdleMotionUrls,
  animationUrlsForType,
  immediateVoiceAnimation,
  motionRestMsForAnimation,
  shouldCycleRandomMotions,
} from './animation-catalog';
import { createMotionBag, drawNextMotion } from './motion-shuffle-bag';

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
    expect(drawNextMotion(createMotionBag(), []).url).toBeNull();
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

  // 選片改由洗牌袋負責；輪次覆蓋與接縫規則的完整契約在 motion-shuffle-bag.test.ts。
  it('plays the whole ambient pool before repeating any clip', () => {
    const pool = ambientIdleMotionUrls([
      {
        id: 'idle',
        animation_name: 'idle',
        animation_type: 'IDLE',
        asset_urls: ['idle-a.vrma', 'idle-b.vrma', 'idle-c.vrma'],
      },
    ] as never);
    let state = createMotionBag();
    const drawn: string[] = [];
    for (let index = 0; index < pool.length; index += 1) {
      const result = drawNextMotion(state, pool);
      state = result.state;
      if (result.url) drawn.push(result.url);
    }
    expect(new Set(drawn)).toEqual(new Set(pool));
  });

  it('builds an ambient idle pool from every non-talk motion without duplicates', () => {
    const animations = [
      {
        animation_name: 'idle',
        animation_type: 'IDLE',
        asset_urls: ['idle-a.vrma', 'idle-b.vrma'],
      },
      {
        id: 'greeting',
        animation_name: 'greeting',
        animation_type: 'GREETING',
        asset_urls: ['wave.vrma'],
      },
      {
        id: 'speaking',
        animation_name: 'speaking',
        animation_type: 'TALK',
        asset_urls: ['talk.vrma'],
      },
      {
        id: 'happy',
        animation_name: 'happy',
        animation_type: 'HAPPY',
        asset_urls: ['wave.vrma', 'happy.vrma'],
      },
      {
        id: 'review-phone',
        animation_name: 'review-phone',
        animation_type: null,
        asset_urls: ['review-phone.vrma'],
      },
      {
        id: 'failed-apology',
        animation_name: 'failed-apology',
        animation_type: null,
        asset_urls: ['failed-apology.vrma'],
      },
    ] as VoxAvatarAnimationSettings[];

    expect(ambientIdleMotionUrls(animations, {}, ['failed-apology'])).toEqual([
      'idle-a.vrma',
      'idle-b.vrma',
      'wave.vrma',
      'happy.vrma',
      'review-phone.vrma',
    ]);
  });

  it('excludes a custom action explicitly assigned to the speaking state', () => {
    const animations = [
      {
        id: 'idle',
        animation_name: 'idle',
        animation_type: 'IDLE',
        asset_urls: ['idle.vrma'],
      },
      {
        id: 'conversation-gesture',
        animation_name: 'conversation-gesture',
        animation_type: null,
        asset_urls: ['conversation-a.vrma', 'conversation-b.vrma'],
      },
      {
        id: 'walk',
        animation_name: 'walk',
        animation_type: null,
        asset_urls: ['walk.vrma'],
      },
    ] as VoxAvatarAnimationSettings[];

    expect(
      ambientIdleMotionUrls(animations, {
        speaking: 'conversation-gesture',
      }),
    ).toEqual(['idle.vrma', 'walk.vrma']);
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
