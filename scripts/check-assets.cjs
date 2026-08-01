"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { readPackagedLibrary } = require("../electron/library-catalog.cjs");

const PROJECT_ROOT = path.join(__dirname, "..");
const ASSET_ROOT = path.join(PROJECT_ROOT, "public", "assets");
const LIBRARY_PATH = path.join(ASSET_ROOT, "library.json");
const MANIFEST_PATH = path.join(ASSET_ROOT, "manifest.json");

function listRuntimeAssets(directory = ASSET_ROOT, prefix = "") {
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const relative = path.posix.join(prefix, entry.name);
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) return listRuntimeAssets(absolute, relative);
      return /\.(?:vrm|vrma)$/i.test(entry.name) ? [relative] : [];
    })
    .sort();
}

function readAssetContract(libraryPath = LIBRARY_PATH) {
  const library = readPackagedLibrary(libraryPath);
  const roles = new Map();
  for (const model of library.models) {
    if (roles.has(model.asset_path)) {
      throw new Error(`Packaged asset path is declared more than once: ${model.asset_path}`);
    }
    roles.set(model.asset_path, "model");
  }
  for (const animation of library.animations) {
    for (const assetPath of animation.asset_paths) {
      if (roles.has(assetPath)) {
        throw new Error(`Packaged asset path is declared more than once: ${assetPath}`);
      }
      roles.set(assetPath, "animation");
    }
  }
  return {
    paths: [...roles.keys()].sort(),
    roles: Object.fromEntries(roles),
  };
}

function validateAssets({
  release = false,
  assetRoot = ASSET_ROOT,
  libraryPath = LIBRARY_PATH,
  manifestPath = MANIFEST_PATH,
} = {}) {
  const errors = [];
  let contract;
  let manifest;
  try {
    contract = readAssetContract(libraryPath);
  } catch (error) {
    return [`Cannot read assets/library.json: ${error.message}`];
  }
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (error) {
    return [`Cannot read assets/manifest.json: ${error.message}`];
  }

  const manifestPaths = (manifest.assets ?? []).map((asset) => asset.path).sort();
  const actual = listRuntimeAssets(assetRoot);
  if (JSON.stringify(manifestPaths) !== JSON.stringify(contract.paths)) {
    errors.push("Asset manifest paths do not match the packaged library.");
  }
  for (const asset of manifest.assets ?? []) {
    if (contract.roles[asset.path] !== asset.role) {
      errors.push(`Incorrect asset role for ${asset.path ?? "unknown asset"}.`);
    }
  }
  const someDeclaredMediaPresent = contract.paths.some((assetPath) =>
    actual.includes(assetPath),
  );
  if (
    (release &&
      JSON.stringify(actual) !== JSON.stringify(contract.paths)) ||
    (!release &&
      someDeclaredMediaPresent &&
      contract.paths.some((assetPath) => !actual.includes(assetPath)))
  ) {
    errors.push("Runtime asset files do not match the packaged library.");
  }

  if (someDeclaredMediaPresent || release) {
    for (const relative of contract.paths) {
      const absolute = path.join(assetRoot, relative);
      if (!fs.existsSync(absolute) || fs.statSync(absolute).size === 0) {
        errors.push(`Missing or empty asset: ${relative}`);
      }
    }
  }

  if (release) {
    if (manifest.distributionAllowed !== true) {
      errors.push(
        "Asset distribution is disabled. Replace the test-only files and set distributionAllowed to true.",
      );
    }
    for (const asset of manifest.assets ?? []) {
      if (
        typeof asset.license !== "string" ||
        asset.license.trim() === "" ||
        typeof asset.source !== "string" ||
        asset.source.trim() === "" ||
        asset.source === "local-test-only"
      ) {
        errors.push(`Incomplete release license metadata: ${asset.path ?? "unknown asset"}`);
      }
    }
  }
  return errors;
}

if (require.main === module) {
  const release = process.argv.includes("--release");
  const errors = validateAssets({ release });
  if (errors.length > 0) {
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log(
      release
        ? "VoxAvatar assets are complete and marked for distribution."
        : "VoxAvatar asset contract is valid (local character media may be absent).",
    );
  }
}

module.exports = {
  ASSET_ROOT,
  LIBRARY_PATH,
  MANIFEST_PATH,
  listRuntimeAssets,
  readAssetContract,
  validateAssets,
};
