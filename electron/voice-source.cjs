"use strict";

const path = require("node:path");

const VOICE_SOURCE_MODES = new Set([
  "default",
  "application",
  "custom",
  "external",
  "output",
]);
const VOICE_SOURCE_ID_PATTERN =
  /^process:win32:[A-Za-z0-9_-]{1,2048}$/;
const MAX_VOICE_SOURCE_NAME_LENGTH = 120;

const DEFAULT_VOICE_SOURCE = Object.freeze({
  mode: "default",
  process_pattern: null,
  source_id: null,
  source_name: null,
});

const DEFAULT_VOICE_APP_PATTERN_SOURCE =
  "(?:^|[\\\\/\\s._=-])(?:codex(?:-desktop)?|chatgpt|openai(?:-codex)?)(?=$|[\\\\/\\s._=-])";

const DEFAULT_VOICE_APP_PATTERN = new RegExp(
  DEFAULT_VOICE_APP_PATTERN_SOURCE,
  "i",
);

const MAX_VOICE_SOURCE_PATTERN_LENGTH = 200;
const MAX_VOICE_SOURCE_PATTERN_GROUPS = 3;
const MAX_VOICE_SOURCE_PATTERN_QUANTIFIERS = 12;

function emptyVoiceSource(mode = "default") {
  return {
    mode,
    process_pattern: null,
    source_id: null,
    source_name: null,
  };
}

function cleanSourceName(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  if (
    !normalized ||
    normalized.length > MAX_VOICE_SOURCE_NAME_LENGTH
  ) {
    return null;
  }
  return normalized;
}

function countPatternGroups(source) {
  let depth = 0;
  let maxDepth = 0;
  let escaped = false;
  for (const char of source) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === "(") {
      depth += 1;
      maxDepth = Math.max(maxDepth, depth);
    } else if (char === ")") {
      depth = Math.max(0, depth - 1);
    }
  }
  return maxDepth;
}

function countPatternQuantifiers(source) {
  const matches = source.match(/(?:\*\?|\+\?|\?\?|[*+?]|\{\d+(?:,\d*)?\})/g);
  return matches ? matches.length : 0;
}

/** 拒絕明顯容易 ReDoS 的自訂 pattern；預設 Codex／ChatGPT pattern 不受此限。 */
function assertSafeVoiceSourcePattern(source) {
  if (/(?:\*\?|\+\?|\?\?|[*+?]|\{\d+(?:,\d*)?\})\s*(?:\*\?|\+\?|\?\?|[*+?]|\{\d+(?:,\d*)?\})/.test(source)) {
    throw new Error("Process pattern must not stack quantifiers.");
  }
  if (/\((?:[^()\\]|\\.)*[+*{](?:[^()\\]|\\.)*\)(?:\*\?|\+\?|\?\?|[*+?]|\{\d+(?:,\d*)?\})/.test(source)) {
    throw new Error("Process pattern must not nest quantified groups.");
  }
  if (countPatternGroups(source) > MAX_VOICE_SOURCE_PATTERN_GROUPS) {
    throw new Error(
      `Process pattern nesting must be ${MAX_VOICE_SOURCE_PATTERN_GROUPS} levels or fewer.`,
    );
  }
  if (countPatternQuantifiers(source) > MAX_VOICE_SOURCE_PATTERN_QUANTIFIERS) {
    throw new Error(
      `Process pattern may use at most ${MAX_VOICE_SOURCE_PATTERN_QUANTIFIERS} quantifiers.`,
    );
  }
}

function compileVoiceSourcePattern(source) {
  if (typeof source !== "string" || !source.trim()) {
    return DEFAULT_VOICE_APP_PATTERN;
  }
  try {
    assertSafeVoiceSourcePattern(source.trim());
    return new RegExp(source, "i");
  } catch {
    return DEFAULT_VOICE_APP_PATTERN;
  }
}

function sanitizeVoiceSourcePattern(value) {
  if (typeof value !== "string") {
    throw new Error("Process pattern is required.");
  }
  const normalized = value.trim();
  if (!normalized) {
    throw new Error("Process pattern is required.");
  }
  if (normalized.length > MAX_VOICE_SOURCE_PATTERN_LENGTH) {
    throw new Error(
      `Process pattern must be ${MAX_VOICE_SOURCE_PATTERN_LENGTH} characters or fewer.`,
    );
  }
  assertSafeVoiceSourcePattern(normalized);
  try {
    new RegExp(normalized, "i");
  } catch {
    throw new Error("Process pattern must be a valid regular expression.");
  }
  return normalized;
}

function isValidVoiceSourceId(value) {
  if (typeof value !== "string" || !VOICE_SOURCE_ID_PATTERN.test(value)) {
    return false;
  }
  const processMatch = /^process:win32:([A-Za-z0-9_-]+)$/.exec(value);
  return Boolean(processMatch && decodeIdentity(processMatch[1])?.trim());
}

function sanitizeVoiceSource(value) {
  if (!VOICE_SOURCE_MODES.has(value?.mode)) {
    throw new Error("Voice source mode is invalid.");
  }
  if (value.mode === "custom") {
    return {
      ...emptyVoiceSource("custom"),
      process_pattern: sanitizeVoiceSourcePattern(value.process_pattern),
    };
  }
  if (value.mode === "application") {
    const sourceId =
      isValidVoiceSourceId(value.source_id)
        ? value.source_id
        : null;
    const sourceName = cleanSourceName(value.source_name);
    if (!sourceId || !sourceName) {
      throw new Error("Select a valid application voice source.");
    }
    return {
      ...emptyVoiceSource("application"),
      source_id: sourceId,
      source_name: sourceName,
    };
  }
  if (value.mode === "output") {
    return emptyVoiceSource("output");
  }
  return emptyVoiceSource(value.mode);
}

function normalizeVoiceSource(value) {
  try {
    return sanitizeVoiceSource(value);
  } catch {
    return { ...DEFAULT_VOICE_SOURCE };
  }
}

function settingsPatternFromVoiceSource(voiceSource) {
  const normalized = normalizeVoiceSource(voiceSource);
  return normalized.mode === "custom" ? normalized.process_pattern : null;
}

function resolveVoiceSourcePattern({
  environment = process.env,
  settingsPattern = null,
} = {}) {
  const envSource = environment?.VOXAVATAR_TARGET_PROCESS_PATTERN;
  if (typeof envSource === "string" && envSource.trim()) {
    return compileVoiceSourcePattern(envSource);
  }
  if (typeof settingsPattern === "string" && settingsPattern.trim()) {
    return compileVoiceSourcePattern(settingsPattern);
  }
  return DEFAULT_VOICE_APP_PATTERN;
}

function configuredPattern(environment = process.env) {
  return resolveVoiceSourcePattern({ environment });
}

function encodeIdentity(value) {
  return Buffer.from(String(value), "utf8").toString("base64url");
}

function decodeIdentity(value) {
  try {
    return Buffer.from(value, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

function normalizeProcessIdentity(value, platform) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "";
  return platform === "win32" ? normalized.toLowerCase() : normalized;
}

function processIdentity(process, platform) {
  return normalizeProcessIdentity(
    process?.executable || process?.name,
    platform,
  );
}

function processSourceId(platform, process) {
  if (platform !== "win32") return null;
  const identity = processIdentity(process, platform);
  return identity ? `process:${platform}:${encodeIdentity(identity)}` : null;
}

function processSourceLabel(platform, process) {
  const executable = String(process?.executable || process?.name || "").trim();
  const pathApi = platform === "win32" ? path.win32 : path.posix;
  const filename = pathApi.basename(executable) || String(process?.name || "");
  return filename.replace(/\.exe$/i, "") || "Application";
}

function sourceFromProcess(platform, process) {
  const id = processSourceId(platform, process);
  if (!id) return null;
  const executable = String(process?.executable || process?.name || "").trim();
  return {
    id,
    name: processSourceLabel(platform, process),
    detail: executable,
    platform,
  };
}

function processMatchesSource(process, platform, sourceId) {
  return processSourceId(platform, process) === sourceId;
}

module.exports = {
  DEFAULT_VOICE_APP_PATTERN,
  DEFAULT_VOICE_APP_PATTERN_SOURCE,
  DEFAULT_VOICE_SOURCE,
  MAX_VOICE_SOURCE_NAME_LENGTH,
  MAX_VOICE_SOURCE_PATTERN_LENGTH,
  MAX_VOICE_SOURCE_PATTERN_GROUPS,
  MAX_VOICE_SOURCE_PATTERN_QUANTIFIERS,
  VOICE_SOURCE_ID_PATTERN,
  VOICE_SOURCE_MODES,
  assertSafeVoiceSourcePattern,
  cleanSourceName,
  compileVoiceSourcePattern,
  configuredPattern,
  emptyVoiceSource,
  isValidVoiceSourceId,
  normalizeVoiceSource,
  processMatchesSource,
  processSourceId,
  resolveVoiceSourcePattern,
  sanitizeVoiceSource,
  sanitizeVoiceSourcePattern,
  settingsPatternFromVoiceSource,
  sourceFromProcess,
};
