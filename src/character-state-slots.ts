/**
 * 角色狀態 → 系統動作槽／action-pack 名稱解析（純邏輯）。
 */

import type { CharacterState } from './character-state';
import { animationHintForState } from './character-state';

export type StateSlotBinding = Partial<
  Record<CharacterState, string | null | undefined>
>;

export interface ResolveStateMotionInput {
  state: CharacterState;
  /** Settings／action-pack 提供的狀態→動作名。 */
  bindings?: StateSlotBinding;
  /** 目前可播放的動作名稱集合。 */
  playableNames?: ReadonlySet<string> | readonly string[];
}

export interface ResolvedStateMotion {
  state: CharacterState;
  animationName: string | null;
  animationHint: 'IDLE' | 'TALK' | null;
  /** 無專用槽或素材時退回 Idle／預設姿勢。 */
  fallback: 'idle' | 'none';
}

function asNameSet(
  playableNames?: ReadonlySet<string> | readonly string[],
): Set<string> | null {
  if (!playableNames) return null;
  if (playableNames instanceof Set) return playableNames;
  return new Set(playableNames);
}

/**
 * 解析狀態應對應的可播放動作。
 * - speaking → 優先 TALK 槽／hint
 * - idle／listening → IDLE hint（可不指定具名動作）
 * - 其他狀態：bindings 有值且 playable 才採用，否則 fallback idle
 */
export function resolveStateMotion(
  input: ResolveStateMotionInput,
): ResolvedStateMotion {
  const { state, bindings = {} } = input;
  const playable = asNameSet(input.playableNames);
  const hint = animationHintForState(state);
  const bound = bindings[state];
  const boundName =
    typeof bound === 'string' && bound.trim() ? bound.trim() : null;

  if (boundName && (!playable || playable.has(boundName))) {
    return {
      state,
      animationName: boundName,
      animationHint: hint,
      fallback: 'none',
    };
  }

  if (hint === 'TALK') {
    return {
      state,
      animationName: null,
      animationHint: 'TALK',
      fallback: 'none',
    };
  }

  if (hint === 'IDLE' || state === 'idle' || state === 'listening') {
    return {
      state,
      animationName: null,
      animationHint: 'IDLE',
      fallback: 'idle',
    };
  }

  return {
    state,
    animationName: null,
    animationHint: 'IDLE',
    fallback: 'idle',
  };
}

/** 從 action-pack actions 建立 state_slot → animation_name 對照。 */
export function bindingsFromActionPackActions(
  actions: readonly {
    animation_name: string;
    state_slot?: string | null;
  }[],
): StateSlotBinding {
  const bindings: StateSlotBinding = {};
  for (const action of actions) {
    if (!action.state_slot) continue;
    if (bindings[action.state_slot as CharacterState]) continue;
    bindings[action.state_slot as CharacterState] = action.animation_name;
  }
  return bindings;
}
