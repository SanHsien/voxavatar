"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const nodePerf = require("node:perf_hooks");

const ROOT = path.join(__dirname, "..");
const PACKAGE_JSON = path.join(ROOT, "package.json");
const DEFAULT_OUTPUT = path.join(ROOT, "release", "startup-baseline.json");

/** Node-side modules measured without launching Electron. */
const MODULE_TARGETS = [
  {
    id: "settings-store",
    modulePath: path.join(ROOT, "electron", "settings-store.cjs"),
  },
  {
    id: "mcp-schemas",
    modulePath: path.join(ROOT, "electron", "mcp-schemas.cjs"),
  },
  {
    id: "directory-import",
    modulePath: path.join(ROOT, "electron", "directory-import.cjs"),
  },
  {
    id: "app-readiness",
    modulePath: path.join(ROOT, "electron", "app-readiness.cjs"),
  },
];

function parseArgs(argv) {
  const options = {
    outputPath: DEFAULT_OUTPUT,
    includeBuild: false,
    skipBuild: true,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--output") {
      const outputPath = argv[index + 1];
      if (!outputPath) {
        throw new Error("--output requires a file path.");
      }
      options.outputPath = path.resolve(outputPath);
      index += 1;
      continue;
    }
    if (arg === "--include-build") {
      options.includeBuild = true;
      options.skipBuild = false;
      continue;
    }
    if (arg === "--skip-build") {
      options.skipBuild = true;
      options.includeBuild = false;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function clearModuleFromCache(modulePath) {
  const resolved = require.resolve(modulePath);
  delete require.cache[resolved];
  for (const key of Object.keys(require.cache)) {
    if (key === resolved || key.startsWith(`${resolved}${path.sep}`)) {
      delete require.cache[key];
    }
  }
}

function measureRequire(modulePath) {
  clearModuleFromCache(modulePath);
  const start = nodePerf.performance.now();
  require(modulePath);
  const durationMs = nodePerf.performance.now() - start;
  clearModuleFromCache(modulePath);
  return durationMs;
}

function runBuild(root = ROOT) {
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = spawnSync(npm, ["run", "build"], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`npm run build exited with code ${result.status ?? "unknown"}`);
  }
}

function measureBuild(root = ROOT) {
  const start = nodePerf.performance.now();
  runBuild(root);
  return nodePerf.performance.now() - start;
}

function buildStartupReport({
  appVersion,
  moduleTimings,
  buildTimingMs = null,
}) {
  const requireTotalMs = moduleTimings.reduce(
    (total, entry) => total + entry.durationMs,
    0,
  );

  return {
    format: "VoxAvatar-Startup-Baseline",
    version: 1,
    generatedAt: new Date().toISOString(),
    appVersion: appVersion ?? null,
    scope: "node-main-modules",
    note:
      "Measures Node require() cost for selected main-process modules only; real cold-start, Idle, and memory baselines are planned for v0.9 on Windows.",
    modules: moduleTimings,
    totals: {
      requireTotalMs,
      buildMs: buildTimingMs,
    },
    guidance: {
      notes: [
        "Run on the same machine and Node version for comparable numbers.",
        "Use --include-build to optionally time npm run build (skipped by default).",
        "Electron GUI cold-start and idle memory are out of scope until v0.9 Windows validation.",
      ],
    },
  };
}

function generateStartupBaseline(options = {}) {
  const root = options.root ?? ROOT;
  const outputPath = options.outputPath ?? DEFAULT_OUTPUT;
  const includeBuild = options.includeBuild ?? false;
  const moduleTargets = options.moduleTargets ?? MODULE_TARGETS;

  const moduleTimings = moduleTargets.map((target) => ({
    id: target.id,
    modulePath: path.relative(root, target.modulePath) || target.modulePath,
    durationMs: measureRequire(target.modulePath),
  }));

  let buildTimingMs = null;
  if (includeBuild) {
    buildTimingMs = measureBuild(root);
  }

  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, "utf8"));
  const report = buildStartupReport({
    appVersion: packageJson.version,
    moduleTimings,
    buildTimingMs,
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  return { outputPath, report, moduleCount: moduleTimings.length };
}

if (require.main === module) {
  try {
    const cliOptions = parseArgs(process.argv.slice(2));
    const result = generateStartupBaseline(cliOptions);
    console.log(
      `Wrote startup baseline (${result.moduleCount} modules) to ${path.relative(ROOT, result.outputPath)}`,
    );
    for (const entry of result.report.modules) {
      console.log(`  ${entry.id}: ${entry.durationMs.toFixed(2)} ms`);
    }
    console.log(
      `  require total: ${result.report.totals.requireTotalMs.toFixed(2)} ms`,
    );
    if (result.report.totals.buildMs != null) {
      console.log(`  npm run build: ${result.report.totals.buildMs.toFixed(2)} ms`);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

module.exports = {
  MODULE_TARGETS,
  buildStartupReport,
  clearModuleFromCache,
  generateStartupBaseline,
  measureRequire,
  runBuild,
};
