"use strict";

// Contract tests for the upstream pull-request and issue axes. Each one names a
// way those axes could go quiet without anybody deciding to stop watching
// upstream. No test reaches the network: `gh` is always injected.

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  collectNewTickets,
  renderTicketMarkdown,
  upstreamSlug,
} = require("./check-upstream-updates.cjs");

function baselineWith(overrides = {}) {
  return {
    repo: "https://github.com/example/product.git",
    branch: "main",
    reviewedThrough: "a".repeat(40),
    reviewedDate: "2026-08-29",
    reviewedPrThrough: 9,
    reviewedIssueThrough: 8,
    ...overrides,
  };
}

function fakeGh(payload) {
  const calls = [];
  const gh = (args) => {
    calls.push(args);
    return typeof payload === "string" ? payload : JSON.stringify(payload);
  };
  gh.calls = calls;
  return gh;
}

test("tickets are queried with --state all", () => {
  // An item opened and closed between two runs was still never triaged here,
  // and a pull request closed without merging never reaches the commit axis.
  const gh = fakeGh([{ number: 10, title: "closed without merging" }]);

  collectNewTickets(baselineWith(), "pr", { gh });

  const args = gh.calls[0];
  assert.equal(args[args.indexOf("--state") + 1], "all");
});

test("items at or below the reviewed number are not re-reported", () => {
  const gh = fakeGh([
    { number: 9, title: "already triaged" },
    { number: 11, title: "new" },
  ]);

  const tickets = collectNewTickets(baselineWith(), "pr", { gh });

  assert.deepEqual(
    tickets.map((ticket) => ticket.number),
    [11],
  );
});

test("a gh failure reports unchecked rather than empty", () => {
  // null, not []: "not checked" must never render as "nothing to review".
  const tickets = collectNewTickets(baselineWith(), "issue", { gh: () => null });

  assert.equal(tickets, null);
});

test("unparseable gh output reports unchecked rather than empty", () => {
  const tickets = collectNewTickets(baselineWith(), "pr", { gh: () => "not json" });

  assert.equal(tickets, null);
});

test("a baseline that names no GitHub repository reports unchecked", () => {
  const tickets = collectNewTickets(
    baselineWith({ repo: "https://gitlab.com/example/product.git" }),
    "pr",
    { gh: fakeGh([]) },
  );

  assert.equal(tickets, null);
});

test("the report says so when tickets could not be enumerated", () => {
  const report = renderTicketMarkdown(baselineWith(), null, null);

  assert.match(report, /Not checked/);
});

test("the report covers both ticket axes and states each reviewed number", () => {
  const report = renderTicketMarkdown(baselineWith(), [], []);

  assert.match(report, /## Upstream pull requests/);
  assert.match(report, /## Upstream issues/);
  assert.match(report, /`#9`/);
  assert.match(report, /`#8`/);
});

test("upstreamSlug accepts the URL shapes git actually produces", () => {
  assert.equal(upstreamSlug("https://github.com/example/product.git"), "example/product");
  assert.equal(upstreamSlug("https://github.com/example/product"), "example/product");
  assert.equal(upstreamSlug("git@github.com:example/product.git"), "example/product");
  assert.equal(upstreamSlug("https://gitlab.com/example/product.git"), null);
});

test("the shipped baseline carries both ticket numbers", () => {
  // Recorded numbers that nothing reads are not a check; this pins that they
  // are present and numeric, which is what the collector consumes.
  const { loadBaseline } = require("./check-upstream-updates.cjs");
  const baseline = loadBaseline();

  assert.equal(typeof baseline.reviewedPrThrough, "number");
  assert.equal(typeof baseline.reviewedIssueThrough, "number");
});
