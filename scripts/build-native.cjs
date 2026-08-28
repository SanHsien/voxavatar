"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { execSync, spawnSync } = require("node:child_process");

const PROJECT_ROOT = path.join(__dirname, "..");

function windowsBuildCommand(developerShell) {
  const compiler = [
    "cl.exe /nologo /std:c++20 /EHsc /O2 /DUNICODE /D_UNICODE",
    "native\\windows\\VoxAvatarAudioListener.cpp",
    "/Fe:native\\bin\\win32\\voxavatar-audio-listener.exe",
  ].join(" ");
  return `call "${developerShell}" -no_logo -arch=x64 -host_arch=x64 && ${compiler}`;
}

function runWindowsBuildCommand(command) {
  try {
    // execSync uses ComSpec on Windows and preserves the nested quotes required
    // to call a batch file whose path contains spaces.
    execSync(command, {
      cwd: PROJECT_ROOT,
      stdio: "inherit",
      windowsHide: true,
    });
  } catch (error) {
    const status = Number.isInteger(error?.status) ? error.status : "unknown";
    throw new Error(`Windows native build failed with exit code ${status}.`, {
      cause: error,
    });
  }
}

function buildNative(platform = process.platform) {
  if (platform !== "win32") {
    throw new Error("VoxAvatar native listener builds are supported only on Windows.");
  }
  const outputDirectory = path.join(PROJECT_ROOT, "native", "bin", "win32");
  fs.mkdirSync(outputDirectory, { recursive: true });
  const installerRoot = process.env["ProgramFiles(x86)"];
  const vswhere = installerRoot
    ? path.join(installerRoot, "Microsoft Visual Studio", "Installer", "vswhere.exe")
    : null;
  if (!vswhere || !fs.existsSync(vswhere)) {
    throw new Error("Visual Studio Build Tools were not found.");
  }
  const discovery = spawnSync(
    vswhere,
    ["-latest", "-products", "*", "-requires", "Microsoft.VisualStudio.Component.VC.Tools.x86.x64", "-property", "installationPath"],
    { encoding: "utf8", windowsHide: true },
  );
  const installationPath = discovery.stdout.trim();
  if (discovery.status !== 0 || !installationPath) {
    throw new Error("The Visual C++ x64 build tools were not found.");
  }
  const developerShell = path.join(installationPath, "Common7", "Tools", "VsDevCmd.bat");
  runWindowsBuildCommand(windowsBuildCommand(developerShell));
  return path.join(outputDirectory, "voxavatar-audio-listener.exe");
}

if (require.main === module) {
  try {
    const output = buildNative();
    if (output) console.log(`Built ${output}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

module.exports = { buildNative, windowsBuildCommand };
