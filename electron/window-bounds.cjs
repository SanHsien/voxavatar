"use strict";

// 頭像視窗是無邊框的，只能在角色上拖曳來移動，而 `voxavatar:move-window` 直接把
// 收到的座標交給 setPosition，沒有任何夾限。一次拖到所有螢幕之外，畫面上就沒有東西
// 可以再瞄準——本 fork 又不持久化視窗位置，所以唯一的救回方式是重開程式。
// 夾住目的地讓它至少留一條邊在工作區內。
//
// 移植自上游 `electron/window-bounds.cts`（PR #64）。演算法照採，改寫成 CommonJS：
// 本 fork 明確不採用上游的 TypeScript／`.cts` 遷移（見 docs/DECISIONS.md）。

/**
 * 留在工作區內的最小寬度。這不保證拖得回來：在剪影穿透模式下，倖存的那一條可能是
 * 透明像素、按下去會穿透過去——那種情況要靠系統匣。
 */
const MIN_VISIBLE_EDGE = 64;

function overlap(start, length, otherStart, otherLength) {
  return (
    Math.min(start + length, otherStart + otherLength) -
    Math.max(start, otherStart)
  );
}

function centreDistance(bounds, area) {
  const dx = bounds.x + bounds.width / 2 - (area.x + area.width / 2);
  const dy = bounds.y + bounds.height / 2 - (area.y + area.height / 2);
  return dx * dx + dy * dy;
}

function clamp(value, low, high) {
  return Math.min(high, Math.max(low, value));
}

/**
 * 每個工作區都納入判斷，不是只看主螢幕——住在第二台螢幕上的視窗要用它所在的那台來衡量。
 *
 * @param {{x:number,y:number,width:number,height:number}} bounds 想要移到的位置與視窗尺寸
 * @param {ReadonlyArray<{x:number,y:number,width:number,height:number}>} workAreas
 * @param {number} [keep] 至少要留在工作區內的邊長
 * @returns {{x:number,y:number}}
 */
function clampWindowPosition(bounds, workAreas, keep = MIN_VISIBLE_EDGE) {
  const requested = { x: Math.round(bounds.x), y: Math.round(bounds.y) };
  if (!workAreas || workAreas.length === 0) return requested;

  // 比邊界還小的視窗，不可能整條邊都重疊。
  const keepX = Math.min(keep, bounds.width);
  const keepY = Math.min(keep, bounds.height);

  const reachable = workAreas.some(
    (area) =>
      overlap(bounds.x, bounds.width, area.x, area.width) >= keepX &&
      overlap(bounds.y, bounds.height, area.y, area.height) >= keepY,
  );
  if (reachable) return requested;

  const area = workAreas.reduce((nearest, candidate) =>
    centreDistance(bounds, candidate) < centreDistance(bounds, nearest)
      ? candidate
      : nearest,
  );
  return {
    x: Math.round(
      clamp(bounds.x, area.x - (bounds.width - keepX), area.x + area.width - keepX),
    ),
    y: Math.round(
      clamp(bounds.y, area.y - (bounds.height - keepY), area.y + area.height - keepY),
    ),
  };
}

module.exports = { MIN_VISIBLE_EDGE, clampWindowPosition };
