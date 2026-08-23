"use strict";

/**
 * Fail fast when `node_modules/electron` is present but unusable.
 *
 * npm can finish `npm ci` with exit code 0 and leave `node_modules/electron/dist`
 * holding only license files -- no binary, no `path.txt`. The install looks
 * clean, and the first sign of trouble is `npm run dev` failing with a message
 * about something else entirely. Upstream recorded the Node >= 24.16.0 case in
 * xikhar/persona#36; the silent shape is not specific to that version or to
 * macOS, so the guard checks the invariant rather than the version.
 *
 * Runs as `predev` / `prestart`. It only reports: it never installs or repairs,
 * because guessing at a repair is how a broken tree becomes a stranger one.
 */

const { existsSync, readFileSync } = require("node:fs");
const path = require("node:path");

const ELECTRON_ROOT = path.join(__dirname, "..", "node_modules", "electron");

/**
 * @returns {string|null} the problem, or null when the install looks usable.
 */
function describeElectronInstallProblem(root = ELECTRON_ROOT) {
  if (!existsSync(root)) {
    return `${path.relative(process.cwd(), root)} is missing. Run \`npm ci\`.`;
  }

  const pathFile = path.join(root, "path.txt");
  if (!existsSync(pathFile)) {
    return [
      `${path.relative(process.cwd(), pathFile)} is missing, so the Electron`,
      "package was unpacked without its binary. npm reports success in this",
      "state (see xikhar/persona#36), so nothing warned you.",
      "Fix: delete node_modules/electron and run `npm ci` again.",
    ].join(" ");
  }

  const relativeBinary = readFileSync(pathFile, "utf8").trim();
  if (!relativeBinary) {
    return `${path.relative(process.cwd(), pathFile)} is empty. Reinstall Electron.`;
  }

  const binary = path.join(root, "dist", relativeBinary);
  if (!existsSync(binary)) {
    return [
      `path.txt names \`${relativeBinary}\`, but`,
      `${path.relative(process.cwd(), binary)} does not exist.`,
      "The Electron download was incomplete.",
      "Fix: delete node_modules/electron and run `npm ci` again.",
    ].join(" ");
  }

  return null;
}

function main() {
  const problem = describeElectronInstallProblem();
  if (!problem) return 0;
  process.stderr.write(`Electron install check failed: ${problem}\n`);
  return 1;
}

module.exports = { describeElectronInstallProblem, ELECTRON_ROOT };

if (require.main === module) {
  process.exit(main());
}
