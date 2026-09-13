"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { createAnimationCommandQueue } = require("./animation-command-queue.cjs");

test("coalesces same animation name and drops oldest when over capacity", () => {
  const played = [];
  let now = 1_000;
  const timers = [];
  const queue = createAnimationCommandQueue({
    play: (name) => played.push(name),
    maxPending: 2,
    minIntervalMs: 0,
    now: () => now,
    schedule: (fn) => {
      timers.push(fn);
      return timers.length;
    },
    clearSchedule: () => {},
  });

  queue.enqueue("wave");
  queue.enqueue("dance");
  queue.enqueue("wave");
  queue.enqueue("happy");
  assert.equal(queue.size(), 2);

  while (timers.length) timers.shift()();
  assert.deepEqual(played, ["wave", "happy"]);
  assert.equal(queue.size(), 0);
});

test("respects minimum interval between plays", () => {
  const played = [];
  let now = 0;
  const timers = [];
  const queue = createAnimationCommandQueue({
    play: (name) => played.push(name),
    maxPending: 4,
    minIntervalMs: 100,
    now: () => now,
    schedule: (fn, ms) => {
      timers.push({ fn, ms });
      return timers.length;
    },
    clearSchedule: () => {},
  });

  queue.enqueue("a");
  assert.equal(timers[0].ms, 100);
  now = 100;
  timers.shift().fn();
  assert.deepEqual(played, ["a"]);

  queue.enqueue("b");
  assert.equal(timers[0].ms, 100);
  now = 200;
  timers.shift().fn();
  assert.deepEqual(played, ["a", "b"]);
});
