"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
  MODULE_TARGETS,
  buildStartupReport,
  generateStartupBaseline,
  measureRequire,
} = require("./startup-baseline.cjs");

test("MODULE_TARGETS includes expected main-process modules", () => {
  const ids = MODULE_TARGETS.map((entry) => entry.id);
  assert.deepEqual(ids, [
    "settings-store",
    "mcp-schemas",
    "directory-import",
    "app-readiness",
  ]);
  for (const entry of MODULE_TARGETS) {
    assert.equal(fs.existsSync(entry.modulePath), true);
  }
});

test("measureRequire returns a positive duration for settings-store", () => {
  const target = MODULE_TARGETS.find((entry) => entry.id === "settings-store");
  const durationMs = measureRequire(target.modulePath);
  assert.ok(Number.isFinite(durationMs));
  assert.ok(durationMs >= 0);
});

test("buildStartupReport shapes JSON with guidance note", () => {
  const report = buildStartupReport({
    appVersion: "0.6.0",
    moduleTimings: [
      { id: "settings-store", modulePath: "electron/settings-store.cjs", durationMs: 12.5 },
    ],
    buildTimingMs: null,
  });

  assert.equal(report.format, "VoxAvatar-Startup-Baseline");
  assert.equal(report.appVersion, "0.6.0");
  assert.equal(report.totals.requireTotalMs, 12.5);
  assert.equal(report.totals.buildMs, null);
  assert.match(report.note, /ROADMAP verification gaps/);
  assert.ok(report.guidance.notes.length > 0);
});

test("generateStartupBaseline writes release/startup-baseline.json", (context) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "voxavatar-startup-baseline-"));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const outputPath = path.join(root, "release", "startup-baseline.json");

  const result = generateStartupBaseline({
    root,
    outputPath,
    includeBuild: false,
    moduleTargets: MODULE_TARGETS.slice(0, 2),
  });

  assert.equal(result.moduleCount, 2);
  assert.equal(fs.existsSync(outputPath), true);
  const written = JSON.parse(fs.readFileSync(outputPath, "utf8"));
  assert.equal(written.modules.length, 2);
  assert.ok(written.totals.requireTotalMs >= 0);
});

test("package.json exposes baseline:startup script", () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"),
  );
  assert.equal(
    packageJson.scripts["baseline:startup"],
    "node scripts/startup-baseline.cjs",
  );
});
