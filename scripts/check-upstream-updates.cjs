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

function upstreamSlug(repoUrl) {
  const match = /github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/.exec(String(repoUrl));
  return match ? `${match[1]}/${match[2]}` : null;
}

// Returns null -- not [] -- when `gh` cannot answer. "Not checked" and "nothing
// to review" look identical in a green report, and only one of them is true;
// conflating them is how a fork stops noticing upstream without anybody
// deciding to.
//
// `--state all` is deliberate: an item opened and closed between two scheduled
// runs was still never triaged here, and a pull request closed *without*
// merging never reaches the commit axis at all -- which is exactly the class of
// "upstream declined it, this fork might still want it".
function collectNewTickets(baseline, kind, { gh = runGh } = {}) {
  const slug = upstreamSlug(baseline.repo);
  if (!slug) return null;
  const field = kind === "pr" ? "reviewedPrThrough" : "reviewedIssueThrough";
  const reviewedThrough = Number(baseline[field] || 0);
  let raw;
  try {
    raw = gh([
      kind,
      "list",
      "--repo",
      slug,
      "--state",
      "all",
      "--limit",
      "1000",
      "--json",
      "number,title",
    ]);
  } catch {
    return null;
  }
  if (raw === null) return null;
  let items;
  try {
    items = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(items)) return null;
  return items
    .filter((item) => Number(item.number) > reviewedThrough)
    .sort((left, right) => Number(left.number) - Number(right.number));
}

function runGh(args) {
  const result = spawnSync("gh", args, { cwd: REPO_ROOT, encoding: "utf8" });
  if (result.error || result.status !== 0) return null;
  return result.stdout;
}

function renderTicketSection(title, reviewedThrough, tickets, kind) {
  const lines = [`## ${title}`, "", `Triaged through \`#${reviewedThrough}\`.`, ""];
  if (tickets === null) {
    lines.push(
      "Not checked: `gh` was unavailable, unauthenticated, or the baseline does",
      'not name a GitHub repository. Reported as such rather than as "nothing to',
      'review" -- the difference matters.',
      "",
    );
    return lines;
  }
  if (tickets.length === 0) {
    lines.push("No new items above that number.", "");
    return lines;
  }
  lines.push(`${tickets.length} new item(s) to triage.`, "", "| Item | Title |", "| --- | --- |");
  for (const ticket of tickets) {
    lines.push(`| #${ticket.number} | ${escapeCell(ticket.title)} |`);
  }
  lines.push(
    "",
    "Record the verdict in `docs/DECISIONS.md`, then raise",
    `\`${kind === "pr" ? "reviewedPrThrough" : "reviewedIssueThrough"}\` so the same`,
    "item is never re-triaged.",
    "",
  );
  return lines;
}

function renderTicketMarkdown(baseline, prs, issues) {
  return [
    ...renderTicketSection("Upstream pull requests", Number(baseline.reviewedPrThrough || 0), prs, "pr"),
    ...renderTicketSection("Upstream issues", Number(baseline.reviewedIssueThrough || 0), issues, "issue"),
  ].join("\n");
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
  let prs = null;
  let issues = null;

  try {
    baseline = loadBaseline();
    commits = collectNewCommits(baseline, fetchUpstream(baseline));
  } catch (error) {
    if (!(error instanceof UpstreamCheckError)) throw error;
    checkError = error.message;
  }

  if (!checkError) {
    // The baseline has carried reviewedPrThrough and reviewedIssueThrough all
    // along with nothing reading them, so those two axes were never "checked
    // and clear" -- they were never checked, and the report was green for the
    // same reason it was green before they existed.
    prs = collectNewTickets(baseline, "pr");
    issues = collectNewTickets(baseline, "issue");
  }

  let report = renderMarkdown(baseline, commits, { checkError });
  if (!checkError) {
    report = `${report.trimEnd()}\n\n${renderTicketMarkdown(baseline, prs, issues)}`;
  }
  fs.writeFileSync(options.output, report, "utf8");
  process.stdout.write(report);

  // Fail closed: a run that could not enumerate tickets must not read as a
  // clean bill of health just because the commit axis was quiet.
  const ticketsUnavailable = !checkError && (prs === null || issues === null);
  const ticketCount = (prs || []).length + (issues || []).length;

  if (options.githubOutput) {
    writeGithubOutput({
      needsAttention:
        commits.length > 0 || ticketCount > 0 || Boolean(checkError) || ticketsUnavailable,
      checkFailed: Boolean(checkError) || ticketsUnavailable,
      reportPath: options.output,
    });
  }

  if (checkError) return 2;
  if (ticketsUnavailable) {
    process.stderr.write("ERROR: gh could not enumerate the upstream pull requests or issues.\n");
    return 2;
  }
  if (options.strict && (commits.length > 0 || ticketCount > 0)) return 1;
  return 0;
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  UpstreamCheckError,
  collectNewCommits,
  collectNewTickets,
  fetchUpstream,
  loadBaseline,
  renderMarkdown,
  renderTicketMarkdown,
  runGit,
  upstreamSlug,
  writeGithubOutput,
  main,
};
