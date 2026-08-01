"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
  QUALITY_GATE,
  VERDICT,
  analyzeVrmFile,
  formatMarkdownReport,
  writeMarkdownReport,
} = require("./vrm-quality.cjs");

function packGlb(json, binary = Buffer.alloc(0)) {
  const jsonText = Buffer.from(JSON.stringify(json), "utf8");
  const jsonPadding = (4 - (jsonText.length % 4)) % 4;
  const jsonChunk = Buffer.concat([jsonText, Buffer.alloc(jsonPadding, 0x20)]);
  const binPadding = (4 - (binary.length % 4)) % 4;
  const binChunk = Buffer.concat([binary, Buffer.alloc(binPadding, 0)]);
  const totalLength = 12 + 8 + jsonChunk.length + 8 + binChunk.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]);
}

function buildVrmGlb({
  includeExtension = true,
  includeHumanoid = true,
  includeMesh = true,
  includeExpressions = true,
  triangleVertices = 30,
} = {}) {
  const positions = [];
  for (let i = 0; i < triangleVertices; i += 1) {
    positions.push(i * 0.01, (i % 3) * 0.02, 0);
  }
  const binary = Buffer.from(new Float32Array(positions).buffer);
  const humanBones = includeHumanoid
    ? {
        hips: { node: 0 },
        spine: { node: 1 },
        chest: { node: 2 },
        neck: { node: 3 },
        head: { node: 4 },
        leftUpperArm: { node: 5 },
        rightUpperArm: { node: 6 },
        leftLowerArm: { node: 5 },
        rightLowerArm: { node: 6 },
        leftHand: { node: 5 },
        rightHand: { node: 6 },
        leftUpperLeg: { node: 0 },
        rightUpperLeg: { node: 0 },
      }
    : undefined;

  const extensions = {};
  const extensionsUsed = [];
  if (includeExtension) {
    extensionsUsed.push("VRMC_vrm");
    extensions.VRMC_vrm = {
      specVersion: "1.0",
      humanoid: includeHumanoid ? { humanBones } : {},
      ...(includeExpressions
        ? {
            expressions: {
              preset: { aa: { isBinary: false, morphTargetBinds: [] } },
            },
          }
        : {}),
      lookAt: { type: "bone" },
    };
  }

  return packGlb(
    {
      asset: { version: "2.0", generator: "voxavatar-vrm-quality-test" },
      extensionsUsed,
      extensions,
      scene: 0,
      scenes: [{ nodes: [0] }],
      nodes: [
        { name: "hips", children: [1], mesh: includeMesh ? 0 : undefined },
        { name: "spine", children: [2] },
        { name: "chest", children: [3, 5, 6] },
        { name: "neck", children: [4] },
        { name: "head" },
        { name: "leftUpperArm" },
        { name: "rightUpperArm" },
      ],
      ...(includeMesh
        ? {
            meshes: [
              {
                primitives: [
                  {
                    attributes: { POSITION: 0 },
                    material: 0,
                  },
                ],
              },
            ],
            accessors: [
              {
                bufferView: 0,
                componentType: 5126,
                count: triangleVertices,
                type: "VEC3",
              },
            ],
            bufferViews: [
              { buffer: 0, byteOffset: 0, byteLength: binary.length },
            ],
            buffers: [{ byteLength: binary.length }],
            materials: [{ name: "skin" }],
            textures: [{ source: 0 }],
            images: [{ mimeType: "image/png" }],
          }
        : {
            buffers: [{ byteLength: binary.length }],
          }),
    },
    binary,
  );
}

function writeTempVrm(context, bytes, name = "sample.vrm") {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "voxavatar-vrm-q-"));
  context.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, bytes);
  return { dir, filePath };
}

test("complete VRM scores as keep or mild review", (context) => {
  const { filePath } = writeTempVrm(context, buildVrmGlb());
  const report = analyzeVrmFile(filePath);
  assert.ok(report.score >= 70);
  assert.notEqual(report.verdict, VERDICT.REJECT);
  assert.ok(report.metrics.meshCount >= 1);
  assert.ok(report.metrics.humanoidBoneCount >= 7);
});

test("missing VRM extension is rejected", (context) => {
  const { filePath } = writeTempVrm(
    context,
    buildVrmGlb({ includeExtension: false }),
  );
  const report = analyzeVrmFile(filePath);
  assert.equal(report.verdict, VERDICT.REJECT);
  assert.ok(
    report.issues.some((issue) => issue.code === "missing_vrm_extension"),
  );
});

test("missing humanoid is review or reject", (context) => {
  const { filePath } = writeTempVrm(
    context,
    buildVrmGlb({ includeHumanoid: false }),
  );
  const report = analyzeVrmFile(filePath);
  assert.ok(
    report.verdict === VERDICT.REVIEW || report.verdict === VERDICT.REJECT,
  );
  assert.ok(report.issues.some((issue) => issue.code === "missing_humanoid"));
});

test("broken file is rejected", (context) => {
  const { filePath } = writeTempVrm(context, Buffer.from("not-a-glb"), "bad.vrm");
  const report = analyzeVrmFile(filePath);
  assert.equal(report.verdict, VERDICT.REJECT);
  assert.ok(report.issues.some((issue) => issue.code === "parse_error"));
});

test("markdown report lists reject details and can be written", (context) => {
  const good = writeTempVrm(context, buildVrmGlb(), "good.vrm");
  const bad = writeTempVrm(
    context,
    buildVrmGlb({ includeExtension: false }),
    "bad.vrm",
  );
  const reports = [analyzeVrmFile(good.filePath), analyzeVrmFile(bad.filePath)];
  const markdown = formatMarkdownReport(reports, {
    sourceDir: good.dir,
    gate: QUALITY_GATE.REPORT,
    generatedAt: "2026-08-01T00:00:00.000Z",
  });
  assert.match(markdown, /VoxAvatar VRM 品質報告/);
  assert.match(markdown, /判定門檻/);
  assert.match(markdown, /觀察／淘汰明細/);

  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "voxavatar-vrm-report-"));
  context.after(() => fs.rmSync(outDir, { recursive: true, force: true }));
  const { reportPath } = writeMarkdownReport(reports, {
    reportDir: outDir,
    sourceDir: good.dir,
    gate: QUALITY_GATE.STRICT,
  });
  assert.equal(path.basename(reportPath), "voxavatar-vrm-report.md");
  assert.ok(fs.existsSync(reportPath));
  assert.match(fs.readFileSync(reportPath, "utf8"), /把關模式：`strict`/);
});
