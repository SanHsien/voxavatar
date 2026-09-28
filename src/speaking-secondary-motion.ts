/**
 * Speaking 第二層低幅度頭部／上身反應（純邏輯）。
 * 依音量與 speaking 旗標產生可疊加於 VRMA 的歐拉偏移（弧度）；
 * 不推測情緒或內容，幅度刻意壓低以便小尺寸可讀。
 */

export interface SpeakingSecondaryOffsets {
  /** 點頭（負＝微前傾）。 */
  headPitch: number;
  headYaw: number;
  headRoll: number;
  /** 上身微幅前後。 */
  chestPitch: number;
}

export interface SpeakingSecondaryMotionState {
  offsets: SpeakingSecondaryOffsets;
  /** 內部振盪相位（秒累積）。 */
  phase: number;
}

export interface SpeakingSecondaryMotionStepInput {
  speaking: boolean;
  /** 正規化音量 0–1。 */
  level: number;
  delta: number;
  current: SpeakingSecondaryMotionState;
}

/** 約 3.4°／2.9°／2.0°／1.4°——刻意低於一般 VRMA 頭部擺幅。 */
export const SPEAKING_SECONDARY_LIMITS = Object.freeze({
  headPitch: 0.06,
  headYaw: 0.05,
  headRoll: 0.035,
  chestPitch: 0.025,
});

const AUDIBLE_LEVEL = 0.008;
const ATTACK_TAU = 0.09;
const RELEASE_TAU = 0.18;

export function zeroSpeakingSecondaryOffsets(): SpeakingSecondaryOffsets {
  return {
    headPitch: 0,
    headYaw: 0,
    headRoll: 0,
    chestPitch: 0,
  };
}

export function createSpeakingSecondaryMotionState(): SpeakingSecondaryMotionState {
  return {
    offsets: zeroSpeakingSecondaryOffsets(),
    phase: 0,
  };
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function smoothToward(
  current: number,
  target: number,
  delta: number,
  tau: number,
): number {
  const t = 1 - Math.exp(-Math.max(0, delta) / Math.max(1e-4, tau));
  return current + (target - current) * t;
}

/**
 * 依 speaking／level 計算下一幀目標偏移並平滑逼近。
 * `speaking=false` 或音量過低時目標歸零（release）。
 */
export function stepSpeakingSecondaryMotion(
  input: SpeakingSecondaryMotionStepInput,
): SpeakingSecondaryMotionState {
  const delta =
    Number.isFinite(input.delta) && input.delta > 0 ? input.delta : 0;
  const level = clamp01(input.level);
  const audible = input.speaking && level > AUDIBLE_LEVEL;
  const prev = input.current ?? createSpeakingSecondaryMotionState();
  const phase = prev.phase + delta * (2.4 + level * 3.2);

  let target = zeroSpeakingSecondaryOffsets();
  if (audible) {
    const amp = 0.35 + level * 0.65;
    target = {
      headPitch:
        -SPEAKING_SECONDARY_LIMITS.headPitch *
        amp *
        (0.55 + 0.45 * Math.sin(phase * 1.7)),
      headYaw:
        SPEAKING_SECONDARY_LIMITS.headYaw *
        amp *
        Math.sin(phase * 1.15 + 0.4),
      headRoll:
        SPEAKING_SECONDARY_LIMITS.headRoll *
        amp *
        Math.sin(phase * 0.9 + 1.1) *
        0.85,
      chestPitch:
        -SPEAKING_SECONDARY_LIMITS.chestPitch *
        amp *
        (0.4 + 0.6 * Math.sin(phase * 1.35 + 0.2)),
    };
  }

  const tau = audible ? ATTACK_TAU : RELEASE_TAU;
  const cur = prev.offsets;
  return {
    phase,
    offsets: {
      headPitch: smoothToward(cur.headPitch, target.headPitch, delta, tau),
      headYaw: smoothToward(cur.headYaw, target.headYaw, delta, tau),
      headRoll: smoothToward(cur.headRoll, target.headRoll, delta, tau),
      chestPitch: smoothToward(cur.chestPitch, target.chestPitch, delta, tau),
    },
  };
}

/** 偏移是否可視為靜止（測試與提早跳過套用）。 */
export function isSpeakingSecondaryNearlyIdle(
  offsets: SpeakingSecondaryOffsets,
  epsilon = 1e-4,
): boolean {
  return (
    Math.abs(offsets.headPitch) < epsilon &&
    Math.abs(offsets.headYaw) < epsilon &&
    Math.abs(offsets.headRoll) < epsilon &&
    Math.abs(offsets.chestPitch) < epsilon
  );
}
