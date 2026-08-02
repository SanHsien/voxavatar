"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  applyRenamePlan,
  inspectVrmaDirectory,
  validateRenamePlan,
  verifyAutomaticAssignments,
} = require("./vrma-curation.cjs");
const {
  buildRotationVrma,
} = require("../electron/fixtures/vrm-vrma/builders.cjs");

function fixture() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "voxavatar-vrma-curation-"));
}

test("inspects humanoid motion and reports invalid VRMA files", () => {
  const root = fixture();
  fs.writeFileSync(path.join(root, "idle.vrma"), buildRotationVrma());
  fs.writeFileSync(path.join(root, "._idle.vrma"), "AppleDouble metadata");

  const report = inspectVrmaDirectory(root);

  assert.deepEqual(report.summary, { files: 2, valid: 1, invalid: 1 });
  const valid = report.files.find((file) => file.file === "idle.vrma");
  assert.equal(valid.valid, true);
  assert.ok(valid.animated_bones.includes("head"));
  assert.ok(valid.motion_by_group_rad.head > 0);
  assert.equal(valid.hips_translation_range.length, 3);
  const invalid = report.files.find((file) => file.file === "._idle.vrma");
  assert.equal(invalid.valid, false);
  assert.ok(invalid.issues.includes("parse_error"));
});

test("rename plan rejects traversal, duplicate targets, and missing sources", () => {
  const root = fixture();
  fs.writeFileSync(path.join(root, "one.vrma"), "one");
  fs.writeFileSync(path.join(root, "two.vrma"), "two");

  const result = validateRenamePlan(root, {
    schema_version: 1,
    renames: [
      { from: "../one.vrma", to: "idle-01.vrma" },
      { from: "missing.vrma", to: "idle-01.vrma" },
      { from: "one.vrma", to: "shared.vrma" },
      { from: "two.vrma", to: "shared.vrma" },
    ],
  });

  assert.equal(result.ok, false);
  assert.ok(result.errors.includes("rename_0_basename_invalid"));
  assert.ok(result.errors.includes("rename_1_source_missing"));
  assert.ok(result.errors.includes("rename_3_destination_duplicate"));
});

test("rename plan rejects an unrelated existing destination", () => {
  const root = fixture();
  fs.writeFileSync(path.join(root, "source.vrma"), "source");
  fs.writeFileSync(path.join(root, "occupied.vrma"), "occupied");

  const result = validateRenamePlan(root, {
    schema_version: 1,
    renames: [{ from: "source.vrma", to: "occupied.vrma" }],
  });

  assert.equal(result.ok, false);
  assert.ok(result.errors.includes("rename_0_destination_exists"));
});

test("rename plan cannot rename unrelated file types", () => {
  const root = fixture();
  fs.writeFileSync(path.join(root, "notes.txt"), "notes");

  const result = validateRenamePlan(root, {
    schema_version: 1,
    renames: [{ from: "notes.txt", to: "renamed.txt" }],
  });

  assert.equal(result.ok, false);
  assert.ok(result.errors.includes("rename_0_extension_invalid"));
});

test("rename defaults to dry-run and applies swaps without overwriting", () => {
  const root = fixture();
  fs.writeFileSync(path.join(root, "left.vrma"), "left");
  fs.writeFileSync(path.join(root, "right.vrma"), "right");
  const plan = {
    schema_version: 1,
    renames: [
      { from: "left.vrma", to: "right.vrma" },
      { from: "right.vrma", to: "left.vrma" },
    ],
  };

  const dryRun = applyRenamePlan(root, plan);
  assert.equal(dryRun.applied, false);
  assert.equal(fs.readFileSync(path.join(root, "left.vrma"), "utf8"), "left");

  const applied = applyRenamePlan(root, plan, { apply: true });
  assert.equal(applied.applied, true);
  assert.equal(applied.verified_sha256, 2);
  assert.equal(fs.readFileSync(path.join(root, "left.vrma"), "utf8"), "right");
  assert.equal(fs.readFileSync(path.join(root, "right.vrma"), "utf8"), "left");
  assert.deepEqual(
    fs.readdirSync(root).filter((name) => name.includes(".voxavatar-rename-")),
    [],
  );
});

test("rename applies case-only normalization through a temporary name", () => {
  const root = fixture();
  fs.writeFileSync(path.join(root, "Idle.vrma"), "idle");
  const plan = {
    schema_version: 1,
    renames: [{ from: "Idle.vrma", to: "idle.vrma" }],
  };

  const applied = applyRenamePlan(root, plan, { apply: true });

  assert.equal(applied.verified_sha256, 1);
  assert.equal(fs.readFileSync(path.join(root, "idle.vrma"), "utf8"), "idle");
});

test("rename restores every source when finalization fails mid-batch", () => {
  const root = fixture();
  fs.writeFileSync(path.join(root, "one.vrma"), "one");
  fs.writeFileSync(path.join(root, "two.vrma"), "two");
  const plan = {
    schema_version: 1,
    renames: [
      { from: "one.vrma", to: "first.vrma" },
      { from: "two.vrma", to: "second.vrma" },
    ],
  };
  const renameSync = fs.renameSync;
  let calls = 0;
  fs.renameSync = (...args) => {
    calls += 1;
    if (calls === 4) throw new Error("injected finalize failure");
    return renameSync(...args);
  };

  try {
    assert.throws(
      () => applyRenamePlan(root, plan, { apply: true }),
      /injected finalize failure/u,
    );
  } finally {
    fs.renameSync = renameSync;
  }

  assert.equal(fs.readFileSync(path.join(root, "one.vrma"), "utf8"), "one");
  assert.equal(fs.readFileSync(path.join(root, "two.vrma"), "utf8"), "two");
  assert.equal(fs.existsSync(path.join(root, "first.vrma")), false);
  assert.equal(fs.existsSync(path.join(root, "second.vrma")), false);
  assert.deepEqual(
    fs.readdirSync(root).filter((name) => name.includes(".voxavatar-rename-")),
    [],
  );
});

test("verifies production filename suggestions against action-pack actions", () => {
  const root = fixture();
  fs.writeFileSync(path.join(root, "idle-01.vrma"), "idle");
  fs.writeFileSync(path.join(root, "wave.vrma"), "wave");
  fs.writeFileSync(path.join(root, "unknown.vrma"), "unknown");

  const report = verifyAutomaticAssignments(root, {
    schema_version: 1,
    name: "test-pack",
    actions: [
      { animation_name: "idle", files: ["idle-01.vrma"] },
      { animation_name: "wave", files: ["wave.vrma", "missing.vrma"] },
    ],
  });

  assert.equal(report.ok, false);
  assert.deepEqual(report.summary, {
    files: 3,
    exact_name: 1,
    name_prefix: 1,
    whitelist_slot: 0,
    unmatched: 1,
    wrong_action: 0,
    unlisted: 1,
    missing_files: 1,
    duplicate_references: 0,
  });
  assert.deepEqual(report.missing_files, ["missing.vrma"]);
  assert.equal(
    report.results.find((result) => result.file === "idle-01.vrma").ok,
    true,
  );
  assert.equal(
    report.results.find((result) => result.file === "unknown.vrma").ok,
    false,
  );

  const cleanRoot = fixture();
  fs.writeFileSync(path.join(cleanRoot, "idle-01.vrma"), "idle");
  fs.writeFileSync(path.join(cleanRoot, "wave.vrma"), "wave");
  const cleanReport = verifyAutomaticAssignments(cleanRoot, {
    schema_version: 1,
    name: "clean-pack",
    actions: [
      { animation_name: "idle", files: ["idle-01.vrma"] },
      { animation_name: "wave", files: ["wave.vrma"] },
    ],
  });
  assert.equal(cleanReport.ok, true);
});
