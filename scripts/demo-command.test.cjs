"use strict";

const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

test("demo builds and launches the real listener runtime", () => {
  const projectRoot = path.join(__dirname, "..");
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"),
  );
  const mainProcess = fs.readFileSync(
    path.join(projectRoot, "electron", "main.cjs"),
    "utf8",
  );

  assert.equal(packageJson.scripts.demo, "npm run build && electron .");
  assert.doesNotMatch(mainProcess, /--demo|demoMode|startDemo/);
});
