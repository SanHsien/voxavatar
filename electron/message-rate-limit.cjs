"use strict";

/**
 * MCP show_message 頻率限制：每 session 與全域滑動視窗。
 */

function createMessageRateLimiter({
  perSessionMax = 6,
  perSessionWindowMs = 10_000,
  globalMax = 24,
  globalWindowMs = 10_000,
  now = () => Date.now(),
} = {}) {
  const sessions = new Map();
  let globalHits = [];

  function prune(list, windowMs, at) {
    const cutoff = at - windowMs;
    while (list.length > 0 && list[0] <= cutoff) list.shift();
  }

  function allow(sourceId) {
    const at = now();
    prune(globalHits, globalWindowMs, at);
    if (globalHits.length >= globalMax) {
      return { ok: false, reason: "rate_limited" };
    }
    const key = typeof sourceId === "string" && sourceId ? sourceId : "anonymous";
    let hits = sessions.get(key);
    if (!hits) {
      hits = [];
      sessions.set(key, hits);
    }
    prune(hits, perSessionWindowMs, at);
    if (hits.length >= perSessionMax) {
      return { ok: false, reason: "rate_limited" };
    }
    hits.push(at);
    globalHits.push(at);
    return { ok: true };
  }

  function clearSource(sourceId) {
    if (typeof sourceId === "string" && sourceId) {
      sessions.delete(sourceId);
    }
  }

  function clearAll() {
    sessions.clear();
    globalHits = [];
  }

  return { allow, clearSource, clearAll };
}

module.exports = {
  createMessageRateLimiter,
};
