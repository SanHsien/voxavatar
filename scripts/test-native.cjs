"use strict";

const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { resolveNativeHelperPath } = require("../electron/native-process-audio-listener.cjs");

function testNative(platform = process.platform) {
  if (platform !== "win32") {
    throw new Error("VoxAvatar native listener tests are supported only on Windows.");
  }
  const executable = resolveNativeHelperPath({
    platform,
    isPackaged: false,
    projectRoot: path.join(__dirname, ".."),
  });
  const result = spawnSync(executable, ["--self-test"], {
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr || `Native self-test exited with ${result.status}.`);
  }
  const message = JSON.parse(result.stdout.trim());
  if (message.type !== "ready") throw new Error("Native self-test returned an invalid response.");
  console.log(`${message.source} passed.`);
}

if (require.main === module) {
  try {
    testNative();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

module.exports = { testNative };
