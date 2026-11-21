"use strict";

/**
 * `VoxAvatar.exe --quit` asks the running instance to exit cleanly. The NSIS
 * installer and uninstaller use it before they fall back to a forced kill:
 * after a forced kill the app's processes can stay listed, and keep their
 * files locked, for over a minute on a busy machine (2026-11-21 acceptance).
 */
const QUIT_ARGUMENT = "--quit";

function isQuitRequest(argv, protocolScheme = "voxavatar") {
  if (!Array.isArray(argv)) return false;
  const args = argv.slice(1).filter((value) => typeof value === "string");
  // A protocol launch passes text chosen by whoever wrote the link; it must
  // never be able to close the app.
  const prefix = `${protocolScheme}:`.toLowerCase();
  if (args.some((value) => value.toLowerCase().startsWith(prefix))) return false;
  return args.includes(QUIT_ARGUMENT);
}

module.exports = { QUIT_ARGUMENT, isQuitRequest };
