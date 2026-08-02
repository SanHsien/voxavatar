"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { collectAssetFiles, shouldSkipDir } = require("./asset-scan.cjs");

function makeTree(context) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "voxavatar-scan-"));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

test("shouldSkipDir ignores hidden and tooling folders", () => {
  assert.equal(shouldSkipDir(".git"), true);
  assert.equal(shouldSkipDir("node_modules"), true);
  assert.equal(shouldSkipDir("Animations"), false);
});

test("collectAssetFiles walks nested folders for vrm and vrma", (context) => {
  const root = makeTree(context);
  fs.mkdirSync(path.join(root, "a", "b"), { recursive: true });
  fs.mkdirSync(path.join(root, ".git"), { recursive: true });
  fs.writeFileSync(path.join(root, "hero.vrm"), "x");
  fs.writeFileSync(path.join(root, "a", "idle.vrma"), "x");
  fs.writeFileSync(path.join(root, "a", "b", "wave.VRMA"), "x");
  fs.writeFileSync(path.join(root, "a", "notes.txt"), "x");
  fs.writeFileSync(path.join(root, ".git", "secret.vrma"), "x");

  const result = collectAssetFiles(root);
  assert.equal(result.files.length, 3);
  assert.ok(result.files.some((file) => file.endsWith("hero.vrm")));
  assert.ok(result.files.some((file) => file.endsWith("idle.vrma")));
  assert.ok(result.files.some((file) => /wave\.VRMA$/i.test(file)));
  assert.ok(!result.files.some((file) => file.includes(`${path.sep}.git${path.sep}`)));
});

test("collectAssetFiles can filter by extension", (context) => {
  const root = makeTree(context);
  fs.writeFileSync(path.join(root, "a.vrm"), "x");
  fs.writeFileSync(path.join(root, "b.vrma"), "x");
  const onlyVrma = collectAssetFiles(root, { extensions: [".vrma"] });
  assert.deepEqual(
    onlyVrma.files.map((file) => path.basename(file)),
    ["b.vrma"],
  );
});
