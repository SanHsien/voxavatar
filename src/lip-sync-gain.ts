/**
 * 小尺寸口型增益（純邏輯）。
 * 音量驅動近似口型；依頭部螢幕像素高度調整可見開口。
 */

export interface LipSyncGainInput {
  /** 正規化音量 0–1（已平滑）。 */
  level: number;
  /** 頭部在螢幕上的近似高度（CSS px）；未知時傳 null。 */
  headHeightPx: number | null;
  /** 使用者強度倍率，預設 1。 */
  intensity?: number;
  /** 最小可見開口（0–1），預設 0.08。 */
  minOpen?: number;
  /** 增益上限，預設 1.35。 */
  maxGain?: number;
}

export interface LipSyncGainResult {
  open: number;
  gain: number;
}

const DEFAULT_INTENSITY = 1;
const DEFAULT_MIN_OPEN = 0.08;
const DEFAULT_MAX_GAIN = 1.35;
/** 頭部高度低於此像素時開始加強。 */
const SMALL_HEAD_PX = 96;
/** 頭部高度高於此像素時不再額外增益。 */
const LARGE_HEAD_PX = 220;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

/**
 * 依頭部投影尺寸計算增益：小角色加強、近距回到自然幅度。
 */
export function headSizeGain(headHeightPx: number | null): number {
  if (headHeightPx == null || !Number.isFinite(headHeightPx) || headHeightPx <= 0) {
    return 1;
  }
  if (headHeightPx >= LARGE_HEAD_PX) return 1;
  if (headHeightPx <= SMALL_HEAD_PX) {
    return 1 + (LARGE_HEAD_PX - SMALL_HEAD_PX) / LARGE_HEAD_PX;
  }
  const t = (LARGE_HEAD_PX - headHeightPx) / (LARGE_HEAD_PX - SMALL_HEAD_PX);
  return 1 + t * ((LARGE_HEAD_PX - SMALL_HEAD_PX) / LARGE_HEAD_PX);
}

export function computeLipSyncOpen(input: LipSyncGainInput): LipSyncGainResult {
  const level = clamp01(input.level);
  const intensity =
    input.intensity != null && Number.isFinite(input.intensity)
      ? Math.max(0, Math.min(2, input.intensity))
      : DEFAULT_INTENSITY;
  const minOpen =
    input.minOpen != null && Number.isFinite(input.minOpen)
      ? clamp01(input.minOpen)
      : DEFAULT_MIN_OPEN;
  const maxGain =
    input.maxGain != null && Number.isFinite(input.maxGain)
      ? Math.max(1, Math.min(2, input.maxGain))
      : DEFAULT_MAX_GAIN;

  const sizeGain = Math.min(maxGain, headSizeGain(input.headHeightPx));
  const gain = Math.min(maxGain, intensity * sizeGain);
  if (level <= 0) {
    return { open: 0, gain };
  }
  const open = clamp01(Math.max(minOpen, level * gain));
  return { open, gain };
}
