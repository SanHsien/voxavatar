export type AnimationType =
  | 'IDLE'
  | 'GREETING'
  | 'TALK'
  | 'HAPPY'
  | 'FINGER_GUN'
  | 'DANCE';
export type PlayableAnimationType = AnimationType | 'CUSTOM';

export function immediateVoiceAnimation(
  voice: Pick<VoiceState, 'activity' | 'outputMuted' | 'phase'>,
): 'IDLE' | 'TALK' | null {
  if (voice.phase !== 'active' || voice.outputMuted) return 'IDLE';
  if (voice.activity === 'speaking') return 'TALK';
  return null;
}

export function animationUrlsForType(
  animations: readonly VoxAvatarAnimationSettings[],
  type: PlayableAnimationType,
): string[] {
  return animations
    .filter((animation) => animation.animation_type === type)
    .flatMap((animation) => animation.asset_urls);
}

/** Idle 待機可隨機輪播的動作池：Idle＋其他非說話類（有素材才進池）。 */
const AMBIENT_IDLE_TYPES = new Set<VoxAvatarAnimationType>([
  'IDLE',
  'GREETING',
  'HAPPY',
  'FINGER_GUN',
  'DANCE',
]);

export function ambientIdleMotionUrls(
  animations: readonly VoxAvatarAnimationSettings[],
): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();
  for (const animation of animations) {
    if (
      !animation.animation_type ||
      !AMBIENT_IDLE_TYPES.has(animation.animation_type)
    ) {
      continue;
    }
    for (const url of animation.asset_urls) {
      if (seen.has(url)) continue;
      seen.add(url);
      urls.push(url);
    }
  }
  return urls;
}

/** 會隨機輪播的狀態：待機與說話都應該從整池輪播，不是鎖死單一片段。 */
const CYCLING_ANIMATION_TYPES = new Set<PlayableAnimationType>([
  'IDLE',
  'TALK',
]);

export function shouldCycleRandomMotions(
  animation: PlayableAnimationType,
  urlCount: number,
): boolean {
  return CYCLING_ANIMATION_TYPES.has(animation) && urlCount > 0;
}

/**
 * 兩支輪播片段之間的停頓。說話不套用待機休息，否則句子講到一半會凍住。
 */
export function motionRestMsForAnimation(
  animation: PlayableAnimationType,
  idleRestMs: number,
): number {
  if (animation === 'TALK') return 0;
  return Number.isFinite(idleRestMs) ? Math.max(0, idleRestMs) : 0;
}

// 選片邏輯見 `motion-shuffle-bag.ts`：一輪內每支各播一次再重洗，
// 取代原本「每次從整池重抽、只排除上一支」的純隨機（覆蓋率差且會近距重複）。
