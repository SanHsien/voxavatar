/**
 * 依檔名白名單建議 VRMA → 既有動作（純邏輯）。
 * 不推斷情緒／聊天／音訊內容；不明確則回 null，須使用者確認後才寫入。
 */

export type VrmaAssignmentMatchKind =
  | 'exact_name'
  | 'name_prefix'
  | 'whitelist_slot'
  | 'none';

export interface AnimationTargetRef {
  id: string;
  animation_name: string;
  animation_type?: 'IDLE' | 'TALK' | string | null;
}

export interface VrmaAssignmentSuggestion {
  basename: string;
  stem: string;
  matchKind: VrmaAssignmentMatchKind;
  animationId: string | null;
  animationName: string | null;
  /** 白名單對應的狀態槽提示（listening 不獨立建議，idle 涵蓋） */
  stateSlotHint: string | null;
  reason: string;
}

const STATE_SLOT_HINTS = [
  {
    slot: 'idle',
    patterns: [
      /^idle([\W_]|$)/i,
      /^wait([\W_]|$)/i,
      /^rest([\W_]|$)/i,
      /^breath/i,
      /(^|[\W_])idle([\W_]|$)/i,
    ],
    preferredNames: ['idle'],
    preferredTypes: ['IDLE'] as const,
  },
  {
    slot: 'speaking',
    patterns: [
      /^speak/i,
      /^talk/i,
      /^lip/i,
      /(^|[\W_])(speak|talk|speaking)([\W_]|$)/i,
    ],
    preferredNames: ['speaking', 'talk'],
    preferredTypes: ['TALK'] as const,
  },
  {
    slot: 'working',
    patterns: [/^work/i, /(^|[\W_])work(ing)?([\W_]|$)/i, /^nod/i],
    preferredNames: ['working', 'work-nod'],
    preferredTypes: [] as const,
  },
  {
    slot: 'reviewing',
    patterns: [/^review/i, /(^|[\W_])review(ing)?([\W_]|$)/i],
    preferredNames: ['reviewing'],
    preferredTypes: [] as const,
  },
  {
    slot: 'success',
    patterns: [/^success/i, /^cheer/i, /(^|[\W_])success([\W_]|$)/i],
    preferredNames: ['success'],
    preferredTypes: [] as const,
  },
  {
    slot: 'failed',
    patterns: [/^fail/i, /^error/i, /(^|[\W_])(fail|failed|error)([\W_]|$)/i],
    preferredNames: ['failed', 'fail'],
    preferredTypes: [] as const,
  },
] as const;

function stripExtension(filename: string): string {
  const base = filename.replace(/^.*[/\\]/, '').trim();
  return base.replace(/\.vrma$/i, '');
}

function normalizeStem(stem: string): string {
  return stem.trim().toLowerCase().replace(/\s+/g, '-');
}

function findByName(
  animations: readonly AnimationTargetRef[],
  name: string,
): AnimationTargetRef | null {
  const needle = name.trim().toLowerCase();
  if (!needle) return null;
  return (
    animations.find(
      (entry) => entry.animation_name.trim().toLowerCase() === needle,
    ) ?? null
  );
}

function findByType(
  animations: readonly AnimationTargetRef[],
  type: string,
): AnimationTargetRef | null {
  return (
    animations.find((entry) => entry.animation_type === type) ?? null
  );
}

function matchNamePrefix(
  stem: string,
  animations: readonly AnimationTargetRef[],
): AnimationTargetRef | null {
  const normalized = normalizeStem(stem);
  let best: AnimationTargetRef | null = null;
  let bestLen = 0;
  for (const animation of animations) {
    const name = animation.animation_name.trim().toLowerCase();
    if (!name || name.length < 2) continue;
    if (
      normalized === name ||
      normalized.startsWith(`${name}-`) ||
      normalized.startsWith(`${name}_`)
    ) {
      if (name.length > bestLen) {
        best = animation;
        bestLen = name.length;
      }
    }
  }
  return best;
}

/**
 * 對單一檔名建議目標動作。
 * 優先：與既有動作名完全相符／前綴 → 再白名單狀態槽 → 否則 none。
 */
export function suggestVrmaAssignment(
  filename: string,
  animations: readonly AnimationTargetRef[],
): VrmaAssignmentSuggestion {
  const basename = filename.replace(/^.*[/\\]/, '').trim() || filename;
  const stem = stripExtension(basename);
  const normalized = normalizeStem(stem);

  if (!normalized) {
    return {
      basename,
      stem,
      matchKind: 'none',
      animationId: null,
      animationName: null,
      stateSlotHint: null,
      reason: 'empty_stem',
    };
  }

  const exact = findByName(animations, normalized);
  if (exact) {
    return {
      basename,
      stem,
      matchKind: 'exact_name',
      animationId: exact.id,
      animationName: exact.animation_name,
      stateSlotHint: null,
      reason: 'exact_animation_name',
    };
  }

  const prefix = matchNamePrefix(stem, animations);
  if (prefix) {
    return {
      basename,
      stem,
      matchKind: 'name_prefix',
      animationId: prefix.id,
      animationName: prefix.animation_name,
      stateSlotHint: null,
      reason: 'animation_name_prefix',
    };
  }

  for (const rule of STATE_SLOT_HINTS) {
    if (!rule.patterns.some((pattern) => pattern.test(normalized))) continue;
    let target: AnimationTargetRef | null = null;
    for (const preferred of rule.preferredNames) {
      target = findByName(animations, preferred);
      if (target) break;
    }
    if (!target) {
      for (const type of rule.preferredTypes) {
        target = findByType(animations, type);
        if (target) break;
      }
    }
    if (!target) {
      return {
        basename,
        stem,
        matchKind: 'none',
        animationId: null,
        animationName: null,
        stateSlotHint: rule.slot,
        reason: `whitelist_${rule.slot}_no_target`,
      };
    }
    return {
      basename,
      stem,
      matchKind: 'whitelist_slot',
      animationId: target.id,
      animationName: target.animation_name,
      stateSlotHint: rule.slot,
      reason: `whitelist_${rule.slot}`,
    };
  }

  return {
    basename,
    stem,
    matchKind: 'none',
    animationId: null,
    animationName: null,
    stateSlotHint: null,
    reason: 'no_whitelist_match',
  };
}

export function suggestVrmaAssignments(
  filenames: readonly string[],
  animations: readonly AnimationTargetRef[],
): VrmaAssignmentSuggestion[] {
  return filenames.map((filename) =>
    suggestVrmaAssignment(filename, animations),
  );
}

/** 只保留可寫入的建議（有 animationId）。 */
export function assignableVrmaSuggestions(
  suggestions: readonly VrmaAssignmentSuggestion[],
): VrmaAssignmentSuggestion[] {
  return suggestions.filter(
    (item) => typeof item.animationId === 'string' && item.animationId.length > 0,
  );
}
