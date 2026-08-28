"use strict";

const nodeCrypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const MAX_ASSET_BYTES = 200 * 1024 * 1024;
const MAX_GLB_JSON_BYTES = 16 * 1024 * 1024;
const GLB_JSON_CHUNK_TYPE = 0x4e4f534a;

function validateGlbFile(filePath, expectedExtension) {
  if (typeof filePath !== "string") throw new Error("No asset file was selected.");
  if (path.extname(filePath).toLowerCase() !== expectedExtension) {
    throw new Error(`Expected a ${expectedExtension} file.`);
  }
  const descriptor = fs.openSync(filePath, "r");
  try {
    const stat = fs.fstatSync(descriptor);
    if (!stat.isFile() || stat.size < 20) {
      throw new Error("Asset file is empty or invalid.");
    }
    if (stat.size > MAX_ASSET_BYTES) {
      throw new Error("Asset file must be 200 MB or smaller.");
    }
    const header = Buffer.alloc(20);
    if (fs.readSync(descriptor, header, 0, header.length, 0) !== header.length) {
      throw new Error("Asset header is incomplete.");
    }
    if (
      header.toString("ascii", 0, 4) !== "glTF" ||
      header.readUInt32LE(4) !== 2
    ) {
      throw new Error("Asset must be a valid VRM/VRMA glTF 2 binary.");
    }
    if (header.readUInt32LE(8) !== stat.size) {
      throw new Error("Asset GLB length does not match the copied file.");
    }
    const jsonLength = header.readUInt32LE(12);
    if (
      jsonLength === 0 ||
      jsonLength % 4 !== 0 ||
      jsonLength > MAX_GLB_JSON_BYTES ||
      jsonLength > stat.size - 20 ||
      header.readUInt32LE(16) !== GLB_JSON_CHUNK_TYPE
    ) {
      throw new Error("Asset must contain a valid bounded GLB JSON chunk.");
    }
    const jsonBuffer = Buffer.alloc(jsonLength);
    if (fs.readSync(descriptor, jsonBuffer, 0, jsonLength, 20) !== jsonLength) {
      throw new Error("Asset GLB JSON chunk is incomplete.");
    }
    let document;
    try {
      document = JSON.parse(jsonBuffer.toString("utf8").trimEnd());
    } catch {
      throw new Error("Asset GLB JSON chunk is invalid.");
    }
    const extensionNames = new Set([
      ...(Array.isArray(document.extensionsUsed) ? document.extensionsUsed : []),
      ...(Array.isArray(document.extensionsRequired)
        ? document.extensionsRequired
        : []),
      ...Object.keys(document.extensions ?? {}),
    ]);
    const expectedNames =
      expectedExtension === ".vrm"
        ? ["VRM", "VRMC_vrm"]
        : ["VRMC_vrm_animation"];
    if (
      document.asset?.version !== "2.0" ||
      !expectedNames.some((name) => extensionNames.has(name))
    ) {
      throw new Error(`Asset does not declare the required ${expectedExtension} extension.`);
    }
  } finally {
    fs.closeSync(descriptor);
  }
}

function copyValidatedGlbFile(sourcePath, destinationPath, expectedExtension) {
  const temporaryPath = `${destinationPath}.import-${nodeCrypto.randomUUID()}${expectedExtension}`;
  try {
    fs.copyFileSync(sourcePath, temporaryPath, fs.constants.COPYFILE_EXCL);
    validateGlbFile(temporaryPath, expectedExtension);
    fs.renameSync(temporaryPath, destinationPath);
  } finally {
    fs.rmSync(temporaryPath, { force: true });
  }
}

module.exports = {
  GLB_JSON_CHUNK_TYPE,
  MAX_ASSET_BYTES,
  MAX_GLB_JSON_BYTES,
  copyValidatedGlbFile,
  validateGlbFile,
};
