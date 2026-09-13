"use strict";

const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { resolveNativeHelperPath } = require("../electron/native-process-audio-listener.cjs");

function parseLastJsonLine(stdout) {
  const lines = String(stdout || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    throw new Error("Native helper produced no JSON output.");
  }
  return JSON.parse(lines[lines.length - 1]);
}

function runHelper(executable, args) {
  return spawnSync(executable, args, {
    encoding: "utf8",
    windowsHide: true,
  });
}

function testNative(platform = process.platform) {
  if (platform !== "win32") {
    throw new Error("VoxAvatar native listener tests are supported only on Windows.");
  }
  const executable = resolveNativeHelperPath({
    platform,
    isPackaged: false,
    projectRoot: path.join(__dirname, ".."),
  });

  const selfTest = runHelper(executable, ["--self-test"]);
  if (selfTest.error) throw selfTest.error;
  if (selfTest.status !== 0) {
    throw new Error(selfTest.stderr || `Native self-test exited with ${selfTest.status}.`);
  }
  const ready = parseLastJsonLine(selfTest.stdout);
  if (ready.type !== "ready") {
    throw new Error("Native self-test returned an invalid response.");
  }
  console.log(`${ready.source} passed.`);

  // Usage=2：無參數啟動應回 typed exit 與 NDJSON code（不需 WASAPI）。
  const usage = runHelper(executable, []);
  if (usage.error) throw usage.error;
  if (usage.status !== 2) {
    throw new Error(
      `Expected usage exit code 2, got ${usage.status}. stdout=${usage.stdout}`,
    );
  }
  const usageMessage = parseLastJsonLine(usage.stdout);
  if (usageMessage.type !== "error" || usageMessage.code !== 2) {
    throw new Error(
      `Expected usage NDJSON error code 2, got ${JSON.stringify(usageMessage)}`,
    );
  }
  console.log("usage exit code 2 passed.");

  // --emit-error：契約測分型 exit／NDJSON（不觸發真實 COM／WASAPI）。
  for (const code of [10, 11, 12, 13]) {
    const emitted = runHelper(executable, ["--emit-error", String(code)]);
    if (emitted.error) throw emitted.error;
    if (emitted.status !== code) {
      throw new Error(
        `Expected --emit-error ${code} exit ${code}, got ${emitted.status}.`,
      );
    }
    const payload = parseLastJsonLine(emitted.stdout);
    if (payload.type !== "error" || payload.code !== code) {
      throw new Error(
        `Expected --emit-error NDJSON code ${code}, got ${JSON.stringify(payload)}`,
      );
    }
  }
  console.log("emit-error 10/11/12/13 passed.");

  const missingPid = runHelper(executable, ["--pid"]);
  if (missingPid.error) throw missingPid.error;
  if (missingPid.status !== 2) {
    throw new Error(`Expected --pid without value to exit 2, got ${missingPid.status}.`);
  }
  console.log("usage --pid without value passed.");
}

if (require.main === module) {
  try {
    testNative();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

module.exports = { testNative, parseLastJsonLine };
