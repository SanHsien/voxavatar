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

/**
 * 從多段素材隨機抽一支。有上一支時先排除再抽，避免固定順序／連播同一支。
 */
export function randomAnimationUrl(
  choices: readonly string[],
  previous: string | null = null,
  random: () => number = Math.random,
): string | null {
  if (choices.length === 0) return null;
  const candidates =
    choices.length > 1 && previous != null
      ? choices.filter((choice) => choice !== previous)
      : [...choices];
  if (candidates.length === 0) return choices[0] ?? null;
  const randomIndex = Math.min(
    candidates.length - 1,
    Math.floor(Math.max(0, random()) * candidates.length),
  );
  return candidates[randomIndex] ?? null;
}
