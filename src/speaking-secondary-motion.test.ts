import { describe, expect, it } from 'vitest';
import {
  SPEAKING_SECONDARY_LIMITS,
  createSpeakingSecondaryMotionState,
  isSpeakingSecondaryNearlyIdle,
  stepSpeakingSecondaryMotion,
  zeroSpeakingSecondaryOffsets,
} from './speaking-secondary-motion';

describe('speaking-secondary-motion', () => {
  it('keeps zero offsets when not speaking', () => {
    let state = createSpeakingSecondaryMotionState();
    for (let i = 0; i < 20; i += 1) {
      state = stepSpeakingSecondaryMotion({
        speaking: false,
        level: 0.9,
        delta: 1 / 60,
        current: state,
      });
    }
    expect(isSpeakingSecondaryNearlyIdle(state.offsets)).toBe(true);
  });

  it('produces bounded nonzero motion while speaking with audio', () => {
    let state = createSpeakingSecondaryMotionState();
    let sawMotion = false;
    for (let i = 0; i < 90; i += 1) {
      state = stepSpeakingSecondaryMotion({
        speaking: true,
        level: 0.55,
        delta: 1 / 60,
        current: state,
      });
      const { offsets } = state;
      expect(Math.abs(offsets.headPitch)).toBeLessThanOrEqual(
        SPEAKING_SECONDARY_LIMITS.headPitch + 1e-6,
      );
      expect(Math.abs(offsets.headYaw)).toBeLessThanOrEqual(
        SPEAKING_SECONDARY_LIMITS.headYaw + 1e-6,
      );
      expect(Math.abs(offsets.headRoll)).toBeLessThanOrEqual(
        SPEAKING_SECONDARY_LIMITS.headRoll + 1e-6,
      );
      expect(Math.abs(offsets.chestPitch)).toBeLessThanOrEqual(
        SPEAKING_SECONDARY_LIMITS.chestPitch + 1e-6,
      );
      if (!isSpeakingSecondaryNearlyIdle(offsets, 1e-5)) sawMotion = true;
    }
    expect(sawMotion).toBe(true);
  });

  it('releases toward zero after speaking ends', () => {
    let state = createSpeakingSecondaryMotionState();
    for (let i = 0; i < 40; i += 1) {
      state = stepSpeakingSecondaryMotion({
        speaking: true,
        level: 0.7,
        delta: 1 / 60,
        current: state,
      });
    }
    expect(isSpeakingSecondaryNearlyIdle(state.offsets)).toBe(false);
    for (let i = 0; i < 120; i += 1) {
      state = stepSpeakingSecondaryMotion({
        speaking: false,
        level: 0,
        delta: 1 / 60,
        current: state,
      });
    }
    expect(isSpeakingSecondaryNearlyIdle(state.offsets, 5e-4)).toBe(true);
  });

  it('ignores sub-threshold audio while speaking', () => {
    let state = createSpeakingSecondaryMotionState();
    for (let i = 0; i < 30; i += 1) {
      state = stepSpeakingSecondaryMotion({
        speaking: true,
        level: 0.001,
        delta: 1 / 60,
        current: state,
      });
    }
    expect(state.offsets).toEqual(zeroSpeakingSecondaryOffsets());
  });
});
