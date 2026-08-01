"use strict";

const path = require("node:path");

const VOICE_SOURCE_MODES = new Set([
  "default",
  "application",
  "custom",
  "external",
]);
const VOICE_SOURCE_ID_PATTERN =
  /^(?:process:(?:darwin|win32)|pipewire:(?:application|binary|node|stream)):[A-Za-z0-9_-]{1,2048}$/;
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

function compileVoiceSourcePattern(source) {
  if (typeof source !== "string" || !source.trim()) {
    return DEFAULT_VOICE_APP_PATTERN;
  }
  try {
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
  const processMatch = /^process:(?:darwin|win32):([A-Za-z0-9_-]+)$/.exec(
    value,
  );
  if (processMatch) return Boolean(decodeIdentity(processMatch[1])?.trim());

  const legacyMatch =
    /^pipewire:(?:application|binary|node):([A-Za-z0-9_-]+)$/.exec(value);
  if (legacyMatch) return Boolean(decodeIdentity(legacyMatch[1])?.trim());

  const streamMatch = /^pipewire:stream:([A-Za-z0-9_-]+)$/.exec(value);
  if (!streamMatch) return false;
  try {
    const decoded = decodeIdentity(streamMatch[1]);
    const identity = decoded == null ? null : JSON.parse(decoded);
    if (!identity || typeof identity !== "object" || Array.isArray(identity)) {
      return false;
    }
    return ["application", "binary", "node"].some(
      (field) =>
        typeof identity[field] === "string" &&
        cleanSourceName(identity[field]) === identity[field],
    );
  } catch {
    return false;
  }
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
  if (!["darwin", "win32"].includes(platform)) return null;
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

function cleanPipeWireIdentity(properties) {
  const identity = {
    application: cleanSourceName(properties?.["application.name"]),
    binary: cleanSourceName(properties?.["application.process.binary"]),
    node: cleanSourceName(properties?.["node.name"]),
  };
  return Object.values(identity).some(Boolean) ? identity : null;
}

function pipeWireSourceFromProperties(properties) {
  const identity = cleanPipeWireIdentity(properties);
  if (!identity) return null;
  const detailParts = [identity.binary, identity.node].filter(
    (value, index, values) => value && values.indexOf(value) === index,
  );
  return {
    id: `pipewire:stream:${encodeIdentity(JSON.stringify(identity))}`,
    name:
      identity.application ??
      cleanSourceName(properties?.["node.description"]) ??
      identity.binary ??
      identity.node ??
      "Audio stream",
    detail: detailParts.join(" · ") || identity.application || "Playback stream",
    platform: "linux",
  };
}

function matchesLegacyPipeWireSource(properties, kind, encodedValue) {
  const value = decodeIdentity(encodedValue);
  if (value == null) return false;
  const property =
    kind === "application"
      ? "application.name"
      : kind === "binary"
        ? "application.process.binary"
        : "node.name";
  return properties?.[property] === value;
}

function pipeWirePropertiesMatchSource(properties, sourceId) {
  const legacy = /^pipewire:(application|binary|node):([A-Za-z0-9_-]+)$/.exec(
    String(sourceId),
  );
  if (legacy) return matchesLegacyPipeWireSource(properties, legacy[1], legacy[2]);

  const match = /^pipewire:stream:([A-Za-z0-9_-]+)$/.exec(String(sourceId));
  if (!match) return false;
  try {
    const decoded = decodeIdentity(match[1]);
    const expected = decoded == null ? null : JSON.parse(decoded);
    const actual = cleanPipeWireIdentity(properties);
    if (!expected || !actual) return false;
    return ["application", "binary", "node"].every(
      (field) => expected[field] == null || expected[field] === actual[field],
    );
  } catch {
    return false;
  }
}

module.exports = {
  DEFAULT_VOICE_APP_PATTERN,
  DEFAULT_VOICE_APP_PATTERN_SOURCE,
  DEFAULT_VOICE_SOURCE,
  MAX_VOICE_SOURCE_NAME_LENGTH,
  MAX_VOICE_SOURCE_PATTERN_LENGTH,
  VOICE_SOURCE_ID_PATTERN,
  VOICE_SOURCE_MODES,
  cleanSourceName,
  compileVoiceSourcePattern,
  configuredPattern,
  emptyVoiceSource,
  isValidVoiceSourceId,
  normalizeVoiceSource,
  pipeWirePropertiesMatchSource,
  pipeWireSourceFromProperties,
  processMatchesSource,
  processSourceId,
  resolveVoiceSourcePattern,
  sanitizeVoiceSource,
  sanitizeVoiceSourcePattern,
  settingsPatternFromVoiceSource,
  sourceFromProcess,
};
