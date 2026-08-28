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

export function isForcedSpeakingIdleAction(
  animation: Pick<
    VoxAvatarAnimationSettings,
    'animation_name' | 'animation_type'
  >,
  bindings: VoxAvatarStateSlotBindings = {},
): boolean {
  const speakingName =
    typeof bindings.speaking === 'string'
      ? bindings.speaking.trim().toLowerCase()
      : null;
  return (
    animation.animation_type === 'TALK' ||
    (speakingName != null &&
      animation.animation_name.trim().toLowerCase() === speakingName)
  );
}

/**
 * Idle 待機可隨機輪播的動作池。
 * 預設納入所有有素材的非說話動作；TALK、Speaking 狀態槽與使用者取消的種類排除。
 */
export function ambientIdleMotionUrls(
  animations: readonly VoxAvatarAnimationSettings[],
  bindings: VoxAvatarStateSlotBindings = {},
  excludedAnimationIds: readonly string[] = [],
): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();
  const excludedIds = new Set(excludedAnimationIds);
  for (const animation of animations) {
    if (
      isForcedSpeakingIdleAction(animation, bindings) ||
      excludedIds.has(animation.id)
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
