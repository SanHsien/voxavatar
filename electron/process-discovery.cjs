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

// The CIM query took 2.8-11.9 s on a busy machine (2026-11-21 acceptance:
// about 96% CPU, about 690 processes), so the budget must sit well above that.
const PROCESS_QUERY_TIMEOUT_MS = 20_000;

const DISCOVERY_ERROR = Object.freeze({
  TIMEOUT: "process_discovery_timeout",
  FAILED: "process_discovery_failed",
  INVALID_OUTPUT: "process_discovery_invalid_output",
});

const DISCOVERY_ERROR_MESSAGE = Object.freeze({
  [DISCOVERY_ERROR.TIMEOUT]: "Process discovery timed out.",
  [DISCOVERY_ERROR.FAILED]: "Process discovery failed.",
  [DISCOVERY_ERROR.INVALID_OUTPUT]: "Process discovery returned unreadable output.",
});

// execFile puts the whole command line in its error message, and a JSON parse
// error quotes process output (other programs' command lines). Neither may
// reach listener status, so callers only ever see these fixed messages.
function discoveryError(code, cause) {
  const error = new Error(DISCOVERY_ERROR_MESSAGE[code], { cause });
  error.code = code;
  return error;
}

function isQueryTimeout(error) {
  return (
    error?.code === "ETIMEDOUT" ||
    (error?.killed === true &&
      error?.code !== "ERR_CHILD_PROCESS_STDIO_MAXBUFFER")
  );
}

/** Fixed, display-safe text for any error thrown by process discovery. */
function describeDiscoveryError(error) {
  return (
    DISCOVERY_ERROR_MESSAGE[error?.code] ??
    DISCOVERY_ERROR_MESSAGE[DISCOVERY_ERROR.FAILED]
  );
}

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
    `${entry.name} ${entry.executable ?? ""}`,
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
    "[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new([bool]0); Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,Name,ExecutablePath,CommandLine | ConvertTo-Json -Compress";
  let stdout;
  try {
    ({ stdout } = await run(
      "powershell.exe",
      ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", command],
      {
        encoding: "utf8",
        maxBuffer: 8 * 1024 * 1024,
        timeout: PROCESS_QUERY_TIMEOUT_MS,
        windowsHide: true,
      },
    ));
  } catch (error) {
    throw discoveryError(
      isQueryTimeout(error) ? DISCOVERY_ERROR.TIMEOUT : DISCOVERY_ERROR.FAILED,
      error,
    );
  }
  try {
    return parseWindowsProcessList(stdout);
  } catch (error) {
    throw discoveryError(DISCOVERY_ERROR.INVALID_OUTPUT, error);
  }
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
  const envPattern = environment?.VOXAVATAR_TARGET_PROCESS_PATTERN;
  const envOverridesUi =
    typeof envPattern === "string" && envPattern.trim().length > 0;
  // 環境變數覆寫介面選擇的應用程式來源，改走 pattern 比對。
  return selectVoiceProcessTree(processes, {
    ownProcessId,
    platform,
    sourceId:
      envOverridesUi || selected.mode !== "application"
        ? null
        : selected.source_id,
    pattern: pattern ?? configuredPattern(environment),
  });
}

module.exports = {
  DEFAULT_VOICE_APP_PATTERN,
  DISCOVERY_ERROR,
  PROCESS_QUERY_TIMEOUT_MS,
  configuredPattern,
  describeDiscoveryError,
  discoverVoiceProcesses,
  identityMatches,
  isPidAlive,
  listPlatformProcesses,
  parseWindowsProcessList,
  selectStickyRootPid,
  selectVoiceProcessTree,
};
