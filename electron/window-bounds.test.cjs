"use strict";

// 這個視窗無邊框、位置不持久化，`voxavatar:move-window` 原本直接把座標交給
// setPosition。拖到所有螢幕之外就沒有東西可以再瞄準，只能重開程式。每一條測試釘的
// 都是「拖不出去」的一種情況。

const assert = require("node:assert/strict");
const test = require("node:test");
const { MIN_VISIBLE_EDGE, clampWindowPosition } = require("./window-bounds.cjs");

const PRIMARY = { x: 0, y: 0, width: 1920, height: 1080 };
const SECOND = { x: 1920, y: 0, width: 1920, height: 1080 };
const WINDOW = { width: 400, height: 600 };

test("a position already on screen is returned unchanged", () => {
  const target = clampWindowPosition({ x: 100, y: 200, ...WINDOW }, [PRIMARY]);

  assert.deepEqual(target, { x: 100, y: 200 });
});

test("a window dragged past the right edge keeps a grabbable strip", () => {
  const target = clampWindowPosition({ x: 5000, y: 300, ...WINDOW }, [PRIMARY]);

  assert.equal(target.x, PRIMARY.width - MIN_VISIBLE_EDGE);
  assert.equal(target.y, 300);
});

test("a window dragged past the left edge keeps a grabbable strip", () => {
  const target = clampWindowPosition({ x: -5000, y: 300, ...WINDOW }, [PRIMARY]);

  assert.equal(target.x, -(WINDOW.width - MIN_VISIBLE_EDGE));
});

test("a window dragged below the desktop keeps a grabbable strip", () => {
  const target = clampWindowPosition({ x: 100, y: 9000, ...WINDOW }, [PRIMARY]);

  assert.equal(target.y, PRIMARY.height - MIN_VISIBLE_EDGE);
});

test("a window living on the second display is judged against that display", () => {
  // Off the right edge of the second monitor, not of the primary one: clamping
  // to the primary would teleport it across the desk.
  const target = clampWindowPosition({ x: 6000, y: 400, ...WINDOW }, [PRIMARY, SECOND]);

  assert.equal(target.x, SECOND.x + SECOND.width - MIN_VISIBLE_EDGE);
});

test("a window smaller than the margin is not asked to overlap by more than itself", () => {
  const tiny = { width: 30, height: 20 };
  const target = clampWindowPosition({ x: 5000, y: 5000, ...tiny }, [PRIMARY]);

  assert.equal(target.x, PRIMARY.width - tiny.width);
  assert.equal(target.y, PRIMARY.height - tiny.height);
});

test("no known work area means the request is honoured rather than dropped", () => {
  // Better to move where asked than to swallow the drag on a display topology
  // this cannot reason about.
  const target = clampWindowPosition({ x: 42, y: 43, ...WINDOW }, []);

  assert.deepEqual(target, { x: 42, y: 43 });
});

test("fractional coordinates are rounded, since setPosition takes integers", () => {
  const target = clampWindowPosition({ x: 10.4, y: 20.6, ...WINDOW }, [PRIMARY]);

  assert.deepEqual(target, { x: 10, y: 21 });
});
