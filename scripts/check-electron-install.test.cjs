"use strict";

const assert = require("node:assert/strict");
const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  describeElectronInstallProblem,
  ELECTRON_ROOT,
} = require("./check-electron-install.cjs");

function fixture(build) {
  const root = mkdtempSync(path.join(tmpdir(), "electron-install-"));
  build(root);
  return root;
}

test("a complete install reports no problem", () => {
  const root = fixture((dir) => {
    mkdirSync(path.join(dir, "dist"));
    writeFileSync(path.join(dir, "dist", "electron.exe"), "binary");
    writeFileSync(path.join(dir, "path.txt"), "electron.exe");
  });

  try {
    assert.equal(describeElectronInstallProblem(root), null);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a dist holding only licences is reported, not passed over", () => {
  // This is the exact shape npm leaves behind on a silent failure: exit code 0,
  // no warning, and a dist directory with nothing runnable in it.
  const root = fixture((dir) => {
    mkdirSync(path.join(dir, "dist"));
    writeFileSync(path.join(dir, "dist", "LICENSES.chromium.html"), "<html>");
  });

  try {
    const problem = describeElectronInstallProblem(root);
    assert.match(String(problem), /path\.txt/);
    assert.match(String(problem), /npm ci/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a path.txt naming a binary that is not there is reported", () => {
  const root = fixture((dir) => {
    mkdirSync(path.join(dir, "dist"));
    writeFileSync(path.join(dir, "path.txt"), "electron.exe");
  });

  try {
    assert.match(String(describeElectronInstallProblem(root)), /does not exist/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("an empty path.txt is reported", () => {
  const root = fixture((dir) => {
    mkdirSync(path.join(dir, "dist"));
    writeFileSync(path.join(dir, "path.txt"), "   \n");
  });

  try {
    assert.match(String(describeElectronInstallProblem(root)), /empty/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a missing electron package is reported", () => {
  const root = fixture(() => {});
  const missing = path.join(root, "nope");

  try {
    assert.match(String(describeElectronInstallProblem(missing)), /missing/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the checked-in tree passes its own guard", () => {
  assert.equal(describeElectronInstallProblem(ELECTRON_ROOT), null);
});
