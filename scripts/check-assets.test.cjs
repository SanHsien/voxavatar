"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
  readAssetContract,
  validateAssets,
} = require("./check-assets.cjs");

function createFixture(context) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "voxavatar-assets-"));
  const assetRoot = path.join(root, "assets");
  fs.mkdirSync(assetRoot, { recursive: true });
  const libraryPath = path.join(assetRoot, "library.json");
  const manifestPath = path.join(assetRoot, "manifest.json");
  for (const filename of ["library.json", "manifest.json"]) {
    fs.copyFileSync(
      path.join(__dirname, "..", "public", "assets", filename),
      path.join(assetRoot, filename),
    );
  }
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return { assetRoot, libraryPath, manifestPath };
}

function configureFixtureAssets(fixture) {
  fs.writeFileSync(
    fixture.libraryPath,
    JSON.stringify({
      schema_version: 1,
      default_model_id: "configured-model",
      models: [
        {
          id: "configured-model",
          model_name: "Configured model",
          asset_path: "models/configured.vrm",
        },
      ],
      animations: [
        {
          id: "configured-motion",
          animation_name: "configured-motion",
          animation_description: "A configured motion.",
          animation_trigger_scenario: "Use for asset validation.",
          animation_type: null,
          asset_paths: ["animations/configured.vrma"],
        },
      ],
    }),
  );
  fs.writeFileSync(
    fixture.manifestPath,
    JSON.stringify({
      schemaVersion: 1,
      distributionAllowed: false,
      assets: [
        {
          path: "models/configured.vrm",
          role: "model",
          license: null,
          source: null,
        },
        {
          path: "animations/configured.vrma",
          role: "animation",
          license: null,
          source: null,
        },
      ],
    }),
  );
}

test("development accepts an empty catalog and ignored local media", (context) => {
  assert.deepEqual(validateAssets(), []);
  const fixture = createFixture(context);
  const ignoredMedia = path.join(fixture.assetRoot, "local-only.vrm");
  fs.writeFileSync(ignoredMedia, "untracked local media");
  assert.deepEqual(validateAssets(fixture), []);
});

test("manifest assigns every catalog asset its intended generic role", () => {
  const assetRoot = path.join(__dirname, "..", "public", "assets");
  const manifest = JSON.parse(
    fs.readFileSync(path.join(assetRoot, "manifest.json"), "utf8"),
  );
  const contract = readAssetContract(path.join(assetRoot, "library.json"));
  assert.deepEqual(
    Object.fromEntries(manifest.assets.map((asset) => [asset.path, asset.role])),
    contract.roles,
  );
});

test("example manifest covers every path in the example library", () => {
  const assetRoot = path.join(__dirname, "..", "public", "assets");
  const contract = readAssetContract(
    path.join(assetRoot, "library.json.example"),
  );
  const manifest = JSON.parse(
    fs.readFileSync(path.join(assetRoot, "manifest.json.example"), "utf8"),
  );

  assert.deepEqual(
    manifest.assets.map((asset) => asset.path).sort(),
    contract.paths,
  );
  assert.deepEqual(
    Object.fromEntries(manifest.assets.map((asset) => [asset.path, asset.role])),
    contract.roles,
  );
  assert.equal(manifest.distributionAllowed, false);
});

test("development rejects a partial local media set", (context) => {
  const fixture = createFixture(context);
  configureFixtureAssets(fixture);
  const contract = readAssetContract(fixture.libraryPath);
  const partial = path.join(fixture.assetRoot, contract.paths[0]);
  fs.mkdirSync(path.dirname(partial), { recursive: true });
  fs.writeFileSync(partial, "local test media");
  assert.ok(
    validateAssets(fixture).some((error) =>
      error.includes("Runtime asset files do not match"),
    ),
  );
});

test("test-only assets are rejected by the release gate", (context) => {
  const fixture = createFixture(context);
  configureFixtureAssets(fixture);
  const errors = validateAssets({ ...fixture, release: true });
  assert.ok(errors.some((error) => error.includes("distribution is disabled")));
});
