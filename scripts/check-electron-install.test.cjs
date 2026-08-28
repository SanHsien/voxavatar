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

// The five tests above build their own trees, so they pin the logic anywhere.
// This one reads the real `node_modules`, and it only means something where the
// Electron binary was actually downloaded. CI installs with `npm ci` in about
// twenty seconds and never fetches it -- the node and renderer suites do not
// launch Electron, so nothing there needs the binary. Asserting on the real tree
// under CI reports that deliberate absence as a broken install, which is the
// opposite of what this guard is for. It runs on developer machines, where
// `npm run dev` does need the binary and a false positive would be real news.
test(
  "the checked-in tree passes its own guard",
  {
    skip: process.env.CI
      ? "CI does not download the Electron binary; there is no real install to check"
      : false,
  },
  () => {
    assert.equal(describeElectronInstallProblem(ELECTRON_ROOT), null);
  },
);
