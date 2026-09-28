"use strict";

const nodeCrypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const RELEASE_EXTENSIONS = new Set([".exe"]);

function releaseFiles(directory) {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && RELEASE_EXTENSIONS.has(path.extname(entry.name)))
    .map((entry) => entry.name)
    .sort();
}

function writeChecksums(directory) {
  const files = releaseFiles(directory);
  if (files.length === 0) throw new Error(`No VoxAvatar release files found in ${directory}`);
  const lines = files.map((filename) => {
    const contents = fs.readFileSync(path.join(directory, filename));
    const digest = nodeCrypto.createHash("sha256").update(contents).digest("hex");
    return `${digest}  ${filename}`;
  });
  const output = path.join(directory, "SHA256SUMS.txt");
  fs.writeFileSync(output, `${lines.join("\n")}\n`);
  return output;
}

if (require.main === module) {
  try {
    const directory = path.resolve(process.argv[2] || "release");
    console.log(`Wrote ${writeChecksums(directory)}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

module.exports = { RELEASE_EXTENSIONS, releaseFiles, writeChecksums };
