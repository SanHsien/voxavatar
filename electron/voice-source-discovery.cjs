"use strict";

const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const { sourceFromProcess } = require("./voice-source.cjs");
const { listPlatformProcesses } = require("./process-discovery.cjs");

const execFileAsync = promisify(execFile);

function uniqueSortedSources(sources) {
  const byId = new Map();
  for (const source of sources) {
    if (!source || byId.has(source.id)) continue;
    byId.set(source.id, source);
  }
  return [...byId.values()]
    .sort(
      (left, right) =>
        left.name.localeCompare(right.name, undefined, {
          sensitivity: "base",
        }) ||
        left.detail.localeCompare(right.detail, undefined, {
          sensitivity: "base",
        }),
    )
    .slice(0, 500);
}

function processBelongsToVoxAvatar(process, byId, ownProcessId) {
  let current = process;
  const visited = new Set();
  for (let depth = 0; current && depth < 20; depth += 1) {
    if (current.pid === ownProcessId) return true;
    if (visited.has(current.pid)) break;
    visited.add(current.pid);
    current = byId.get(current.parentId);
  }
  return false;
}

function processSources(platform, processes, ownProcessId = process.pid) {
  const byId = new Map(processes.map((entry) => [entry.pid, entry]));
  return uniqueSortedSources(
    processes
      .filter(
        (entry) =>
          !processBelongsToVoxAvatar(entry, byId, ownProcessId),
      )
      .map((entry) => sourceFromProcess(platform, entry)),
  );
}

async function listVoiceSources({
  platform = process.platform,
  run = execFileAsync,
  ownProcessId = process.pid,
} = {}) {
  if (platform === "win32") {
    const processes = await listPlatformProcesses({ platform, run });
    return {
      platform,
      sources: processSources(platform, processes, ownProcessId),
    };
  }
  return { platform, sources: [] };
}

module.exports = {
  listVoiceSources,
  processSources,
  uniqueSortedSources,
};
