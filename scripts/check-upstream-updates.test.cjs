"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
  UpstreamCheckError,
  collectNewCommits,
  fetchUpstream,
  loadBaseline,
  renderMarkdown,
  writeGithubOutput,
} = require("./check-upstream-updates.cjs");

const UNIT_SEPARATOR = "\u001f";

function sampleBaseline() {
  return {
    repo: "https://example.invalid/upstream.git",
    branch: "main",
    reviewedThrough: "a".repeat(40),
    reviewedDate: "2026-08-10",
  };
}

function withTemporaryDirectory(run) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "voxavatar-upstream-"));
  try {
    return run(directory);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

test("the committed baseline points at the upstream this fork came from", () => {
  const baseline = loadBaseline();

  assert.match(baseline.repo, /xikhar\/persona/u);
  assert.equal(baseline.branch, "main");
  assert.equal(baseline.reviewedThrough.length, 40);
});

test("the baseline watermark matches the one recorded in docs/DECISIONS.md", () => {
  const baseline = loadBaseline();
  const decisions = fs.readFileSync(path.join(__dirname, "..", "docs", "DECISIONS.md"), "utf8");

  // The decision log quotes the short SHA; the baseline stores it in full so an
  // abbreviation cannot resolve to the wrong commit later.
  assert.ok(decisions.includes(baseline.reviewedThrough.slice(0, 7)));
});

test("rejects a baseline that is missing, malformed, or incomplete", () => {
  withTemporaryDirectory((directory) => {
    assert.throws(
      () => loadBaseline(path.join(directory, "missing.json")),
      UpstreamCheckError,
    );

    const malformed = path.join(directory, "malformed.json");
    fs.writeFileSync(malformed, "{", "utf8");
    assert.throws(() => loadBaseline(malformed), /not valid JSON/u);

    const incomplete = path.join(directory, "incomplete.json");
    fs.writeFileSync(incomplete, JSON.stringify({ repo: "x" }), "utf8");
    assert.throws(() => loadBaseline(incomplete), /missing fields/u);
  });
});

test("rejects an abbreviated SHA, which can resolve to the wrong commit", () => {
  withTemporaryDirectory((directory) => {
    const baselinePath = path.join(directory, "baseline.json");
    fs.writeFileSync(
      baselinePath,
      JSON.stringify({ ...sampleBaseline(), reviewedThrough: "152b1b4" }),
      "utf8",
    );

    assert.throws(() => loadBaseline(baselinePath), /full 40-character SHA/u);
  });
});

test("fetches the upstream branch into its own ref instead of a remote", () => {
  const calls = [];
  const git = (args) => {
    calls.push(args);
    return "";
  };

  assert.equal(fetchUpstream(sampleBaseline(), { git }), "refs/upstream-check/main");
  assert.deepEqual(calls[0], [
    "fetch",
    "--quiet",
    "https://example.invalid/upstream.git",
    "+refs/heads/main:refs/upstream-check/main",
  ]);
});

test("lists commits past the watermark with the files each one touched", () => {
  const sha = "b".repeat(40);
  const git = (args) => {
    if (args[0] === "log") {
      return `${sha}${UNIT_SEPARATOR}2026-08-12${UNIT_SEPARATOR}feat: expressions (#50)\n`;
    }
    return "electron/main.cjs\nsrc/App.tsx\n";
  };

  const commits = collectNewCommits(sampleBaseline(), "refs/upstream-check/main", { git });

  assert.equal(commits.length, 1);
  assert.equal(commits[0].short, "bbbbbbb");
  assert.equal(commits[0].date, "2026-08-12");
  assert.equal(commits[0].subject, "feat: expressions (#50)");
  assert.deepEqual(commits[0].files, ["electron/main.cjs", "src/App.tsx"]);
});

test("reports a clean upstream and a failed check as different outcomes", () => {
  const clean = renderMarkdown(sampleBaseline(), []);
  const failed = renderMarkdown(sampleBaseline(), [], { checkError: "fetch failed" });

  assert.match(clean, /No new upstream commits/u);
  assert.match(failed, /Check failed/u);
  assert.doesNotMatch(failed, /No new upstream commits/u);
});

test("escapes pipes in subjects and caps the file list", () => {
  const report = renderMarkdown(sampleBaseline(), [{
    sha: "c".repeat(40),
    short: "ccccccc",
    date: "2026-08-17",
    subject: "chore: a | b",
    files: Array.from({ length: 10 }, (unused, index) => `file-${index}.ts`),
  }]);

  assert.match(report, /1 upstream commit\(s\) have not been reviewed/u);
  assert.match(report, /chore: a \\\| b/u);
  assert.match(report, /\+2 more/u);
});

test("writes the status fields the workflow branches on", () => {
  withTemporaryDirectory((directory) => {
    const outputPath = path.join(directory, "github-output");
    fs.writeFileSync(outputPath, "", "utf8");

    writeGithubOutput({
      needsAttention: true,
      checkFailed: false,
      reportPath: "upstream-review-report.md",
      outputPath,
    });

    assert.equal(fs.readFileSync(outputPath, "utf8"), [
      "needs_attention=true",
      "check_failed=false",
      "report_path=upstream-review-report.md",
      "",
    ].join("\n"));
  });
});
