"use strict";

/**
 * VRMA 磁碟檔名政策：
 * - catalog／URL 資產 ID 永遠是 UUID（voxavatar-asset 安全鍵）
 * - 磁碟檔名可為可讀 `{clip_name}--{id8}.vrma`，並與顯示名同步
 * - 舊版 `{uuid}.vrma` 仍合法
 */

const {
  ANIMATION_NAME_PATTERN,
} = require("./library-catalog.cjs");
const {
  ANIMATION_PURPOSE,
  normalizeAnimationPurpose,
} = require("./vrma-quality.cjs");

const ASSET_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function shortAssetId(id) {
  return String(id ?? "")
    .replace(/-/g, "")
    .slice(0, 8)
    .toLowerCase();
}

function buildReadableStoredFilename(id, clipName, extension = ".vrma") {
  const name = String(clipName ?? "")
    .trim()
    .toLowerCase();
  if (!ANIMATION_NAME_PATTERN.test(name)) {
    throw new Error("Invalid clip name for stored filename.");
  }
  if (!ASSET_ID_PATTERN.test(id)) {
    throw new Error("Invalid clip id for stored filename.");
  }
  return `${name}--${shortAssetId(id)}${extension}`;
}

function validStoredVrmaFilename(id, storedFilename) {
  if (typeof storedFilename !== "string") return false;
  if (/[/\\]/.test(storedFilename) || storedFilename.includes("..")) {
    return false;
  }
  if (storedFilename === `${id}.vrma`) return true;
  const short = shortAssetId(id);
  if (!/^[0-9a-f]{8}$/.test(short)) return false;
  return new RegExp(`^[a-z][a-z0-9-]*--${short}\\.vrma$`, "i").test(
    storedFilename,
  );
}

function sanitizeSourceBasename(value) {
  if (typeof value !== "string") return null;
  const base = value.trim();
  if (!base || base.length > 120) return null;
  if (/[/\\]/.test(base) || base === "." || base === "..") return null;
  return base;
}

function sanitizeClipRecord(clip, fallbackPurpose = ANIMATION_PURPOSE.LOOP) {
  if (!clip || typeof clip !== "object") return null;
  if (!ASSET_ID_PATTERN.test(clip.id)) return null;
  if (!validStoredVrmaFilename(clip.id, clip.stored_filename)) return null;
  try {
    const clip_name = String(clip.clip_name ?? "")
      .trim()
      .toLowerCase();
    if (!ANIMATION_NAME_PATTERN.test(clip_name)) return null;
    const source_basename = sanitizeSourceBasename(clip.source_basename);
    return {
      id: clip.id,
      stored_filename: clip.stored_filename,
      clip_name,
      purpose: normalizeAnimationPurpose(clip.purpose ?? fallbackPurpose),
      ...(source_basename ? { source_basename } : {}),
    };
  } catch {
    return null;
  }
}

function syncSourceBasename(clipName) {
  return `${clipName}.vrma`;
}

module.exports = {
  ASSET_ID_PATTERN,
  buildReadableStoredFilename,
  sanitizeClipRecord,
  sanitizeSourceBasename,
  shortAssetId,
  syncSourceBasename,
  validStoredVrmaFilename,
};
