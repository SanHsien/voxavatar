"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { checkMarkdownTree } = require("./check-docs.cjs");

function fixture(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "voxavatar-docs-"));
  for (const [relativePath, content] of Object.entries(files)) {
    const target = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
  return root;
}

test("accepts clean Markdown with valid local links", () => {
  const root = fixture({
    "README.md": "# Project\n\nSee [guide](docs/GUIDE.md).\n",
    "docs/GUIDE.md": "# Guide\n",
  });

  assert.deepEqual(checkMarkdownTree(root), []);
});

test("reports broken links, control characters, stale MCP names, and missing newlines", () => {
  const root = fixture({
    "README.md": "# Project\n\n[missing](docs/MISSING.md)\u0007\n",
    "SETUP.md": "codex mcp add persona --url http://127.0.0.1:47831/mcp",
  });

  assert.deepEqual(checkMarkdownTree(root), [
    "README.md: contains disallowed control characters",
    "README.md: broken local link docs/MISSING.md",
    "SETUP.md: must end with a newline",
    "SETUP.md: uses the retired Codex MCP name persona",
  ]);
});
