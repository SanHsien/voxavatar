"use strict";

/**
 * 高頻 MCP／protocol／HTTP 動作指令的有界佇列。
 * 同名指令會合併；超過容量時丟棄最舊項目；以最小間隔送出。
 */

function createAnimationCommandQueue({
  play,
  maxPending = 3,
  minIntervalMs = 120,
  now = () => Date.now(),
  schedule = (fn, ms) => {
    const timer = setTimeout(fn, ms);
    timer.unref?.();
    return timer;
  },
  clearSchedule = (timer) => clearTimeout(timer),
} = {}) {
  if (typeof play !== "function") {
    throw new Error("play callback is required.");
  }
  const pending = [];
  let flushTimer = null;
  let lastPlayedAt = 0;

  function size() {
    return pending.length;
  }

  function enqueue(animationName) {
    const name = String(animationName ?? "").trim();
    if (!name) return false;
    const existing = pending.indexOf(name);
    if (existing >= 0) pending.splice(existing, 1);
    pending.push(name);
    while (pending.length > maxPending) pending.shift();
    scheduleFlush();
    return true;
  }

  function scheduleFlush() {
    if (flushTimer != null || pending.length === 0) return;
    const wait = Math.max(0, minIntervalMs - (now() - lastPlayedAt));
    flushTimer = schedule(() => {
      flushTimer = null;
      const next = pending.shift();
      if (!next) return;
      lastPlayedAt = now();
      play(next);
      if (pending.length > 0) scheduleFlush();
    }, wait);
  }

  function clear() {
    pending.length = 0;
    if (flushTimer != null) {
      clearSchedule(flushTimer);
      flushTimer = null;
    }
  }

  return { enqueue, size, clear };
}

module.exports = {
  createAnimationCommandQueue,
};
