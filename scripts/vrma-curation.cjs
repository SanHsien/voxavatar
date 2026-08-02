"use strict";

/**
 * 離線 VRMA 整理輔助：輸出可驗證的骨架結構資料，並安全套用人工審核的改名計畫。
 * 本工具刻意不推測動作語意，也不會在 VoxAvatar 執行期載入。
 */

const fs = require("node:fs");
const nodeCrypto = require("node:crypto");
const path = require("node:path");

const {
  analyzeAnimationTracks,
  analyzeVrmaFile,
  humanoidBoneMap,
  readGlb,
} = require("../electron/vrma-quality.cjs");
const { validateActionPack } = require("../electron/action-pack.cjs");
const {
  suggestVrmaAssignments,
} = require("../electron/vrma-assignment-suggest.cjs");

const PLAN_SCHEMA_VERSION = 1;
const MAX_WINDOWS_BASENAME_LENGTH = 240;
const WINDOWS_INVALID_BASENAME = /[<>:"/\\|?*]/u;
const WINDOWS_RESERVED_BASENAME = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/iu;

function rounded(value) {
  return Number(value.toFixed(3));
}

function quaternionAngle(left, right) {
  const leftLength = Math.hypot(...left) || 1;
  const rightLength = Math.hypot(...right) || 1;
  let dot = 0;
  for (let index = 0; index < 4; index += 1) {
    dot += (left[index] / leftLength) * (right[index] / rightLength);
  }
  return 2 * Math.acos(Math.min(1, Math.max(-1, Math.abs(dot))));
}

function boneGroup(boneName) {
  if (boneName === "head" || boneName === "neck") return "head";
  if (["hips", "spine", "chest", "upperChest"].includes(boneName)) {
    return "torso";
  }
  if (/^(left|right)(Shoulder|UpperArm|LowerArm|Hand)$/u.test(boneName)) {
    return "arms";
  }
  if (/^(left|right).*(Thumb|Index|Middle|Ring|Little)/u.test(boneName)) {
    return "fingers";
  }
  if (/^(left|right)(UpperLeg|LowerLeg|Foot|Toes)$/u.test(boneName)) {
    return "legs";
  }
  return "other";
}

function vectorRange(keys) {
  if (keys.length === 0) return [0, 0, 0];
  const minimum = [Infinity, Infinity, Infinity];
  const maximum = [-Infinity, -Infinity, -Infinity];
  for (const key of keys) {
    for (let axis = 0; axis < 3; axis += 1) {
      minimum[axis] = Math.min(minimum[axis], key.v[axis]);
      maximum[axis] = Math.max(maximum[axis], key.v[axis]);
    }
  }
  return maximum.map((value, axis) => rounded(value - minimum[axis]));
}

function inspectVrmaFile(filePath) {
  const quality = analyzeVrmaFile(filePath);
  if (!quality.metrics) {
    return {
      file: path.basename(filePath),
      valid: false,
      byte_length: fs.statSync(filePath).size,
      error: quality.error,
      issues: quality.issues.map((issue) => issue.code),
    };
  }

  const parsed = readGlb(filePath);
  const tracks = analyzeAnimationTracks(parsed.json, parsed.bin);
  const boneByNode = humanoidBoneMap(parsed.json);
  const groupMotion = {
    head: 0,
    torso: 0,
    arms: 0,
    fingers: 0,
    legs: 0,
    other: 0,
  };
  const boneMotion = [];

  for (const track of tracks.rotationTracks) {
    const boneName = boneByNode.get(track.nodeIndex);
    if (!boneName) continue;
    let total = 0;
    for (let index = 1; index < track.keys.length; index += 1) {
      total += quaternionAngle(track.keys[index - 1].q, track.keys[index].q);
    }
    groupMotion[boneGroup(boneName)] += total;
    boneMotion.push({ bone: boneName, total_rotation_rad: rounded(total) });
  }

  const hipsNode = [...boneByNode.entries()].find(
    ([, boneName]) => boneName === "hips",
  )?.[0];
  const hipsTranslation = tracks.translationTracks.find(
    (track) => track.nodeIndex === hipsNode,
  );
  const animatedBones = [...tracks.animatedNodeIndexes]
    .map((nodeIndex) => boneByNode.get(nodeIndex))
    .filter(Boolean)
    .sort();

  return {
    file: path.basename(filePath),
    valid: true,
    byte_length: quality.byteLength,
    spec_version:
      parsed.json.extensions?.VRMC_vrm_animation?.specVersion ?? null,
    duration_sec: quality.metrics.durationSec,
    estimated_fps: quality.metrics.estimatedFps,
    animated_bones: [...new Set(animatedBones)],
    expression_or_unmapped_channel_count:
      tracks.trackCount - tracks.rotationTracks.filter((track) =>
        boneByNode.has(track.nodeIndex),
      ).length - tracks.translationTracks.filter((track) =>
        boneByNode.has(track.nodeIndex),
      ).length,
    motion_by_group_rad: Object.fromEntries(
      Object.entries(groupMotion).map(([group, value]) => [group, rounded(value)]),
    ),
    most_active_bones: boneMotion
      .sort((left, right) => right.total_rotation_rad - left.total_rotation_rad)
      .slice(0, 8),
    hips_translation_range: hipsTranslation
      ? vectorRange(hipsTranslation.keys)
      : [0, 0, 0],
    quality: {
      score: quality.score,
      verdict: quality.verdict,
      assumed_purpose: quality.purpose,
      issues: quality.issues.map((issue) => issue.code),
    },
  };
}

function inspectVrmaDirectory(directoryPath) {
  const directory = path.resolve(directoryPath);
  if (!fs.statSync(directory).isDirectory()) {
    throw new Error(`Not a directory: ${directory}`);
  }
  const files = fs
    .readdirSync(directory, { withFileTypes: true })
    .filter(
      (entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === ".vrma",
    )
    .map((entry) => inspectVrmaFile(path.join(directory, entry.name)))
    .sort((left, right) => left.file.localeCompare(right.file, "en"));
  return {
    schema_version: 1,
    source_directory: directory,
    summary: {
      files: files.length,
      valid: files.filter((file) => file.valid).length,
      invalid: files.filter((file) => !file.valid).length,
    },
    files,
  };
}

function verifyAutomaticAssignments(directoryPath, rawActionPack) {
  const directory = path.resolve(directoryPath);
  if (!fs.statSync(directory).isDirectory()) {
    throw new Error(`Not a directory: ${directory}`);
  }
  const validation = validateActionPack(rawActionPack);
  if (!validation.ok) {
    const error = new Error("Action pack is invalid.");
    error.details = validation.errors;
    throw error;
  }

  const animations = validation.pack.actions.map((action, index) => ({
    id: `action-pack-${index}`,
    animation_name: action.animation_name,
    animation_type: null,
  }));
  const expectedByFile = new Map();
  const duplicateReferences = [];
  for (const action of validation.pack.actions) {
    for (const file of action.files) {
      const key = file.toLowerCase();
      if (expectedByFile.has(key)) duplicateReferences.push(file);
      else expectedByFile.set(key, action.animation_name);
    }
  }

  const files = fs
    .readdirSync(directory, { withFileTypes: true })
    .filter(
      (entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === ".vrma",
    )
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right, "en"));
  const suggestions = suggestVrmaAssignments(files, animations);
  const results = suggestions.map((suggestion) => {
    const expected = expectedByFile.get(suggestion.basename.toLowerCase()) ?? null;
    return {
      file: suggestion.basename,
      expected_animation_name: expected,
      matched_animation_name: suggestion.animationName,
      match_kind: suggestion.matchKind,
      reason: suggestion.reason,
      ok: expected != null && suggestion.animationName === expected,
    };
  });
  const diskNames = new Set(files.map((file) => file.toLowerCase()));
  const missingFiles = [...expectedByFile.keys()].filter(
    (file) => !diskNames.has(file),
  );
  const summary = {
    files: files.length,
    exact_name: results.filter((result) => result.match_kind === "exact_name")
      .length,
    name_prefix: results.filter((result) => result.match_kind === "name_prefix")
      .length,
    whitelist_slot: results.filter(
      (result) => result.match_kind === "whitelist_slot",
    ).length,
    unmatched: results.filter((result) => result.matched_animation_name == null)
      .length,
    wrong_action: results.filter(
      (result) =>
        result.matched_animation_name != null &&
        result.matched_animation_name !== result.expected_animation_name,
    ).length,
    unlisted: results.filter((result) => result.expected_animation_name == null)
      .length,
    missing_files: missingFiles.length,
    duplicate_references: duplicateReferences.length,
  };
  const ok = [
    summary.unmatched,
    summary.wrong_action,
    summary.unlisted,
    summary.missing_files,
    summary.duplicate_references,
  ].every((count) => count === 0);

  return {
    schema_version: 1,
    ok,
    source_directory: directory,
    action_pack: validation.pack.name,
    prerequisite:
      "The action-pack actions must already exist; filename suggestions never create actions.",
    summary,
    missing_files: missingFiles,
    duplicate_references: duplicateReferences,
    results,
  };
}

function validBasename(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_WINDOWS_BASENAME_LENGTH &&
    value === path.basename(value) &&
    value !== "." &&
    value !== ".." &&
    ![...value].some((character) => character.codePointAt(0) <= 0x1f) &&
    !WINDOWS_INVALID_BASENAME.test(value) &&
    !WINDOWS_RESERVED_BASENAME.test(value) &&
    !/[. ]$/u.test(value)
  );
}

function validateRenamePlan(directoryPath, rawPlan) {
  const directory = path.resolve(directoryPath);
  const errors = [];
  if (rawPlan?.schema_version !== PLAN_SCHEMA_VERSION) {
    errors.push("unsupported_schema_version");
  }
  if (!Array.isArray(rawPlan?.renames) || rawPlan.renames.length === 0) {
    errors.push("renames_required");
  }

  const entries = [];
  const sources = new Set();
  const destinations = new Set();
  for (const [index, item] of (rawPlan?.renames ?? []).entries()) {
    if (!validBasename(item?.from) || !validBasename(item?.to)) {
      errors.push(`rename_${index}_basename_invalid`);
      continue;
    }
    if (
      path.extname(item.from).toLowerCase() !== ".vrma" ||
      ![".vrma", ".metadata"].includes(path.extname(item.to).toLowerCase())
    ) {
      errors.push(`rename_${index}_extension_invalid`);
      continue;
    }
    const sourceKey = item.from.toLowerCase();
    const destinationKey = item.to.toLowerCase();
    if (item.from === item.to) {
      errors.push(`rename_${index}_unchanged`);
      continue;
    }
    if (sources.has(sourceKey)) errors.push(`rename_${index}_source_duplicate`);
    if (destinations.has(destinationKey)) {
      errors.push(`rename_${index}_destination_duplicate`);
    }
    sources.add(sourceKey);
    destinations.add(destinationKey);
    entries.push({
      index,
      from: item.from,
      to: item.to,
      source: path.join(directory, item.from),
      destination: path.join(directory, item.to),
    });
  }

  for (const entry of entries) {
    if (!fs.existsSync(entry.source) || !fs.statSync(entry.source).isFile()) {
      errors.push(`rename_${entry.index}_source_missing`);
    }
    if (
      fs.existsSync(entry.destination) &&
      !sources.has(path.basename(entry.destination).toLowerCase())
    ) {
      errors.push(`rename_${entry.index}_destination_exists`);
    }
  }

  return { ok: errors.length === 0, directory, entries, errors };
}

function applyRenamePlan(directoryPath, rawPlan, { apply = false } = {}) {
  const validation = validateRenamePlan(directoryPath, rawPlan);
  if (!validation.ok) {
    const error = new Error("VRMA rename plan is invalid.");
    error.details = validation.errors;
    throw error;
  }
  if (!apply) {
    return {
      applied: false,
      count: validation.entries.length,
      renames: validation.entries.map(({ from, to }) => ({ from, to })),
    };
  }

  const staged = validation.entries.map((entry) => {
    let temporary;
    do {
      temporary = path.join(
        validation.directory,
        `.voxavatar-rename-${nodeCrypto.randomUUID()}.tmp`,
      );
    } while (fs.existsSync(temporary));
    return {
      ...entry,
      temporary,
      sha256: fileSha256(entry.source),
      state: "source",
    };
  });
  for (const entry of staged) {
    if (fs.existsSync(entry.temporary)) {
      throw new Error(`Temporary rename path exists: ${entry.temporary}`);
    }
  }

  try {
    for (const entry of staged) {
      fs.renameSync(entry.source, entry.temporary);
      entry.state = "temporary";
    }
    for (const entry of staged) {
      fs.renameSync(entry.temporary, entry.destination);
      entry.state = "destination";
    }
    for (const entry of staged) {
      if (fileSha256(entry.destination) !== entry.sha256) {
        throw new Error(`SHA-256 mismatch after rename: ${entry.to}`);
      }
    }
  } catch (error) {
    for (const entry of [...staged].reverse()) {
      try {
        if (entry.state === "destination" && fs.existsSync(entry.destination)) {
          fs.renameSync(entry.destination, entry.temporary);
          entry.state = "temporary";
        }
      } catch {
        // 下一階段仍會嘗試復原其他項目。
      }
    }
    for (const entry of [...staged].reverse()) {
      try {
        if (entry.state === "temporary" && fs.existsSync(entry.temporary)) {
          fs.renameSync(entry.temporary, entry.source);
        }
      } catch {
        // 保留原始錯誤；呼叫端仍可從 temporary 名稱人工復原。
      }
    }
    throw error;
  }

  return {
    applied: true,
    count: staged.length,
    verified_sha256: staged.length,
    renames: staged.map(({ from, to }) => ({ from, to })),
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(path.resolve(filePath), "utf8"));
}

function writeJson(filePath, value) {
  const resolved = path.resolve(filePath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function fileSha256(filePath) {
  return nodeCrypto
    .createHash("sha256")
    .update(fs.readFileSync(filePath))
    .digest("hex");
}

function usage() {
  return [
    "Usage:",
    "  node scripts/vrma-curation.cjs inspect <directory> [--output <report.json>]",
    "  node scripts/vrma-curation.cjs rename <directory> <plan.json> [--apply]",
    "  node scripts/vrma-curation.cjs verify-names <directory> <action-pack.json> [--output <report.json>]",
  ].join("\n");
}

function main(argv = process.argv.slice(2)) {
  const [command, directory, planPath] = argv;
  if (command === "inspect" && directory) {
    const report = inspectVrmaDirectory(directory);
    const outputIndex = argv.indexOf("--output");
    if (outputIndex >= 0) {
      const outputPath = argv[outputIndex + 1];
      if (!outputPath) throw new Error("--output requires a path.");
      writeJson(outputPath, report);
    } else {
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    }
    return;
  }
  if (command === "rename" && directory && planPath) {
    const result = applyRenamePlan(directory, readJson(planPath), {
      apply: argv.includes("--apply"),
    });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }
  if (command === "verify-names" && directory && planPath) {
    const result = verifyAutomaticAssignments(directory, readJson(planPath));
    const outputIndex = argv.indexOf("--output");
    if (outputIndex >= 0) {
      const outputPath = argv[outputIndex + 1];
      if (!outputPath) throw new Error("--output requires a path.");
      writeJson(outputPath, result);
    } else {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    }
    if (!result.ok) {
      throw new Error("VRMA filenames do not fully match the action pack.");
    }
    return;
  }
  throw new Error(usage());
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    if (Array.isArray(error?.details)) console.error(error.details.join("\n"));
    process.exitCode = 1;
  }
}

module.exports = {
  PLAN_SCHEMA_VERSION,
  applyRenamePlan,
  inspectVrmaDirectory,
  inspectVrmaFile,
  validateRenamePlan,
  verifyAutomaticAssignments,
};
