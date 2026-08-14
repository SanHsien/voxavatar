"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

test("Electron uses the maintained extractor and excludes vulnerable extract-zip", () => {
  const packageJson = readJson("package.json");
  const lock = readJson("package-lock.json");
  const electron = lock.packages?.["node_modules/electron"];
  const internalExtractor =
    lock.packages?.["node_modules/@electron-internal/extract-zip"];

  assert.ok(electron, "package-lock must contain Electron");
  assert.ok(
    Number.parseInt(electron.version, 10) >= 43,
    `Electron ${electron.version} is older than the supported safe baseline`,
  );
  assert.equal(electron.dependencies?.["extract-zip"], undefined);
  assert.match(
    electron.dependencies?.["@electron-internal/extract-zip"] ?? "",
    /^\^1\./u,
  );
  assert.ok(internalExtractor, "maintained Electron extractor must be locked");
  assert.equal(
    lock.packages?.["node_modules/extract-zip"],
    undefined,
    "GHSA-jmr9-qjv8-65gv vulnerable package must stay out of the lockfile",
  );
  assert.equal(
    packageJson.allowScripts?.[`electron@${electron.version}`],
    true,
    "Electron install script allowlist must match the locked version",
  );
});

test("the standard check audits development dependencies for high severity issues", () => {
  const packageJson = readJson("package.json");
  assert.equal(
    packageJson.scripts?.["audit:dependencies"],
    "npm audit --audit-level=high",
  );
  assert.match(packageJson.scripts?.check ?? "", /npm run audit:dependencies/u);
  assert.doesNotMatch(packageJson.scripts?.check ?? "", /audit:production/u);
});
