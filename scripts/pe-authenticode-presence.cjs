"use strict";

/**
 * 讀取 PE 的 Certificate Table（IMAGE_DIRECTORY_ENTRY_SECURITY）。
 * Size=0 → 檔案無 Authenticode 憑證區塊（NotSigned）。
 * 這不是 SmartScreen／publisher 驗收，也不是完整 Authenticode 驗證。
 */

const fs = require("node:fs");

const IMAGE_DIRECTORY_ENTRY_SECURITY = 4;

function readUInt32LE(buffer, offset) {
  if (offset + 4 > buffer.length) {
    throw new Error("PE truncated while reading uint32.");
  }
  return buffer.readUInt32LE(offset);
}

function readUInt16LE(buffer, offset) {
  if (offset + 2 > buffer.length) {
    throw new Error("PE truncated while reading uint16.");
  }
  return buffer.readUInt16LE(offset);
}

/**
 * @param {Buffer} buffer
 * @returns {{
 *   authenticodeStatus: "NotSigned" | "Present",
 *   authenticodeEvidence: string,
 *   certificateTableRva: number,
 *   certificateTableSize: number,
 * }}
 */
function inspectPeAuthenticodePresence(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 64) {
    throw new Error("Buffer is too small to be a PE image.");
  }
  if (buffer[0] !== 0x4d || buffer[1] !== 0x5a) {
    throw new Error("Not a PE image (missing MZ signature).");
  }
  const eLfanew = readUInt32LE(buffer, 0x3c);
  if (eLfanew + 24 > buffer.length) {
    throw new Error("PE header offset is out of range.");
  }
  if (
    buffer[eLfanew] !== 0x50 ||
    buffer[eLfanew + 1] !== 0x45 ||
    buffer[eLfanew + 2] !== 0 ||
    buffer[eLfanew + 3] !== 0
  ) {
    throw new Error("Not a PE image (missing PE signature).");
  }
  const optionalHeaderOffset = eLfanew + 24;
  const magic = readUInt16LE(buffer, optionalHeaderOffset);
  let dataDirectoryOffset;
  if (magic === 0x10b) {
    dataDirectoryOffset = optionalHeaderOffset + 96;
  } else if (magic === 0x20b) {
    dataDirectoryOffset = optionalHeaderOffset + 112;
  } else {
    throw new Error(`Unsupported optional header magic 0x${magic.toString(16)}.`);
  }
  const entryOffset = dataDirectoryOffset + IMAGE_DIRECTORY_ENTRY_SECURITY * 8;
  const certificateTableRva = readUInt32LE(buffer, entryOffset);
  const certificateTableSize = readUInt32LE(buffer, entryOffset + 4);
  if (certificateTableSize === 0) {
    return {
      authenticodeStatus: "NotSigned",
      authenticodeEvidence: "pe-certificate-table-empty",
      certificateTableRva,
      certificateTableSize,
    };
  }
  return {
    authenticodeStatus: "Present",
    authenticodeEvidence: "pe-certificate-table-nonempty",
    certificateTableRva,
    certificateTableSize,
  };
}

function inspectPeAuthenticodePresenceFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  return inspectPeAuthenticodePresence(buffer);
}

/**
 * 組裝最小 PE32 緩衝區（僅供單元測）；可設定 certificate table size。
 */
function buildMinimalPe32Fixture({ certificateTableSize = 0 } = {}) {
  const buffer = Buffer.alloc(512, 0);
  buffer.write("MZ", 0, "ascii");
  buffer.writeUInt32LE(0x80, 0x3c);
  buffer.write("PE\0\0", 0x80, "ascii");
  // COFF: Machine etc. — leave zeros
  // Optional header magic PE32
  buffer.writeUInt16LE(0x10b, 0x80 + 24);
  // NumberOfRvaAndSizes at optional+92 for PE32
  buffer.writeUInt32LE(16, 0x80 + 24 + 92);
  // DataDirectory[4] at optional+96 + 4*8
  const securityOffset = 0x80 + 24 + 96 + IMAGE_DIRECTORY_ENTRY_SECURITY * 8;
  buffer.writeUInt32LE(0, securityOffset);
  buffer.writeUInt32LE(certificateTableSize, securityOffset + 4);
  return buffer;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  try {
    if (args.includes("--help") || args.includes("-h") || args.length === 0) {
      console.log(
        "Usage: node scripts/pe-authenticode-presence.cjs <path-to-pe>\n" +
          "Reports NotSigned when IMAGE_DIRECTORY_ENTRY_SECURITY size is 0.\n" +
          "This is not SmartScreen or publisher validation.",
      );
      process.exitCode = args.length === 0 ? 1 : 0;
    } else {
      const result = inspectPeAuthenticodePresenceFile(args[0]);
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

module.exports = {
  IMAGE_DIRECTORY_ENTRY_SECURITY,
  buildMinimalPe32Fixture,
  inspectPeAuthenticodePresence,
  inspectPeAuthenticodePresenceFile,
};
