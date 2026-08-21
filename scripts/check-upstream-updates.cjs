"use strict";

// This fork tracks xikhar/persona by watermark: docs/DECISIONS.md §1 records the
// last upstream commit that was evaluated, and everything after it is unreviewed.
// Keeping that honest used to depend on someone remembering to fetch. This lists
// the commits past the watermark so a schedule can ask instead.
//
//     node scripts/check-upstream-updates.cjs --strict --output report.md

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const REPO_ROOT = path.join(__dirname, "..");
const BASELINE_PATH = path.join(__dirname, "upstream-baseline.json");
const UPSTREAM_REF_PREFIX = "refs/upstream-check";
const REQUIRED_FIELDS = ["repo", "branch", "reviewedThrough", "reviewedDate"];
const FULL_SHA_LENGTH = 40;
const MAX_LISTED_FILES = 8;
const UNIT_SEPARATOR = "\u001f";

class UpstreamCheckError extends Error {}

function loadBaseline(baselinePath = BASELINE_PATH) {
  let raw;
  try {
    raw = fs.readFileSync(baselinePath, "utf8");
  } catch (error) {
    throw new UpstreamCheckError(`Cannot read the baseline: ${error.message}`);
  }

  let baseline;
  try {
    baseline = JSON.parse(raw);
  } catch (error) {
    throw new UpstreamCheckError(`The baseline is not valid JSON: ${error.message}`);
  }

  const missing = REQUIRED_FIELDS.filter((field) => !baseline[field]);
  if (missing.length > 0) {
    throw new UpstreamCheckError(`The baseline is missing fields: ${missing.join(", ")}`);
  }
  if (String(baseline.reviewedThrough).length !== FULL_SHA_LENGTH) {
    // docs/DECISIONS.md quotes the watermark short, but an abbreviation can
    // resolve to a different commit as upstream grows; the file stores it full.
    throw new UpstreamCheckError("reviewedThrough must be a full 40-character SHA");
  }
  return baseline;
}

function runGit(args, { cwd = REPO_ROOT } = {}) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.error) {
    throw new UpstreamCheckError(`git ${args.join(" ")} could not run: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new UpstreamCheckError(`git ${args.join(" ")} failed: ${(result.stderr || "").trim()}`);
  }
  return result.stdout;
}

function fetchUpstream(baseline, { cwd = REPO_ROOT, git = runGit } = {}) {
  const ref = `${UPSTREAM_REF_PREFIX}/${baseline.branch}`;
  git(["fetch", "--quiet", baseline.repo, `+refs/heads/${baseline.branch}:${ref}`], { cwd });
  return ref;
}

function collectNewCommits(baseline, ref, { cwd = REPO_ROOT, git = runGit } = {}) {
  const raw = git(
    [
      "log",
      "--reverse",
      "--date=short",
      `--format=%H${UNIT_SEPARATOR}%ad${UNIT_SEPARATOR}%s`,
      `${baseline.reviewedThrough}..${ref}`,
    ],
    { cwd },
  );

  return raw
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      const [sha, date, ...subjectParts] = line.split(UNIT_SEPARATOR);
      const files = git(["show", "--name-only", "--format=", sha], { cwd })
        .split("\n")
        .filter((item) => item.trim());
      return {
        sha,
        short: sha.slice(0, 7),
        date,
        subject: subjectParts.join(UNIT_SEPARATOR),
        files,
      };
    });
}

function escapeCell(value) {
  return String(value).replaceAll("|", "\\|");
}

function renderMarkdown(baseline, commits, { checkError = "" } = {}) {
  const lines = [
    "# Upstream review report",
    "",
    `- Upstream: \`${baseline.repo}\` (\`${baseline.branch}\`)`,
    `- Reviewed through: \`${String(baseline.reviewedThrough).slice(0, 7)}\``,
    `- Last review date: ${baseline.reviewedDate}`,
    "",
  ];

  if (checkError) {
    lines.push("## Check failed", "", "```text", checkError, "```", "");
    return `${lines.join("\n")}\n`;
  }

  if (commits.length === 0) {
    lines.push("## Result", "", "No new upstream commits. Nothing to review.", "");
    return `${lines.join("\n")}\n`;
  }

  lines.push(
    "## Result",
    "",
    `${commits.length} upstream commit(s) have not been reviewed.`,
    "",
    "| Commit | Date | Subject | Files |",
    "| --- | --- | --- | --- |",
  );
  for (const commit of commits) {
    const listed = commit.files.slice(0, MAX_LISTED_FILES).map(escapeCell).join("<br>");
    const remainder = commit.files.length - MAX_LISTED_FILES;
    const files = remainder > 0 ? `${listed}<br>… +${remainder} more` : listed;
    lines.push(
      `| \`${commit.short}\` | ${commit.date} | ${escapeCell(commit.subject)} | ${files || "(none)"} |`,
    );
  }
  lines.push(
    "",
    "Judge each commit against this fork's boundaries (Windows-only, local-first,",
    "loopback-only MCP, no microphone), record adopt/reject in `docs/DECISIONS.md` §1,",
    "and only then advance `scripts/upstream-baseline.json`.",
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
  const options = { output: "upstream-review-report.md", githubOutput: false, strict: false };
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--github-output") {
      options.githubOutput = true;
    } else if (args[index] === "--strict") {
      options.strict = true;
    } else if (args[index] === "--output" && args[index + 1]) {
      options.output = args[index + 1];
      index += 1;
    }
  }
  return options;
}

function main(args = process.argv.slice(2)) {
  const options = parseArgs(args);
  let baseline = {
    repo: "unknown",
    branch: "unknown",
    reviewedThrough: "0".repeat(FULL_SHA_LENGTH),
    reviewedDate: "unknown",
  };
  let commits = [];
  let checkError = "";

  try {
    baseline = loadBaseline();
    commits = collectNewCommits(baseline, fetchUpstream(baseline));
  } catch (error) {
    if (!(error instanceof UpstreamCheckError)) throw error;
    checkError = error.message;
  }

  const report = renderMarkdown(baseline, commits, { checkError });
  fs.writeFileSync(options.output, report, "utf8");
  process.stdout.write(report);

  if (options.githubOutput) {
    writeGithubOutput({
      needsAttention: commits.length > 0 || Boolean(checkError),
      checkFailed: Boolean(checkError),
      reportPath: options.output,
    });
  }

  if (checkError) return 2;
  if (options.strict && commits.length > 0) return 1;
  return 0;
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  UpstreamCheckError,
  collectNewCommits,
  fetchUpstream,
  loadBaseline,
  renderMarkdown,
  runGit,
  writeGithubOutput,
  main,
};
