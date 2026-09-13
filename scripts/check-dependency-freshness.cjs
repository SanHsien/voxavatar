"use strict";

// Dependabot proposes upgrades one pull request at a time. It cannot answer the
// question a monthly review actually asks: across every direct dependency, how
// much is behind, and is anything vulnerable? This runs `npm outdated` and
// `npm audit` over the declared dependencies and renders one report.
//
// It reads; it never installs, edits a manifest, or merges anything.
//
//     node scripts/check-dependency-freshness.cjs --github-output --output report.md

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const REPO_ROOT = path.join(__dirname, "..");
const EMPTY_AUDIT = Object.freeze({
  info: 0,
  low: 0,
  moderate: 0,
  high: 0,
  critical: 0,
  total: 0,
});

function normalizeOutdated(outdated = {}) {
  return Object.entries(outdated)
    .map(([name, details]) => ({
      name,
      type: details.type ?? "unknown",
      current: details.current ?? "unknown",
      wanted: details.wanted ?? "unknown",
      latest: details.latest ?? "unknown",
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function normalizeAudit(audit = {}) {
  const counts = audit.metadata?.vulnerabilities ?? {};
  return Object.fromEntries(
    Object.keys(EMPTY_AUDIT).map((severity) => [severity, Number(counts[severity] ?? 0)]),
  );
}

const RELEASE_PATTERN = /^\d+(?:\.\d+)*/u;

function releaseKey(version) {
  const match = RELEASE_PATTERN.exec(String(version).trim());
  return match ? match[0].split(".").map(Number) : null;
}

function isNewer(candidate, reference) {
  const left = releaseKey(candidate);
  const right = releaseKey(reference);
  if (!left || !right) return false;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const a = left[index] ?? 0;
    const b = right[index] ?? 0;
    if (a !== b) return a > b;
  }
  return false;
}

const DEFERRALS_PATH = path.join(REPO_ROOT, ".github", "dependency-deferrals.json");

function loadDeferrals(deferralsPath = DEFERRALS_PATH) {
  try {
    return JSON.parse(fs.readFileSync(deferralsPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}

/**
 * Attach an approved deferral to the row it was approved for.
 *
 * A deferral names the exact version it was judged against. When upstream
 * publishes something newer the deferral stops applying and the row reappears,
 * so "we looked at this and decided not yet" cannot quietly become "we stopped
 * looking".
 */
function applyDeferrals(rows, deferrals = {}) {
  return rows.map((row) => {
    const deferral = deferrals[row.name];
    const applies = Boolean(
      deferral
        && typeof deferral.reason === "string"
        && deferral.reason.trim()
        && deferral.deferredLatest === row.latest
        && row.current === row.wanted,
    );
    return applies ? { ...row, deferredReason: deferral.reason } : row;
  });
}

function statusFor({
  current, wanted, latest, deferredReason,
}) {
  if (current !== wanted) {
    return wanted === latest
      ? "In-range update available"
      : "In-range update, newer major to assess";
  }
  if (current === latest) return "OK";
  if (deferredReason) return "Deferred by review";
  // A pinned pre-release or a since-unpublished version can leave the installed
  // copy ahead of the dist-tag. That is not maintenance work, so it must not be
  // reported as such.
  return isNewer(latest, current) ? "Newer release to assess" : "Ahead of dist-tag latest";
}

const QUIET_STATUSES = new Set(["OK", "Ahead of dist-tag latest", "Deferred by review"]);

function needsMaintenance(row) {
  return !QUIET_STATUSES.has(statusFor(row));
}

function runNpm(args, { cwd = REPO_ROOT } = {}) {
  // On Windows npm is a shim, not an executable; spawning it directly fails with
  // EINVAL under the default shell:false.
  const isWindows = process.platform === "win32";
  const command = isWindows ? (process.env.ComSpec ?? "cmd.exe") : "npm";
  const commandArgs = isWindows ? ["/d", "/s", "/c", `npm ${args.join(" ")}`] : args;
  return spawnSync(command, commandArgs, { cwd, encoding: "utf8" });
}

function checkDependencies({ cwd = REPO_ROOT, npm = runNpm } = {}) {
  // `npm outdated` exits 1 when anything is outdated and `npm audit` exits 1 when
  // it finds a vulnerability. Both are results, not failures.
  const outdatedResult = npm(["outdated", "--json", "--long", "--all=false"], { cwd });
  const auditResult = npm(["audit", "--json"], { cwd });
  const errors = [];
  let rows = [];
  let audit = { ...EMPTY_AUDIT };

  if (![0, 1].includes(outdatedResult.status)) {
    errors.push(
      (
        outdatedResult.stderr
        || outdatedResult.error?.message
        || `npm outdated exited ${outdatedResult.status}`
      ).trim(),
    );
  } else {
    try {
      rows = normalizeOutdated(
        outdatedResult.stdout.trim() ? JSON.parse(outdatedResult.stdout) : {},
      );
    } catch (error) {
      errors.push(`Cannot parse npm outdated: ${error.message}`);
    }
  }

  if (![0, 1].includes(auditResult.status)) {
    errors.push(
      (
        auditResult.stderr
        || auditResult.error?.message
        || `npm audit exited ${auditResult.status}`
      ).trim(),
    );
  } else {
    try {
      audit = normalizeAudit(JSON.parse(auditResult.stdout));
    } catch (error) {
      errors.push(`Cannot parse npm audit: ${error.message}`);
    }
  }

  return { rows, audit, checkError: errors.join("; ") };
}

function renderMarkdown(rows, { audit = EMPTY_AUDIT, checkError = "" } = {}) {
  const lines = [
    "# VoxAvatar dependency freshness",
    "",
    "| Package | Type | Installed | In-range | Latest | Status |",
    "| --- | --- | --- | --- | --- | --- |",
  ];

  for (const row of rows) {
    const status = row.deferredReason
      ? `Deferred by review: ${row.deferredReason}`
      : statusFor(row);
    lines.push(
      `| \`${row.name}\` | \`${row.type}\` | \`${row.current}\` | \`${row.wanted}\` | `
      + `\`${row.latest}\` | ${status} |`,
    );
  }
  if (rows.length === 0 && !checkError) {
    lines.push("| — | — | — | — | — | Everything is current |");
  }

  lines.push(
    "",
    "## npm audit",
    "",
    "| Info | Low | Moderate | High | Critical | Total |",
    "| --- | --- | --- | --- | --- | --- |",
    `| ${audit.info} | ${audit.low} | ${audit.moderate} | ${audit.high} | ${audit.critical} `
    + `| ${audit.total} |`,
  );

  if (checkError) {
    lines.push("", `> Check failed: ${checkError}`);
  }

  lines.push(
    "",
    "In-range updates are Dependabot's job. A newer major needs the release notes,",
    "`npm run check`, and a real Windows run of the packaged app before it lands --",
    "Electron, three.js, and the VRM stack all break in ways CI cannot see.",
    "",
    "Rows marked *Deferred by review* were judged against the exact version shown in",
    "`.github/dependency-deferrals.json`. Publish anything newer and they come back.",
    "",
  );
  return `${lines.join("\n")}\n`;
}

function writeGithubOutput({
  needsAttention,
  checkFailed,
  reportPath,
  outputPath = process.env.GITHUB_OUTPUT,
}) {
  if (!outputPath) return;
  fs.appendFileSync(
    outputPath,
    [
      `needs_attention=${needsAttention ? "true" : "false"}`,
      `check_failed=${checkFailed ? "true" : "false"}`,
      `report_path=${reportPath}`,
      "",
    ].join("\n"),
    "utf8",
  );
}

function parseArgs(args) {
  const options = { output: "dependency-freshness-report.md", githubOutput: false };
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--github-output") {
      options.githubOutput = true;
    } else if (args[index] === "--output" && args[index + 1]) {
      options.output = args[index + 1];
      index += 1;
    }
  }
  return options;
}

function main(args = process.argv.slice(2)) {
  const options = parseArgs(args);
  const { rows: rawRows, audit, checkError } = checkDependencies();
  const rows = applyDeferrals(rawRows, loadDeferrals());
  const report = renderMarkdown(rows, { audit, checkError });
  fs.writeFileSync(options.output, report, "utf8");
  process.stdout.write(report);

  if (options.githubOutput) {
    writeGithubOutput({
      needsAttention: rows.some(needsMaintenance) || audit.total > 0 || Boolean(checkError),
      checkFailed: Boolean(checkError),
      reportPath: options.output,
    });
  }
  return 0;
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  EMPTY_AUDIT,
  applyDeferrals,
  checkDependencies,
  isNewer,
  loadDeferrals,
  needsMaintenance,
  normalizeAudit,
  normalizeOutdated,
  renderMarkdown,
  statusFor,
  writeGithubOutput,
  main,
};
