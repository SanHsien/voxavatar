/**
 * 系統狀態動作槽預設綁定（純邏輯）。
 * 只填「尚未出現在 bindings 物件」的鍵；明確寫入 null（使用者選未綁定）不覆寫。
 */

import type { CharacterState } from './character-state';
import type { StateSlotBinding } from './character-state-slots';

export interface PlayableAnimationRef {
  animation_name: string;
  animation_type?: 'IDLE' | 'TALK' | string | null;
}

const STATE_KEYS = [
  'idle',
  'listening',
  'speaking',
  'working',
  'reviewing',
  'success',
  'failed',
] as const satisfies ReadonlyArray<CharacterState>;

function playableNameSet(
  playable: readonly PlayableAnimationRef[],
): Set<string> {
  return new Set(
    playable
      .map((entry) => entry.animation_name.trim().toLowerCase())
      .filter(Boolean),
  );
}

function firstOfType(
  playable: readonly PlayableAnimationRef[],
  type: 'IDLE' | 'TALK',
): string | null {
  const match = playable.find(
    (entry) =>
      entry.animation_type === type &&
      typeof entry.animation_name === 'string' &&
      entry.animation_name.trim(),
  );
  return match ? match.animation_name.trim().toLowerCase() : null;
}

function pickPreferred(
  names: Set<string>,
  preferred: string | null,
  fallback: string | null,
): string | null {
  if (preferred && names.has(preferred)) return preferred;
  if (fallback && names.has(fallback)) return fallback;
  return null;
}

/**
 * 為尚未設定的狀態槽建議預設動作名。
 * - idle／listening → `idle` 或第一個 IDLE 類型
 * - speaking → `speaking` 或第一個 TALK 類型
 * - 其餘 → 與狀態同名的可播放動作（若有）
 */
export function applyDefaultStateSlotBindings(
  existing: StateSlotBinding | null | undefined,
  playable: readonly PlayableAnimationRef[],
): StateSlotBinding {
  const current: StateSlotBinding =
    existing && typeof existing === 'object' ? { ...existing } : {};
  const names = playableNameSet(playable);
  if (names.size === 0) return current;

  const idleFallback = firstOfType(playable, 'IDLE');
  const talkFallback = firstOfType(playable, 'TALK');
  const suggestions: Partial<Record<CharacterState, string | null>> = {
    idle: pickPreferred(names, 'idle', idleFallback),
    listening: pickPreferred(names, 'idle', idleFallback),
    speaking: pickPreferred(names, 'speaking', talkFallback),
    working: names.has('working') ? 'working' : null,
    reviewing: names.has('reviewing') ? 'reviewing' : null,
    success: names.has('success') ? 'success' : null,
    failed: names.has('failed') ? 'failed' : null,
  };

  for (const state of STATE_KEYS) {
    if (Object.prototype.hasOwnProperty.call(current, state)) continue;
    const suggested = suggestions[state];
    if (suggested) current[state] = suggested;
  }
  return current;
}
