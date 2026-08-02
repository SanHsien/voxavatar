/**
 * 角色狀態仲裁（純邏輯）。
 * 契約見 docs/CHARACTER_BEHAVIOR.md；不推測對話內容或情緒。
 */

export type CharacterState =
  | 'idle'
  | 'listening'
  | 'speaking'
  | 'working'
  | 'reviewing'
  | 'success'
  | 'failed';

export type CharacterStateSourceKind =
  | 'user'
  | 'system'
  | 'voice'
  | 'mcp'
  | 'integration';

export interface CharacterStateEvent {
  id: string;
  state: CharacterState;
  /** 來源種類；user 永遠最高優先。 */
  sourceKind: CharacterStateSourceKind;
  /** 來源識別（例如 MCP session id）；斷線時用來清除。 */
  sourceId?: string;
  /** 事件生效時刻（ms）。 */
  atMs: number;
  /** 存活毫秒；省略則依狀態預設 TTL。 */
  ttlMs?: number;
}

export interface ResolvedCharacterState {
  state: CharacterState;
  event: CharacterStateEvent | null;
  /** 對應身體動畫提示；CUSTOM／系統槽對應由呼叫端決定。 */
  animationHint: 'IDLE' | 'TALK' | null;
}

const STATE_PRIORITY: Readonly<Record<CharacterState, number>> = {
  idle: 10,
  listening: 20,
  working: 30,
  reviewing: 40,
  speaking: 50,
  success: 60,
  failed: 70,
};

/** user 指定永遠勝過其他來源的同態／較低態。 */
const USER_PRIORITY_BONUS = 1000;

const DEFAULT_TTL_MS: Readonly<Record<CharacterState, number>> = {
  idle: 0,
  listening: 30_000,
  speaking: 8_000,
  working: 120_000,
  reviewing: 120_000,
  success: 4_000,
  failed: 5_000,
};

export function defaultTtlForState(state: CharacterState): number {
  return DEFAULT_TTL_MS[state];
}

export function isCharacterState(value: unknown): value is CharacterState {
  return (
    value === 'idle' ||
    value === 'listening' ||
    value === 'speaking' ||
    value === 'working' ||
    value === 'reviewing' ||
    value === 'success' ||
    value === 'failed'
  );
}

export function animationHintForState(
  state: CharacterState,
): 'IDLE' | 'TALK' | null {
  if (state === 'speaking') return 'TALK';
  if (state === 'idle' || state === 'listening') return 'IDLE';
  // working／reviewing／success／failed：由系統動作槽或 fallback Idle 決定
  return null;
}

function effectivePriority(event: CharacterStateEvent): number {
  const base = STATE_PRIORITY[event.state];
  return event.sourceKind === 'user' ? base + USER_PRIORITY_BONUS : base;
}

function isExpired(event: CharacterStateEvent, nowMs: number): boolean {
  const ttl =
    event.ttlMs != null && Number.isFinite(event.ttlMs)
      ? Math.max(0, event.ttlMs)
      : defaultTtlForState(event.state);
  if (ttl <= 0) return false;
  return nowMs - event.atMs >= ttl;
}

/**
 * 從活躍事件中選出目前應呈現的狀態。
 * - 優先序見 CHARACTER_BEHAVIOR.md
 * - 同優先以較新 atMs 勝出
 * - 已過期事件忽略
 */
export function resolveCharacterState(
  events: readonly CharacterStateEvent[],
  nowMs: number,
): ResolvedCharacterState {
  let best: CharacterStateEvent | null = null;
  for (const event of events) {
    if (!isCharacterState(event.state)) continue;
    if (isExpired(event, nowMs)) continue;
    if (!best) {
      best = event;
      continue;
    }
    const bestPri = effectivePriority(best);
    const nextPri = effectivePriority(event);
    if (nextPri > bestPri) {
      best = event;
      continue;
    }
    if (nextPri === bestPri && event.atMs >= best.atMs) {
      best = event;
    }
  }

  if (!best) {
    return { state: 'idle', event: null, animationHint: 'IDLE' };
  }
  return {
    state: best.state,
    event: best,
    animationHint: animationHintForState(best.state),
  };
}

/** 清除指定來源的全部事件（例如 MCP session 斷線）。 */
export function clearEventsForSource(
  events: readonly CharacterStateEvent[],
  sourceId: string,
): CharacterStateEvent[] {
  return events.filter((event) => event.sourceId !== sourceId);
}

/** 移除已過期事件。 */
export function pruneExpiredEvents(
  events: readonly CharacterStateEvent[],
  nowMs: number,
): CharacterStateEvent[] {
  return events.filter((event) => !isExpired(event, nowMs));
}

/**
 * 將語音活動轉成狀態事件輸入。
 * listening 仍映射為 listening（身體可回 Idle）；speaking 映射 speaking。
 */
export function voiceActivityToStateEvent(
  voice: Pick<VoiceState, 'activity' | 'outputMuted' | 'phase'>,
  nowMs: number,
  id = 'voice',
): CharacterStateEvent {
  if (voice.phase !== 'active' || voice.outputMuted) {
    return {
      id,
      state: 'idle',
      sourceKind: 'voice',
      sourceId: 'voice',
      atMs: nowMs,
      ttlMs: 0,
    };
  }
  if (voice.activity === 'speaking') {
    return {
      id,
      state: 'speaking',
      sourceKind: 'voice',
      sourceId: 'voice',
      atMs: nowMs,
      ttlMs: DEFAULT_TTL_MS.speaking,
    };
  }
  if (voice.activity === 'listening') {
    return {
      id,
      state: 'listening',
      sourceKind: 'voice',
      sourceId: 'voice',
      atMs: nowMs,
      ttlMs: DEFAULT_TTL_MS.listening,
    };
  }
  return {
    id,
    state: 'idle',
    sourceKind: 'voice',
    sourceId: 'voice',
    atMs: nowMs,
    ttlMs: 0,
  };
}

export interface ExternalStateEventInput {
  state?: unknown;
  sourceKind?: unknown;
  sourceId?: unknown;
  ttlMs?: unknown;
  id?: unknown;
  atMs?: unknown;
}

export type NormalizeStateEventResult =
  | { ok: true; event: CharacterStateEvent }
  | { ok: false; error: string };

const EXTERNAL_SOURCE_KINDS = new Set<CharacterStateSourceKind>([
  'user',
  'system',
  'mcp',
  'integration',
]);

const MAX_SOURCE_ID_LENGTH = 64;
const MAX_TTL_MS = 600_000;

/**
 * 正規化外部（MCP／integration）狀態事件輸入。
 * 拒絕未知狀態、過長 sourceId、非有限 TTL；不推測語意。
 */
export function normalizeExternalStateEvent(
  input: ExternalStateEventInput,
  nowMs: number,
): NormalizeStateEventResult {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'invalid_payload' };
  }
  if (!isCharacterState(input.state)) {
    return { ok: false, error: 'invalid_state' };
  }
  if (
    typeof input.sourceKind !== 'string' ||
    !EXTERNAL_SOURCE_KINDS.has(input.sourceKind as CharacterStateSourceKind)
  ) {
    return { ok: false, error: 'invalid_source_kind' };
  }
  const sourceKind = input.sourceKind as CharacterStateSourceKind;
  let sourceId: string | undefined;
  if (input.sourceId != null) {
    if (typeof input.sourceId !== 'string' || !input.sourceId.trim()) {
      return { ok: false, error: 'invalid_source_id' };
    }
    sourceId = input.sourceId.trim().slice(0, MAX_SOURCE_ID_LENGTH);
  }
  let ttlMs: number | undefined;
  if (input.ttlMs != null) {
    const raw = Number(input.ttlMs);
    if (!Number.isFinite(raw) || raw < 0) {
      return { ok: false, error: 'invalid_ttl' };
    }
    ttlMs = Math.min(MAX_TTL_MS, Math.round(raw));
  }
  const id =
    typeof input.id === 'string' && input.id.trim()
      ? input.id.trim().slice(0, 64)
      : `${sourceKind}-${nowMs}`;
  const atMs =
    typeof input.atMs === 'number' && Number.isFinite(input.atMs)
      ? Math.round(input.atMs)
      : nowMs;

  return {
    ok: true,
    event: {
      id,
      state: input.state,
      sourceKind,
      sourceId,
      atMs,
      ttlMs,
    },
  };
}

/**
 * 以仲裁結果產生與既有 immediateVoiceAnimation 相容的提示。
 * listening → null（延遲回 Idle 由 App 計時器處理）；其餘對應 IDLE／TALK。
 */
export function immediateAnimationFromResolved(
  resolved: ResolvedCharacterState,
): 'IDLE' | 'TALK' | null {
  if (resolved.state === 'listening') return null;
  if (resolved.animationHint === 'TALK') return 'TALK';
  if (resolved.animationHint === 'IDLE') return 'IDLE';
  return 'IDLE';
}
