"use strict";

/**
 * 遞迴掃描目錄，收集 .vrm／.vrma。
 * 略過隱藏目錄、常見垃圾目錄與過深路徑。
 */

const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_MAX_DEPTH = 12;
const DEFAULT_MAX_FILES = 2000;
const SKIP_DIR_NAMES = new Set([
  ".git",
  ".svn",
  ".hg",
  "node_modules",
  "__macosx",
  ".trash",
  "$recycle.bin",
  "system volume information",
]);

function shouldSkipDir(name) {
  const lower = name.toLowerCase();
  if (SKIP_DIR_NAMES.has(lower)) return true;
  if (lower.startsWith(".")) return true;
  return false;
}

function collectAssetFiles(rootDir, options = {}) {
  const extensions = new Set(
    (options.extensions ?? [".vrm", ".vrma"]).map((ext) =>
      ext.toLowerCase().startsWith(".") ? ext.toLowerCase() : `.${ext.toLowerCase()}`,
    ),
  );
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
  const maxFiles = options.maxFiles ?? DEFAULT_MAX_FILES;
  const absoluteRoot = path.resolve(rootDir);

  if (!fs.existsSync(absoluteRoot)) {
    throw new Error(`目錄不存在：${absoluteRoot}`);
  }
  const rootStat = fs.statSync(absoluteRoot);
  if (!rootStat.isDirectory()) {
    throw new Error(`路徑不是目錄：${absoluteRoot}`);
  }

  const files = [];
  const skippedDirs = [];
  let truncated = false;

  function walk(currentDir, depth) {
    if (truncated || files.length >= maxFiles) {
      truncated = true;
      return;
    }
    if (depth > maxDepth) {
      skippedDirs.push(currentDir);
      return;
    }

    let entries;
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      skippedDirs.push(currentDir);
      return;
    }

    entries.sort((a, b) => a.name.localeCompare(b.name, "en"));
    for (const entry of entries) {
      if (truncated || files.length >= maxFiles) {
        truncated = true;
        break;
      }
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (shouldSkipDir(entry.name)) {
          skippedDirs.push(fullPath);
          continue;
        }
        walk(fullPath, depth + 1);
        continue;
      }
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (!extensions.has(ext)) continue;
      files.push(fullPath);
    }
  }

  walk(absoluteRoot, 0);
  files.sort((a, b) => a.localeCompare(b, "en"));

  return {
    rootDir: absoluteRoot,
    files,
    skippedDirs,
    truncated,
    maxFiles,
    maxDepth,
  };
}

module.exports = {
  DEFAULT_MAX_DEPTH,
  DEFAULT_MAX_FILES,
  SKIP_DIR_NAMES,
  collectAssetFiles,
  shouldSkipDir,
};
