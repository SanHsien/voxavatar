import { describe, expect, it } from 'vitest';
import {
  createMotionBag,
  drawNextMotion,
  type MotionBagState,
} from './motion-shuffle-bag';

/** 依序回傳固定值的假亂數；用盡後停在最後一個值。 */
function scriptedRandom(values: readonly number[]): () => number {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)] ?? 0;
}

function drawMany(
  pool: readonly string[],
  count: number,
  random?: () => number,
): string[] {
  let state: MotionBagState | null = createMotionBag();
  const drawn: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const result = drawNextMotion(state, pool, random);
    state = result.state;
    if (result.url != null) drawn.push(result.url);
  }
  return drawn;
}

describe('motion shuffle bag', () => {
  it('plays every clip exactly once per round', () => {
    const pool = Array.from({ length: 45 }, (_, index) => `idle${index + 1}`);
    const round = drawMany(pool, pool.length);
    expect(round).toHaveLength(pool.length);
    expect(new Set(round).size).toBe(pool.length);
  });

  it('starts a new round after the previous one is used up', () => {
    const pool = ['a', 'b', 'c', 'd'];
    const drawn = drawMany(pool, pool.length * 3);
    expect(drawn).toHaveLength(12);
    for (let start = 0; start < 12; start += 4) {
      expect(new Set(drawn.slice(start, start + 4)).size).toBe(4);
    }
  });

  // 重洗後第一支若等於上一輪最後一支，會出現肉眼可見的連播同一支。
  it('never repeats across a round seam', () => {
    const pool = ['a', 'b', 'c', 'd', 'e'];
    for (let seed = 0; seed < 200; seed += 1) {
      const drawn = drawMany(pool, pool.length * 4);
      for (let index = 1; index < drawn.length; index += 1) {
        expect(drawn[index], `seed ${seed} index ${index}`).not.toBe(
          drawn[index - 1],
        );
      }
    }
  });

  it('rebuilds the round when the pool changes', () => {
    const first = drawNextMotion(createMotionBag(), ['a', 'b', 'c']);
    expect(first.state.queue).toHaveLength(2);
    const afterChange = drawNextMotion(first.state, ['x', 'y']);
    expect(afterChange.url).not.toBeNull();
    expect(['x', 'y']).toContain(afterChange.url);
    expect(afterChange.state.pool).toEqual(['x', 'y']);
    expect(afterChange.state.queue).toHaveLength(1);
  });

  it('keeps returning the only clip in a single-clip pool', () => {
    const drawn = drawMany(['only.vrma'], 3);
    expect(drawn).toEqual(['only.vrma', 'only.vrma', 'only.vrma']);
  });

  it('returns null and resets for an empty pool', () => {
    const result = drawNextMotion(createMotionBag(), []);
    expect(result.url).toBeNull();
    expect(result.state.queue).toHaveLength(0);
    expect(result.state.pool).toHaveLength(0);
  });

  it('is deterministic for a given random sequence', () => {
    const pool = ['a', 'b', 'c'];
    const scripted = () => scriptedRandom([0, 0, 0, 0, 0, 0, 0, 0]);
    expect(drawMany(pool, 3, scripted())).toEqual(
      drawMany(pool, 3, scripted()),
    );
  });

  it('tolerates an out-of-range random source', () => {
    const pool = ['a', 'b', 'c'];
    const drawn = drawMany(pool, 6, scriptedRandom([-1, 5, Number.NaN]));
    expect(drawn).toHaveLength(6);
    expect(new Set(drawn.slice(0, 3)).size).toBe(3);
  });
});
