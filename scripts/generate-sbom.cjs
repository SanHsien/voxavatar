"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const PACKAGE_JSON = path.join(ROOT, "package.json");
const PACKAGE_LOCK = path.join(ROOT, "package-lock.json");
const DEFAULT_OUTPUT = path.join(ROOT, "release", "sbom.json");

function packageNameFromLockPath(lockPath) {
  const segments = lockPath.split("node_modules/");
  return segments[segments.length - 1];
}

function collectProductionPackages(lockData, productionRoots) {
  const packages = lockData.packages ?? {};
  const nameToPath = new Map();

  for (const lockPath of Object.keys(packages)) {
    if (!lockPath || lockPath === "") continue;
    nameToPath.set(packageNameFromLockPath(lockPath), lockPath);
  }

  const included = new Set();
  const queue = [...productionRoots];

  while (queue.length > 0) {
    const name = queue.shift();
    if (included.has(name)) continue;

    const lockPath = nameToPath.get(name);
    if (!lockPath) continue;

    const meta = packages[lockPath];
    if (meta?.dev) continue;

    included.add(name);

    const dependencies = meta?.dependencies ?? {};
    for (const dependencyName of Object.keys(dependencies)) {
      queue.push(dependencyName);
    }
  }

  return [...included]
    .sort((left, right) => left.localeCompare(right))
    .map((name) => {
      const lockPath = nameToPath.get(name);
      const meta = packages[lockPath] ?? {};
      return {
        name,
        version: meta.version ?? null,
        license: meta.license ?? null,
        resolved: meta.resolved ?? null,
        integrity: meta.integrity ?? null,
      };
    });
}

function buildSbom(packageJson, components) {
  return {
    bomFormat: "VoxAvatar-SBOM",
    specVersion: "1.0",
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      component: {
        name: packageJson.name,
        version: packageJson.version,
        type: "application",
      },
    },
    components,
  };
}

function parseArgs(argv) {
  const outputIndex = argv.indexOf("--output");
  if (outputIndex === -1) {
    return { outputPath: DEFAULT_OUTPUT };
  }

  const outputPath = argv[outputIndex + 1];
  if (!outputPath) {
    throw new Error("--output requires a file path.");
  }

  return { outputPath: path.resolve(outputPath) };
}

function generateSbom(options = {}) {
  const outputPath = options.outputPath ?? DEFAULT_OUTPUT;
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, "utf8"));
  const lockData = JSON.parse(fs.readFileSync(PACKAGE_LOCK, "utf8"));
  const productionRoots = Object.keys(packageJson.dependencies ?? {});
  const components = collectProductionPackages(lockData, productionRoots);
  const sbom = buildSbom(packageJson, components);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(sbom, null, 2)}\n`, "utf8");

  return { outputPath, componentCount: components.length, sbom };
}

if (require.main === module) {
  try {
    const { outputPath } = parseArgs(process.argv.slice(2));
    const result = generateSbom({ outputPath });
    console.log(
      `Wrote ${result.componentCount} production components to ${path.relative(ROOT, result.outputPath)}`,
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

module.exports = {
  buildSbom,
  collectProductionPackages,
  generateSbom,
  packageNameFromLockPath,
};
