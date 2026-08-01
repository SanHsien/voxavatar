"use strict";

const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const {
  DEFAULT_VOICE_APP_PATTERN,
  configuredPattern,
  normalizeVoiceSource,
  processMatchesSource,
} = require("./voice-source.cjs");

const execFileAsync = promisify(execFile);

function parseWindowsProcessList(output) {
  const trimmed = output.trim();
  if (!trimmed) return [];
  const parsed = JSON.parse(trimmed);
  return (Array.isArray(parsed) ? parsed : [parsed])
    .map((entry) => ({
      pid: Number(entry.ProcessId),
      parentId: Number(entry.ParentProcessId),
      name: String(entry.Name ?? ""),
      executable: String(entry.ExecutablePath ?? entry.Name ?? ""),
      command: String(entry.CommandLine ?? ""),
    }))
    .filter((entry) => Number.isInteger(entry.pid) && entry.pid > 0);
}

function identityMatches(entry, pattern = DEFAULT_VOICE_APP_PATTERN) {
  pattern.lastIndex = 0;
  return pattern.test(
    `${entry.name} ${entry.executable ?? ""} ${entry.command}`,
  );
}

function selectVoiceProcessTree(
  processes,
  {
    ownProcessId = process.pid,
    pattern = DEFAULT_VOICE_APP_PATTERN,
    platform = process.platform,
    sourceId = null,
  } = {},
) {
  const byId = new Map(processes.map((entry) => [entry.pid, entry]));
  const directlyMatched = new Set(
    processes
      .filter(
        (entry) =>
          entry.pid !== ownProcessId &&
          (sourceId
            ? processMatchesSource(entry, platform, sourceId)
            : identityMatches(entry, pattern)),
      )
      .map((entry) => entry.pid),
  );
  const matched = new Set();

  for (const entry of processes) {
    let current = entry;
    const visited = new Set();
    for (let depth = 0; current && depth < 20; depth += 1) {
      if (visited.has(current.pid)) break;
      visited.add(current.pid);
      if (directlyMatched.has(current.pid)) {
        matched.add(entry.pid);
        break;
      }
      current = byId.get(current.parentId);
    }
  }

  const roots = [...directlyMatched]
    .filter((pid) => !directlyMatched.has(byId.get(pid)?.parentId))
    .sort((left, right) => left - right);
  return {
    pids: [...matched].sort((left, right) => left - right),
    rootPids: roots,
  };
}

async function listPlatformProcesses({
  platform = process.platform,
  run = execFileAsync,
} = {}) {
  if (platform !== "win32") return [];
  const command =
    "Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,Name,ExecutablePath,CommandLine | ConvertTo-Json -Compress";
  const { stdout } = await run(
    "powershell.exe",
    ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", command],
    {
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
      timeout: 5_000,
      windowsHide: true,
    },
  );
  return parseWindowsProcessList(stdout);
}

/**
 * 多 root 語意：若上次 active PID 仍在 root 集合中則 sticky 沿用；
 * 否則取排序後第一個（穩定、可預測）。
 */
function selectStickyRootPid(rootPids, previousPid = null) {
  const roots = [
    ...new Set(
      (Array.isArray(rootPids) ? rootPids : []).filter(
        (pid) => Number.isInteger(pid) && pid > 0,
      ),
    ),
  ].sort((left, right) => left - right);
  if (
    previousPid != null &&
    Number.isInteger(previousPid) &&
    roots.includes(previousPid)
  ) {
    return previousPid;
  }
  return roots[0] ?? null;
}

function isPidAlive(pid, { killProcess = process.kill } = {}) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    killProcess(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function discoverVoiceProcesses({
  platform = process.platform,
  run = execFileAsync,
  environment = process.env,
  ownProcessId = process.pid,
  pattern = null,
  voiceSource = null,
} = {}) {
  if (platform !== "win32") return { pids: [], rootPids: [] };
  const processes = await listPlatformProcesses({ platform, run });
  const selected = normalizeVoiceSource(voiceSource);
  return selectVoiceProcessTree(processes, {
    ownProcessId,
    platform,
    sourceId: selected.mode === "application" ? selected.source_id : null,
    pattern: pattern ?? configuredPattern(environment),
  });
}

module.exports = {
  DEFAULT_VOICE_APP_PATTERN,
  configuredPattern,
  discoverVoiceProcesses,
  identityMatches,
  isPidAlive,
  listPlatformProcesses,
  parseWindowsProcessList,
  selectStickyRootPid,
  selectVoiceProcessTree,
};
