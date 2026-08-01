"use strict";

const fs = require("node:fs");
const path = require("node:path");

const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".tmp-booth",
  "_vendor",
  "coverage",
  "dist",
  "node_modules",
  "release",
]);

function findMarkdownFiles(root) {
  const files = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) continue;
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(fullPath);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
        files.push(fullPath);
      }
    }
  };
  visit(root);
  return files.sort();
}

function displayPath(root, filePath) {
  return path.relative(root, filePath).replaceAll(path.sep, "/");
}

function containsDisallowedControlCharacter(content) {
  return [...content].some((character) => {
    const code = character.codePointAt(0);
    return code <= 8 || code === 11 || code === 12 || (code >= 14 && code <= 31) || code === 127;
  });
}

function localLinkTarget(rawTarget) {
  const target = rawTarget.trim().replace(/^<|>$/g, "");
  if (!target || target.startsWith("#")) return null;
  if (/^[a-z][a-z\d+.-]*:/i.test(target)) return null;
  const withoutFragment = target.split("#", 1)[0];
  if (!withoutFragment) return null;
  try {
    return decodeURIComponent(withoutFragment);
  } catch {
    return withoutFragment;
  }
}

function checkMarkdownTree(root) {
  const errors = [];
  for (const filePath of findMarkdownFiles(root)) {
    const relativePath = displayPath(root, filePath);
    const content = fs.readFileSync(filePath, "utf8");
    if (!content.endsWith("\n")) {
      errors.push(`${relativePath}: must end with a newline`);
    }
    if (containsDisallowedControlCharacter(content)) {
      errors.push(`${relativePath}: contains disallowed control characters`);
    }
    if (/codex\s+mcp\s+add\s+persona\b/iu.test(content)) {
      errors.push(`${relativePath}: uses the retired Codex MCP name persona`);
    }

    const links = content.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/gu);
    for (const match of links) {
      const target = localLinkTarget(match[1]);
      if (!target) continue;
      const resolved = path.resolve(path.dirname(filePath), target);
      if (!fs.existsSync(resolved)) {
        errors.push(`${relativePath}: broken local link ${target}`);
      }
    }
  }
  return errors;
}

if (require.main === module) {
  const errors = checkMarkdownTree(process.cwd());
  if (errors.length > 0) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else {
    console.log("VoxAvatar Markdown files are valid.");
  }
}

module.exports = { checkMarkdownTree, findMarkdownFiles, localLinkTarget };
