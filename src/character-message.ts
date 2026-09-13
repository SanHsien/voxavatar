/**
 * 漫畫式對話氣泡輸入清理與有界佇列（純邏輯）。
 * 契約見 docs/CHARACTER_BEHAVIOR.md；不解析 HTML／Markdown，不保存歷史。
 */

export type MessageMood = 'neutral' | 'cheerful' | 'thinking' | 'warning';

export interface CharacterMessageInput {
  text: string;
  durationMs?: number;
  mood?: string;
  sourceId?: string;
  atMs?: number;
}

export interface CharacterMessage {
  id: string;
  text: string;
  durationMs: number;
  mood: MessageMood;
  sourceId: string | null;
  atMs: number;
}

export type MessageNormalizeResult =
  | { ok: true; message: Omit<CharacterMessage, 'id' | 'atMs'> & { atMs?: number } }
  | { ok: false; reason: string };

export const MESSAGE_MAX_GRAPHEMES = 80;
export const MESSAGE_MIN_DURATION_MS = 1000;
export const MESSAGE_MAX_DURATION_MS = 15_000;
export const MESSAGE_DEFAULT_DURATION_MS = 4000;
export const MESSAGE_QUEUE_CAPACITY = 4;

const CONTROL_CHARS = new RegExp(
  `[${String.fromCharCode(0)}-${String.fromCharCode(8)}${String.fromCharCode(11)}${String.fromCharCode(12)}${String.fromCharCode(14)}-${String.fromCharCode(31)}${String.fromCharCode(127)}]`,
  'g',
);

function isMood(value: unknown): value is MessageMood {
  return (
    value === 'neutral' ||
    value === 'cheerful' ||
    value === 'thinking' ||
    value === 'warning'
  );
}

/** 以 Unicode grapheme 計數（有 Segmenter 時）；否則退回 code point。 */
export function countGraphemes(text: string): number {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: 'grapheme',
    });
    return [...segmenter.segment(text)].length;
  }
  return [...text].length;
}

export function normalizeCharacterMessage(
  input: CharacterMessageInput,
): MessageNormalizeResult {
  if (typeof input.text !== 'string') {
    return { ok: false, reason: 'text_required' };
  }
  const cleaned = input.text.replace(CONTROL_CHARS, '').normalize('NFC').trim();
  if (!cleaned) {
    return { ok: false, reason: 'empty_text' };
  }
  if (countGraphemes(cleaned) > MESSAGE_MAX_GRAPHEMES) {
    return { ok: false, reason: 'too_long' };
  }

  let durationMs = MESSAGE_DEFAULT_DURATION_MS;
  if (input.durationMs != null) {
    const raw = Number(input.durationMs);
    if (!Number.isFinite(raw)) {
      return { ok: false, reason: 'invalid_duration' };
    }
    durationMs = Math.round(
      Math.max(MESSAGE_MIN_DURATION_MS, Math.min(MESSAGE_MAX_DURATION_MS, raw)),
    );
  }

  const mood = isMood(input.mood) ? input.mood : 'neutral';
  const sourceId =
    typeof input.sourceId === 'string' && input.sourceId.trim()
      ? input.sourceId.trim()
      : null;

  return {
    ok: true,
    message: {
      text: cleaned,
      durationMs,
      mood,
      sourceId,
      atMs: input.atMs,
    },
  };
}

/**
 * 有界訊息佇列：同時只顯示一則；新訊息可合併重複或擠掉最舊待播。
 */
export function enqueueCharacterMessage(
  queue: readonly CharacterMessage[],
  next: CharacterMessage,
  capacity = MESSAGE_QUEUE_CAPACITY,
): CharacterMessage[] {
  const limit = Math.max(1, capacity);
  if (queue.length > 0) {
    const last = queue[queue.length - 1];
    if (last && last.text === next.text && last.mood === next.mood) {
      const merged = [...queue];
      merged[merged.length - 1] = {
        ...last,
        durationMs: Math.max(last.durationMs, next.durationMs),
        atMs: next.atMs,
        sourceId: next.sourceId ?? last.sourceId,
      };
      return merged;
    }
  }
  const updated = [...queue, next];
  if (updated.length <= limit) return updated;
  return updated.slice(updated.length - limit);
}

export function clearMessagesForSource(
  queue: readonly CharacterMessage[],
  sourceId: string,
): CharacterMessage[] {
  return queue.filter((message) => message.sourceId !== sourceId);
}

export function isMessageVisible(
  message: CharacterMessage,
  nowMs: number,
): boolean {
  return nowMs - message.atMs < message.durationMs;
}
