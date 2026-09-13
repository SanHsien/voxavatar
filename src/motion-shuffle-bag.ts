/**
 * 動作輪播的洗牌袋（shuffle bag）。
 *
 * 純隨機每次從整池重抽只排除上一支，覆蓋率很差：45 支的池平均要抽約 300 次才會
 * 全部看過一輪，且同一支可能只隔一支就重播。洗牌袋改成「一輪內每支各播一次，
 * 播完重洗開下一輪」，覆蓋率固定為池大小，跨輪接縫也不會出現連續重複。
 */

export interface MotionBagState {
  /** 產生這一輪時的池快照，用來偵測池變動後重建輪次。 */
  readonly pool: readonly string[];
  /** 本輪尚未播放的片段，依序取用。 */
  readonly queue: readonly string[];
  /** 上一支播出的片段；重洗時用來避免跨輪接縫重複。 */
  readonly last: string | null;
}

export interface MotionBagDraw {
  readonly state: MotionBagState;
  readonly url: string | null;
}

const EMPTY_BAG: MotionBagState = { pool: [], queue: [], last: null };

export function createMotionBag(): MotionBagState {
  return EMPTY_BAG;
}

function samePool(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) return false;
  }
  return true;
}

/**
 * 把亂數來源收斂到 [0, 1)。`Math.max(0, NaN)` 仍是 NaN，直接拿去算索引會寫入
 * `undefined`，所以非有限值與超界值都要在這裡擋掉。
 */
function unitRandom(random: () => number): number {
  const value = random();
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (value >= 1) return 1 - Number.EPSILON;
  return value;
}

/** Fisher–Yates；`random` 可注入以便測試。 */
function shuffle(
  pool: readonly string[],
  random: () => number,
): string[] {
  const next = [...pool];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapWith = Math.min(
      index,
      Math.floor(unitRandom(random) * (index + 1)),
    );
    const held = next[index]!;
    next[index] = next[swapWith]!;
    next[swapWith] = held;
  }
  return next;
}

/**
 * 重洗一輪。池超過一支時，避免新一輪第一支等於上一輪最後一支。
 */
function reshuffle(
  pool: readonly string[],
  last: string | null,
  random: () => number,
): string[] {
  const queue = shuffle(pool, random);
  if (queue.length > 1 && last != null && queue[0] === last) {
    const swapWith =
      1 +
      Math.min(
        queue.length - 2,
        Math.floor(unitRandom(random) * (queue.length - 1)),
      );
    const held = queue[0]!;
    queue[0] = queue[swapWith]!;
    queue[swapWith] = held;
  }
  return queue;
}

/**
 * 取下一支動作。輪次用盡、池變動或尚未建立時自動重洗開新一輪。
 * 空池回傳 `url: null` 並重設狀態。
 */
export function drawNextMotion(
  state: MotionBagState | null,
  pool: readonly string[],
  random: () => number = Math.random,
): MotionBagDraw {
  if (pool.length === 0) return { state: EMPTY_BAG, url: null };

  const poolChanged = state == null || !samePool(state.pool, pool);
  const exhausted = state == null || state.queue.length === 0;
  const last = state?.last ?? null;
  const queue =
    poolChanged || exhausted ? reshuffle(pool, last, random) : [...state.queue];

  const url = queue[0] ?? null;
  if (url == null) return { state: EMPTY_BAG, url: null };

  return {
    state: { pool: [...pool], queue: queue.slice(1), last: url },
    url,
  };
}
