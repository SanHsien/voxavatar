"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { classifyUpdate } = require("./dependabot-policy.cjs");

const base = {
  ecosystem: "npm_and_yarn",
  dependencyType: "direct:development",
  updateType: "version-update:semver-minor",
  changedFiles: ["package.json", "package-lock.json"],
  dependencyNames: ["eslint", "vitest"],
};

test("auto-merges allowlisted CI tools for minor and patch updates", () => {
  assert.equal(classifyUpdate(base).decision, "auto_merge");
  assert.equal(
    classifyUpdate({ ...base, updateType: "version-update:semver-patch" }).decision,
    "auto_merge",
  );
});

test("keeps runtime, packaging, major, and out-of-scope changes manual", () => {
  assert.equal(
    classifyUpdate({ ...base, dependencyType: "direct:production" }).decision,
    "manual",
  );
  assert.equal(
    classifyUpdate({ ...base, dependencyNames: ["electron-builder"] }).decision,
    "manual",
  );
  assert.equal(
    classifyUpdate({ ...base, updateType: "version-update:semver-major" }).decision,
    "manual",
  );
  assert.equal(
    classifyUpdate({ ...base, changedFiles: ["package.json", "src/App.tsx"] }).decision,
    "manual",
  );
});

test("auto-merges only workflow-scoped GitHub Actions minor updates", () => {
  const action = {
    ecosystem: "github-actions",
    dependencyType: "direct:production",
    updateType: "version-update:semver-minor",
    changedFiles: [".github/workflows/ci.yml"],
    dependencyNames: ["actions/checkout"],
  };
  assert.equal(classifyUpdate(action).decision, "auto_merge");
  assert.equal(
    classifyUpdate({ ...action, changedFiles: ["README.md"] }).decision,
    "manual",
  );
});
