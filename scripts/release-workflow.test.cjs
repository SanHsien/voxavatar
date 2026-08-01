"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const WORKFLOW_PATH = path.join(
  __dirname,
  "..",
  ".github",
  "workflows",
  "release.yml",
);

test("release workflow accepts trusted main dispatch or matching tip tags", () => {
  const workflow = fs.readFileSync(WORKFLOW_PATH, "utf8");

  assert.match(workflow, /workflow_dispatch:/u);
  assert.match(workflow, /push:\s*\n\s+tags:\s*\n\s+-\s+"v\*"/u);
  assert.match(workflow, /permissions:\s*\n\s+contents: read/u);
  assert.match(workflow, /Require the tag to point at the main tip/u);
  assert.match(workflow, /GITHUB_SHA.*mainSha.*tagSha.*mainSha/u);
  assert.match(
    workflow,
    /github\.event_name == 'workflow_dispatch' && github\.ref == 'refs\/heads\/main'/u,
  );
  assert.match(
    workflow,
    /github\.event_name == 'push' && startsWith\(github\.ref, 'refs\/tags\/v'\)/u,
  );
  assert.equal(
    [
      ...workflow.matchAll(
        /RELEASE_TAG: \$\{\{ github\.event_name == 'workflow_dispatch' && inputs\.tag \|\| github\.ref_name \}\}/gu,
      ),
    ].length,
    3,
  );
  assert.doesNotMatch(workflow, /\$tag\s*=\s*['"]\$\{\{/u);
  assert.doesNotMatch(workflow, /run:.*\$\{\{ inputs\.tag \}\}/u);
  assert.doesNotMatch(workflow, /ref: \$\{\{ inputs\.tag \}\}/u);
  assert.equal([...workflow.matchAll(/ref: \$\{\{ github\.sha \}\}/gu)].length, 2);
  assert.match(workflow, /Recheck the immutable release tag/u);
  assert.match(workflow, /tagSha -ne \$env:GITHUB_SHA/u);
  assert.equal(
    [...workflow.matchAll(/persist-credentials: false/gu)].length,
    3,
  );
  assert.match(
    workflow,
    /publish:[\s\S]*?permissions:\s*\n\s+contents: write/u,
  );
  assert.equal([...workflow.matchAll(/environment: release/gu)].length, 2);
  assert.match(
    workflow,
    /tag_name: \$\{\{ github\.event_name == 'workflow_dispatch' && inputs\.tag \|\| github\.ref_name \}\}/u,
  );
});
