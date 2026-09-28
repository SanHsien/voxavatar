"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  buildSbom,
  collectProductionPackages,
  packageNameFromLockPath,
} = require("./generate-sbom.cjs");

test("packageNameFromLockPath extracts scoped and unscoped names", () => {
  assert.equal(
    packageNameFromLockPath("node_modules/@modelcontextprotocol/sdk"),
    "@modelcontextprotocol/sdk",
  );
  assert.equal(packageNameFromLockPath("node_modules/zod"), "zod");
  assert.equal(
    packageNameFromLockPath("node_modules/foo/node_modules/bar"),
    "bar",
  );
});

test("collectProductionPackages includes runtime deps and excludes dev-only packages", () => {
  const lockData = {
    packages: {
      "": {
        dependencies: {
          alpha: "^1.0.0",
        },
      },
      "node_modules/alpha": {
        version: "1.0.0",
        dependencies: {
          beta: "^2.0.0",
        },
      },
      "node_modules/beta": {
        version: "2.0.0",
      },
      "node_modules/vite": {
        version: "7.0.0",
        dev: true,
      },
    },
  };

  const components = collectProductionPackages(lockData, ["alpha"]);
  assert.deepEqual(
    components.map((component) => component.name),
    ["alpha", "beta"],
  );
  assert.equal(components.find((component) => component.name === "alpha")?.version, "1.0.0");
});

test("buildSbom wraps components with app metadata", () => {
  const sbom = buildSbom({ name: "voxavatar", version: "0.2.9" }, [
    { name: "zod", version: "4.4.3", license: "MIT", resolved: null, integrity: null },
  ]);

  assert.equal(sbom.bomFormat, "VoxAvatar-SBOM");
  assert.equal(sbom.metadata.component.name, "voxavatar");
  assert.equal(sbom.metadata.component.version, "0.2.9");
  assert.equal(sbom.components.length, 1);
  assert.match(sbom.metadata.timestamp, /^\d{4}-\d{2}-\d{2}T/);
});
