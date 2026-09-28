"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
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
} = require("./check-dependency-freshness.cjs");

function fakeNpm(responses) {
  return (args) => responses[args[0]];
}

test("normalizes and sorts npm outdated output", () => {
  const rows = normalizeOutdated({
    three: {
      current: "0.182.0", wanted: "0.182.0", latest: "0.185.1", type: "devDependencies",
    },
    electron: {
      current: "43.4.0", wanted: "43.4.1", latest: "43.4.1", type: "devDependencies",
    },
  });

  assert.deepEqual(rows.map((row) => row.name), ["electron", "three"]);
  assert.equal(rows[0].wanted, "43.4.1");
});

test("missing npm outdated fields degrade to unknown rather than undefined", () => {
  const [row] = normalizeOutdated({ ghost: {} });

  assert.equal(row.current, "unknown");
  assert.equal(row.latest, "unknown");
  assert.equal(row.type, "unknown");
});

test("audit severities default to zero when npm reports none", () => {
  assert.deepEqual(normalizeAudit({}), {
    info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0,
  });
  assert.equal(normalizeAudit({ metadata: { vulnerabilities: { high: 2, total: 2 } } }).high, 2);
});

test("an installed version ahead of the dist-tag is not maintenance work", () => {
  // electron-builder 26.15.7 was installed while the dist-tag said 26.15.3.
  const ahead = { current: "26.15.7", wanted: "26.15.7", latest: "26.15.3" };

  assert.equal(statusFor(ahead), "Ahead of dist-tag latest");
  assert.equal(needsMaintenance(ahead), false);
});

test("statuses separate in-range updates from majors that need judgement", () => {
  assert.equal(
    statusFor({ current: "10.7.7", wanted: "10.7.8", latest: "10.7.8" }),
    "In-range update available",
  );
  assert.equal(
    statusFor({ current: "24.13.3", wanted: "24.13.3", latest: "26.2.0" }),
    "Newer release to assess",
  );
  assert.equal(
    statusFor({ current: "1.0.0", wanted: "1.1.0", latest: "2.0.0" }),
    "In-range update, newer major to assess",
  );
  assert.equal(statusFor({ current: "1.0.0", wanted: "1.0.0", latest: "1.0.0" }), "OK");
});

test("version comparison pads shorter versions instead of guessing", () => {
  assert.equal(isNewer("0.185.1", "0.182.0"), true);
  assert.equal(isNewer("26.15.3", "26.15.7"), false);
  assert.equal(isNewer("7.0", "7"), false);
  assert.equal(isNewer("7.0.1", "7"), true);
  assert.equal(isNewer("unknown", "1.0.0"), false);
});

test("npm exit code 1 is a result, not a failure", () => {
  const { rows, audit, checkError } = checkDependencies({
    npm: fakeNpm({
      outdated: {
        status: 1,
        stdout: JSON.stringify({
          vite: {
            current: "7.3.6", wanted: "7.3.6", latest: "8.2.2", type: "devDependencies",
          },
        }),
        stderr: "",
      },
      audit: {
        status: 1,
        stdout: JSON.stringify({ metadata: { vulnerabilities: { high: 1, total: 1 } } }),
        stderr: "",
      },
    }),
  });

  assert.equal(checkError, "");
  assert.equal(rows.length, 1);
  assert.equal(audit.high, 1);
});

test("a genuine npm failure is reported instead of read as a clean run", () => {
  const { rows, checkError } = checkDependencies({
    npm: fakeNpm({
      outdated: { status: 127, stdout: "", stderr: "npm not found" },
      audit: { status: 0, stdout: "{}", stderr: "" },
    }),
  });

  assert.equal(rows.length, 0);
  assert.match(checkError, /npm not found/u);
});

test("the report states an empty run is clean only when the check succeeded", () => {
  assert.match(renderMarkdown([]), /Everything is current/u);
  assert.doesNotMatch(
    renderMarkdown([], { checkError: "npm not found" }),
    /Everything is current/u,
  );
  assert.match(renderMarkdown([], { checkError: "npm not found" }), /Check failed/u);
});

test("writes the status fields the workflow branches on", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "voxavatar-freshness-"));
  try {
    const outputPath = path.join(directory, "github-output");
    fs.writeFileSync(outputPath, "", "utf8");

    writeGithubOutput({
      needsAttention: true,
      checkFailed: false,
      reportPath: "dependency-freshness-report.md",
      outputPath,
    });

    assert.equal(fs.readFileSync(outputPath, "utf8"), [
      "needs_attention=true",
      "check_failed=false",
      "report_path=dependency-freshness-report.md",
      "",
    ].join("\n"));
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("a deferral applies only to the exact version it was judged against", () => {
  const rows = [
    { name: "typescript", current: "5.9.3", wanted: "5.9.3", latest: "7.0.2" },
    { name: "three", current: "0.182.0", wanted: "0.182.0", latest: "0.186.0" },
  ];
  const deferrals = {
    typescript: { deferredLatest: "7.0.2", reason: "typescript-eslint rejects TS 7.0" },
    three: { deferredLatest: "0.185.1", reason: "needs a desktop verification round" },
  };

  const [typescriptRow, threeRow] = applyDeferrals(rows, deferrals);

  assert.match(typescriptRow.deferredReason, /typescript-eslint/u);
  assert.equal(needsMaintenance(typescriptRow), false);
  // three moved past the version the deferral was approved for, so it comes back.
  assert.equal(threeRow.deferredReason, undefined);
  assert.equal(needsMaintenance(threeRow), true);
});

test("a deferral without a reason is not a deferral", () => {
  const rows = [{ name: "vite", current: "7.3.6", wanted: "7.3.6", latest: "8.2.2" }];

  const [row] = applyDeferrals(rows, { vite: { deferredLatest: "8.2.2", reason: "  " } });

  assert.equal(row.deferredReason, undefined);
  assert.equal(needsMaintenance(row), true);
});

test("a deferral does not hide an in-range update", () => {
  const rows = [{ name: "three", current: "0.182.0", wanted: "0.184.0", latest: "0.185.1" }];

  const [row] = applyDeferrals(rows, {
    three: { deferredLatest: "0.185.1", reason: "needs a desktop verification round" },
  });

  assert.equal(row.deferredReason, undefined);
  assert.equal(needsMaintenance(row), true);
});

test("the committed deferrals name a version and a reason", () => {
  const deferrals = loadDeferrals();

  assert.ok(Object.keys(deferrals).length > 0);
  for (const [name, entry] of Object.entries(deferrals)) {
    assert.equal(typeof entry.deferredLatest, "string", `${name} must record the version judged`);
    assert.ok(entry.reason && entry.reason.trim().length > 20, `${name} must explain itself`);
  }
});

test("a missing deferrals file is not an error", () => {
  assert.deepEqual(loadDeferrals("./no-such-deferrals.json"), {});
});
