"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

function read(path) {
  return fs.readFileSync(path, "utf8");
}

test("Dependabot review executes only trusted base policy", () => {
  const workflow = read(".github/workflows/dependabot-review.yml");
  assert.match(workflow, /pull_request_target:/u);
  assert.match(workflow, /dependabot\[bot\]/u);
  assert.match(workflow, /github\.event\.pull_request\.base\.sha/u);
  assert.match(workflow, /persist-credentials: false/u);
  assert.match(workflow, /actions: write/u);
  assert.match(workflow, /issues: write/u);
  assert.match(workflow, /Dependabot policy/u);
});

test("guarded merge requires queue, head-bound policy, CI, CodeQL, and head match", () => {
  const workflow = read(".github/workflows/dependabot-merge.yml");
  assert.match(workflow, /group: dependabot-merge-queue/u);
  assert.match(workflow, /GH_REPO: \$\{\{ github\.repository \}\}/u);
  assert.match(workflow, /--author app\/dependabot/u);
  assert.match(workflow, /Test on Windows x64/u);
  assert.match(workflow, /Analyze JavaScript and TypeScript/u);
  assert.match(workflow, /issues: write/u);
  assert.match(workflow, /app\.slug == "github-actions"/u);
  assert.match(workflow, /--match-head-commit/u);
});
