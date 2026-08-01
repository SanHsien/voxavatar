"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
  QUALITY_GATE,
  VERDICT,
  analyzeVrmaFile,
  formatMarkdownReport,
  normalizeQualityGate,
  normalizeReportDir,
  writeMarkdownReport,
} = require("./vrma-quality.cjs");

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

function quatFromAxisAngle(axis, angle) {
  const half = angle / 2;
  const s = Math.sin(half);
  return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(half)];
}

function buildRotationVrma({
  duration = 2.5,
  frames = 51,
  angle = 0.2,
  spike = false,
  loopSeam = false,
  includeHumanoid = true,
  multiBone = true,
} = {}) {
  const times = [];
  for (let i = 0; i < frames; i += 1) {
    times.push((i / (frames - 1)) * duration);
  }

  const boneNodes = multiBone
    ? [
        { name: "hips", node: 0, scale: 0.35 },
        { name: "spine", node: 1, scale: 0.55 },
        { name: "chest", node: 2, scale: 0.45 },
        { name: "head", node: 4, scale: 1 },
        { name: "leftUpperArm", node: 5, scale: 0.4 },
        { name: "rightUpperArm", node: 6, scale: 0.4 },
      ]
    : [{ name: "head", node: 4, scale: 1 }];

  const floats = [...times];
  const accessors = [
    {
      bufferView: 0,
      componentType: 5126,
      count: times.length,
      type: "SCALAR",
      max: [duration],
      min: [0],
    },
  ];
  const bufferViews = [
    { buffer: 0, byteOffset: 0, byteLength: times.length * 4 },
  ];
  const samplers = [];
  const channels = [];

  for (const bone of boneNodes) {
    const rotations = [];
    for (let i = 0; i < frames; i += 1) {
      const u = i / (frames - 1);
      let localAngle = Math.sin(u * Math.PI * 2) * angle * bone.scale;
      if (spike && bone.name === "head" && i === Math.floor(frames / 2)) {
        localAngle = 2.8;
      }
      if (loopSeam && bone.name === "head" && i === frames - 1) {
        localAngle = angle + 1.2;
      }
      const q = quatFromAxisAngle([0, 1, 0], localAngle);
      rotations.push(q[0], q[1], q[2], q[3]);
    }
    const byteOffset = floats.length * 4;
    floats.push(...rotations);
    const viewIndex = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset,
      byteLength: rotations.length * 4,
    });
    const accessorIndex = accessors.length;
    accessors.push({
      bufferView: viewIndex,
      componentType: 5126,
      count: times.length,
      type: "VEC4",
    });
    const samplerIndex = samplers.length;
    samplers.push({
      input: 0,
      output: accessorIndex,
      interpolation: "LINEAR",
    });
    channels.push({
      sampler: samplerIndex,
      target: { node: bone.node, path: "rotation" },
    });
  }

  const binary = Buffer.from(new Float32Array(floats).buffer);
  const humanBones = includeHumanoid
    ? {
        hips: { node: 0 },
        spine: { node: 1 },
        chest: { node: 2 },
        neck: { node: 3 },
        head: { node: 4 },
        leftUpperArm: { node: 5 },
        rightUpperArm: { node: 6 },
      }
    : undefined;

  return packGlb(
    {
      asset: { version: "2.0", generator: "voxavatar-vrma-quality-test" },
      extensionsUsed: includeHumanoid ? ["VRMC_vrm_animation"] : [],
      extensions: includeHumanoid
        ? {
            VRMC_vrm_animation: {
              specVersion: "1.0",
              humanoid: { humanBones },
            },
          }
        : {},
      scene: 0,
      scenes: [{ nodes: [0] }],
      nodes: [
        { name: "hips", children: [1] },
        { name: "spine", children: [2] },
        { name: "chest", children: [3, 5, 6] },
        { name: "neck", children: [4] },
        { name: "head" },
        { name: "leftUpperArm" },
        { name: "rightUpperArm" },
      ],
      animations: [{ name: "clip", samplers, channels }],
      accessors,
      bufferViews,
      buffers: [{ byteLength: binary.length }],
    },
    binary,
  );
}

function writeTempVrma(context, bytes, name = "sample.vrma") {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "voxavatar-vrma-q-"));
  context.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, bytes);
  return { dir, filePath };
}

test("normalizeQualityGate defaults to report", () => {
  assert.equal(normalizeQualityGate(undefined), QUALITY_GATE.REPORT);
  assert.equal(normalizeQualityGate("strict"), QUALITY_GATE.STRICT);
  assert.equal(normalizeQualityGate("off"), QUALITY_GATE.OFF);
  assert.equal(normalizeQualityGate("nope"), QUALITY_GATE.REPORT);
});

test("normalizeReportDir resolves absolute paths and blanks to null", () => {
  assert.equal(normalizeReportDir(""), null);
  assert.equal(normalizeReportDir("   "), null);
  assert.equal(normalizeReportDir(null), null);
  const resolved = normalizeReportDir(".");
  assert.equal(resolved, path.resolve("."));
});

test("smooth looping VRMA scores as keep or mild review", (context) => {
  const { filePath } = writeTempVrma(context, buildRotationVrma());
  const report = analyzeVrmaFile(filePath);
  assert.ok(report.score >= 70);
  assert.notEqual(report.verdict, VERDICT.REJECT);
  assert.ok(report.metrics.durationSec > 1);
});

test("velocity spike VRMA is marked review or reject", (context) => {
  const { filePath } = writeTempVrma(
    context,
    buildRotationVrma({ spike: true, angle: 0.15 }),
  );
  const report = analyzeVrmaFile(filePath);
  assert.ok(report.issues.some((issue) => issue.code.startsWith("velocity")));
  assert.ok(
    report.verdict === VERDICT.REVIEW || report.verdict === VERDICT.REJECT,
  );
});

test("broken file is rejected", (context) => {
  const { filePath } = writeTempVrma(context, Buffer.from("not-a-glb"), "bad.vrma");
  const report = analyzeVrmaFile(filePath);
  assert.equal(report.verdict, VERDICT.REJECT);
  assert.ok(report.issues.some((issue) => issue.code === "parse_error"));
});

test("markdown report lists reject details and can be written", (context) => {
  const good = writeTempVrma(context, buildRotationVrma(), "good.vrma");
  const bad = writeTempVrma(
    context,
    buildRotationVrma({ spike: true, loopSeam: true }),
    "bad.vrma",
  );
  const reports = [analyzeVrmaFile(good.filePath), analyzeVrmaFile(bad.filePath)];
  const markdown = formatMarkdownReport(reports, {
    sourceDir: good.dir,
    gate: QUALITY_GATE.REPORT,
    generatedAt: "2026-08-01T00:00:00.000Z",
  });
  assert.match(markdown, /VoxAvatar VRMA 品質報告/);
  assert.match(markdown, /判定門檻/);
  assert.match(markdown, /觀察／淘汰明細/);

  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "voxavatar-report-"));
  context.after(() => fs.rmSync(outDir, { recursive: true, force: true }));
  const { reportPath } = writeMarkdownReport(reports, {
    reportDir: outDir,
    sourceDir: good.dir,
    gate: QUALITY_GATE.STRICT,
  });
  assert.equal(path.basename(reportPath), "voxavatar-vrma-report.md");
  assert.ok(fs.existsSync(reportPath));
  assert.match(fs.readFileSync(reportPath, "utf8"), /把關模式：`strict`/);
});
