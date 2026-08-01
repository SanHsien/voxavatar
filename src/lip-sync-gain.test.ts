import { describe, expect, it } from 'vitest';
import { computeLipSyncOpen, headSizeGain } from './lip-sync-gain';

describe('lip-sync gain', () => {
  it('returns zero open for silence', () => {
    expect(computeLipSyncOpen({ level: 0, headHeightPx: 40 }).open).toBe(0);
  });

  it('boosts small heads and clamps gain', () => {
    expect(headSizeGain(40)).toBeGreaterThan(1);
    expect(headSizeGain(300)).toBe(1);
    const small = computeLipSyncOpen({
      level: 0.2,
      headHeightPx: 40,
      intensity: 1,
      minOpen: 0.05,
    });
    const large = computeLipSyncOpen({
      level: 0.2,
      headHeightPx: 300,
      intensity: 1,
      minOpen: 0.05,
    });
    expect(small.open).toBeGreaterThan(large.open);
    expect(small.gain).toBeLessThanOrEqual(1.35);
  });

  it('enforces minimum visible opening when speaking', () => {
    const result = computeLipSyncOpen({
      level: 0.01,
      headHeightPx: null,
      minOpen: 0.12,
    });
    expect(result.open).toBe(0.12);
  });
});
