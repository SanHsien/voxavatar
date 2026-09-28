"use strict";

/**
 * 產生本專案自製、MIT 可再配布的 Idle VRMA。
 * 比第一版更密的關鍵幀＋更多骨頭／片段；仍非動作捕捉。
 * 輸出：public/assets/animations/idle-*.vrma
 *
 * 重新產生：node scripts/generate-packaged-idle-vrmas.cjs
 */

const fs = require("node:fs");
const path = require("node:path");
const THREE = require("three");

const OUT_DIR = path.join(__dirname, "..", "public", "assets", "animations");
const SAMPLE_FPS = 20;

const BONES = [
  { name: "hips", parent: null },
  { name: "spine", parent: "hips" },
  { name: "chest", parent: "spine" },
  { name: "upperChest", parent: "chest" },
  { name: "neck", parent: "upperChest" },
  { name: "head", parent: "neck" },
  { name: "leftShoulder", parent: "upperChest" },
  { name: "leftUpperArm", parent: "leftShoulder" },
  { name: "leftLowerArm", parent: "leftUpperArm" },
  { name: "leftHand", parent: "leftLowerArm" },
  { name: "rightShoulder", parent: "upperChest" },
  { name: "rightUpperArm", parent: "rightShoulder" },
  { name: "rightLowerArm", parent: "rightUpperArm" },
  { name: "rightHand", parent: "rightLowerArm" },
  { name: "leftUpperLeg", parent: "hips" },
  { name: "leftLowerLeg", parent: "leftUpperLeg" },
  { name: "leftFoot", parent: "leftLowerLeg" },
  { name: "rightUpperLeg", parent: "hips" },
  { name: "rightLowerLeg", parent: "rightUpperLeg" },
  { name: "rightFoot", parent: "rightLowerLeg" },
];

function quatFromEuler(x, y, z) {
  return new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z, "XYZ"));
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpEuler(a, b, t) {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

/** @param {Array<{ u: number, pose: Record<string, [number, number, number]> }>} keys u in 0..1 */
function sampleClip(duration, keys) {
  const sorted = [...keys].sort((a, b) => a.u - b.u);
  const frames = Math.max(2, Math.round(duration * SAMPLE_FPS) + 1);
  /** @type {Record<string, Array<{ t: number, e: [number, number, number] }>>} */
  const tracks = {};
  const boneNames = new Set();
  for (const key of sorted) {
    for (const name of Object.keys(key.pose)) boneNames.add(name);
  }

  for (let i = 0; i < frames; i += 1) {
    const u = i / (frames - 1);
    const t = u * duration;
    let lo = sorted[0];
    let hi = sorted[sorted.length - 1];
    for (let k = 0; k < sorted.length - 1; k += 1) {
      if (u >= sorted[k].u && u <= sorted[k + 1].u) {
        lo = sorted[k];
        hi = sorted[k + 1];
        break;
      }
    }
    const span = Math.max(1e-6, hi.u - lo.u);
    const local = easeInOut((u - lo.u) / span);
    for (const name of boneNames) {
      const a = lo.pose[name] ?? [0, 0, 0];
      const b = hi.pose[name] ?? a;
      if (!tracks[name]) tracks[name] = [];
      tracks[name].push({ t, e: lerpEuler(a, b, local) });
    }
  }
  return tracks;
}

function packGlb(json, binary) {
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

function buildVrma(clipName, tracks) {
  const nameToIndex = new Map(BONES.map((bone, index) => [bone.name, index]));
  const nodes = BONES.map((bone) => ({ name: bone.name }));
  for (const bone of BONES) {
    if (bone.parent == null) continue;
    const parentIndex = nameToIndex.get(bone.parent);
    const childIndex = nameToIndex.get(bone.name);
    if (parentIndex == null || childIndex == null) continue;
    if (!nodes[parentIndex].children) nodes[parentIndex].children = [];
    nodes[parentIndex].children.push(childIndex);
  }

  const humanBones = {};
  for (const [name, index] of nameToIndex) humanBones[name] = { node: index };

  const binFloats = [];
  const accessors = [];
  const bufferViews = [];
  const channels = [];
  const samplers = [];

  for (const [boneName, keys] of Object.entries(tracks)) {
    const nodeIndex = nameToIndex.get(boneName);
    if (nodeIndex == null) throw new Error(`Unknown bone ${boneName}`);
    const times = keys.map((key) => key.t);
    const rotations = [];
    for (const key of keys) {
      const q = quatFromEuler(key.e[0], key.e[1], key.e[2]);
      rotations.push(q.x, q.y, q.z, q.w);
    }

    const timeByteOffset = binFloats.length * 4;
    for (const value of times) binFloats.push(value);
    const timeView = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset: timeByteOffset,
      byteLength: times.length * 4,
    });
    const timeAccessor = accessors.length;
    accessors.push({
      bufferView: timeView,
      componentType: 5126,
      count: times.length,
      type: "SCALAR",
      max: [Math.max(...times)],
      min: [Math.min(...times)],
    });

    const rotByteOffset = binFloats.length * 4;
    for (const value of rotations) binFloats.push(value);
    const rotView = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset: rotByteOffset,
      byteLength: rotations.length * 4,
    });
    const rotAccessor = accessors.length;
    accessors.push({
      bufferView: rotView,
      componentType: 5126,
      count: times.length,
      type: "VEC4",
    });

    const samplerIndex = samplers.length;
    samplers.push({
      input: timeAccessor,
      output: rotAccessor,
      interpolation: "LINEAR",
    });
    channels.push({
      sampler: samplerIndex,
      target: { node: nodeIndex, path: "rotation" },
    });
  }

  const binary = Buffer.from(new Float32Array(binFloats).buffer);
  return packGlb(
    {
      asset: {
        version: "2.0",
        generator: "voxavatar-generate-packaged-idle-vrmas",
      },
      extensionsUsed: ["VRMC_vrm_animation"],
      extensions: {
        VRMC_vrm_animation: {
          specVersion: "1.0",
          humanoid: { humanBones },
        },
      },
      scene: 0,
      scenes: [{ nodes: [0] }],
      nodes,
      animations: [{ name: clipName, channels, samplers }],
      accessors,
      bufferViews,
      buffers: [{ byteLength: binary.length }],
    },
    binary,
  );
}

const REST = {
  hips: [0, 0, 0],
  spine: [0, 0, 0],
  chest: [0, 0, 0],
  upperChest: [0, 0, 0],
  neck: [0, 0, 0],
  head: [0, 0, 0],
  leftShoulder: [0, 0, 0],
  leftUpperArm: [0, 0, 0],
  leftLowerArm: [0, 0, 0],
  leftHand: [0, 0, 0],
  rightShoulder: [0, 0, 0],
  rightUpperArm: [0, 0, 0],
  rightLowerArm: [0, 0, 0],
  rightHand: [0, 0, 0],
  leftUpperLeg: [0, 0, 0],
  leftLowerLeg: [0, 0, 0],
  leftFoot: [0, 0, 0],
  rightUpperLeg: [0, 0, 0],
  rightLowerLeg: [0, 0, 0],
  rightFoot: [0, 0, 0],
};

function pose(overrides) {
  return { ...REST, ...overrides };
}

const CLIPS = [
  {
    file: "idle-look-around.vrma",
    name: "idle-look-around",
    duration: 5.5,
    keys: [
      { u: 0, pose: pose({}) },
      {
        u: 0.2,
        pose: pose({
          head: [0.04, 0.42, 0.02],
          neck: [0.02, 0.14, 0],
          chest: [0, 0.06, 0],
          spine: [0, 0.03, 0],
        }),
      },
      {
        u: 0.45,
        pose: pose({
          head: [0.06, -0.48, -0.02],
          neck: [0.02, -0.16, 0],
          chest: [0, -0.07, 0],
          leftUpperArm: [0.04, 0, 0.05],
          rightUpperArm: [0.04, 0, -0.05],
        }),
      },
      {
        u: 0.7,
        pose: pose({
          head: [-0.1, 0.18, 0],
          neck: [-0.04, 0.06, 0],
          upperChest: [-0.03, 0, 0],
        }),
      },
      { u: 1, pose: pose({}) },
    ],
  },
  {
    file: "idle-wave.vrma",
    name: "idle-wave",
    duration: 3.2,
    keys: [
      { u: 0, pose: pose({}) },
      {
        u: 0.18,
        pose: pose({
          rightShoulder: [0.05, 0, -0.15],
          rightUpperArm: [0.15, 0.05, -1.05],
          rightLowerArm: [0.1, 0, -0.4],
          head: [0, -0.18, 0],
          neck: [0, -0.06, 0],
        }),
      },
      {
        u: 0.35,
        pose: pose({
          rightShoulder: [0.05, 0, -0.18],
          rightUpperArm: [0.2, 0.2, -1.2],
          rightLowerArm: [0.15, 0, -0.65],
          rightHand: [0, 0.1, -0.1],
          head: [0, -0.22, 0],
        }),
      },
      {
        u: 0.52,
        pose: pose({
          rightUpperArm: [0.18, -0.18, -1.1],
          rightLowerArm: [0.12, 0, -0.4],
          head: [0, -0.2, 0],
        }),
      },
      {
        u: 0.68,
        pose: pose({
          rightUpperArm: [0.22, 0.22, -1.22],
          rightLowerArm: [0.15, 0, -0.68],
        }),
      },
      {
        u: 0.85,
        pose: pose({
          rightUpperArm: [0.12, 0, -0.85],
          rightLowerArm: [0.08, 0, -0.3],
          head: [0, -0.1, 0],
        }),
      },
      { u: 1, pose: pose({}) },
    ],
  },
  {
    file: "idle-stretch.vrma",
    name: "idle-stretch",
    duration: 4.2,
    keys: [
      { u: 0, pose: pose({}) },
      {
        u: 0.25,
        pose: pose({
          leftShoulder: [0.08, 0.05, 0.2],
          rightShoulder: [0.08, -0.05, -0.2],
          leftUpperArm: [-0.25, 0.15, 1.25],
          rightUpperArm: [-0.25, -0.15, -1.25],
          leftLowerArm: [-0.15, 0, 0.2],
          rightLowerArm: [-0.15, 0, -0.2],
          chest: [-0.1, 0, 0],
          upperChest: [-0.08, 0, 0],
          head: [-0.22, 0, 0],
          spine: [-0.04, 0, 0],
        }),
      },
      {
        u: 0.55,
        pose: pose({
          leftUpperArm: [-0.3, 0.2, 1.45],
          rightUpperArm: [-0.3, -0.2, -1.45],
          chest: [-0.14, 0, 0],
          head: [-0.28, 0, 0],
          hips: [0.02, 0, 0],
        }),
      },
      {
        u: 0.8,
        pose: pose({
          leftUpperArm: [-0.12, 0.08, 0.7],
          rightUpperArm: [-0.12, -0.08, -0.7],
          head: [-0.08, 0, 0],
        }),
      },
      { u: 1, pose: pose({}) },
    ],
  },
  {
    file: "idle-weight-shift.vrma",
    name: "idle-weight-shift",
    duration: 4.8,
    keys: [
      { u: 0, pose: pose({}) },
      {
        u: 0.22,
        pose: pose({
          hips: [0.02, 0.1, 0.14],
          spine: [0.02, 0.12, 0.08],
          chest: [0, 0.06, 0.04],
          leftUpperLeg: [0.04, 0, 0.06],
          rightUpperLeg: [-0.02, 0, -0.04],
          leftUpperArm: [0.06, 0, 0.1],
          rightUpperArm: [0.06, 0, 0.04],
          head: [0, 0.08, 0.03],
        }),
      },
      {
        u: 0.5,
        pose: pose({
          hips: [0.02, -0.1, -0.14],
          spine: [0.02, -0.12, -0.08],
          chest: [0, -0.06, -0.04],
          leftUpperLeg: [-0.02, 0, 0.04],
          rightUpperLeg: [0.04, 0, -0.06],
          leftUpperArm: [0.06, 0, -0.04],
          rightUpperArm: [0.06, 0, -0.1],
          head: [0, -0.08, -0.03],
        }),
      },
      {
        u: 0.75,
        pose: pose({
          hips: [0.01, 0.07, 0.1],
          spine: [0.01, 0.08, 0.05],
          head: [0, 0.05, 0.02],
        }),
      },
      { u: 1, pose: pose({}) },
    ],
  },
  {
    file: "idle-nod.vrma",
    name: "idle-nod",
    duration: 2.8,
    keys: [
      { u: 0, pose: pose({}) },
      {
        u: 0.2,
        pose: pose({
          head: [0.32, 0, 0],
          neck: [0.12, 0, 0],
          upperChest: [0.04, 0, 0],
        }),
      },
      {
        u: 0.38,
        pose: pose({ head: [-0.06, 0, 0], neck: [-0.02, 0, 0] }),
      },
      {
        u: 0.55,
        pose: pose({
          head: [0.26, 0, 0],
          neck: [0.1, 0, 0],
        }),
      },
      {
        u: 0.72,
        pose: pose({ head: [0.02, 0.04, 0], neck: [0.01, 0.02, 0] }),
      },
      { u: 1, pose: pose({}) },
    ],
  },
  {
    file: "idle-think.vrma",
    name: "idle-think",
    duration: 4.0,
    keys: [
      { u: 0, pose: pose({}) },
      {
        u: 0.3,
        pose: pose({
          rightShoulder: [0.1, -0.05, -0.25],
          rightUpperArm: [0.55, -0.35, -0.85],
          rightLowerArm: [0.9, 0.2, -0.55],
          rightHand: [0.15, 0.25, 0.1],
          head: [0.08, -0.25, 0.05],
          neck: [0.04, -0.1, 0.02],
          chest: [0, -0.05, 0],
        }),
      },
      {
        u: 0.55,
        pose: pose({
          rightUpperArm: [0.58, -0.32, -0.88],
          rightLowerArm: [0.95, 0.22, -0.5],
          head: [0.1, -0.28, 0.04],
          neck: [0.05, -0.12, 0],
        }),
      },
      {
        u: 0.8,
        pose: pose({
          rightUpperArm: [0.35, -0.2, -0.55],
          rightLowerArm: [0.45, 0.1, -0.25],
          head: [0.04, -0.12, 0],
        }),
      },
      { u: 1, pose: pose({}) },
    ],
  },
  {
    file: "idle-shrug.vrma",
    name: "idle-shrug",
    duration: 2.6,
    keys: [
      { u: 0, pose: pose({}) },
      {
        u: 0.35,
        pose: pose({
          leftShoulder: [0.15, 0.1, 0.25],
          rightShoulder: [0.15, -0.1, -0.25],
          leftUpperArm: [0.2, 0.15, 0.55],
          rightUpperArm: [0.2, -0.15, -0.55],
          leftLowerArm: [0.25, 0, 0.15],
          rightLowerArm: [0.25, 0, -0.15],
          head: [0.05, 0, 0],
          neck: [0.03, 0, 0],
          upperChest: [0.04, 0, 0],
        }),
      },
      {
        u: 0.55,
        pose: pose({
          leftShoulder: [0.18, 0.12, 0.28],
          rightShoulder: [0.18, -0.12, -0.28],
          leftUpperArm: [0.22, 0.18, 0.6],
          rightUpperArm: [0.22, -0.18, -0.6],
          head: [0.08, 0, 0],
        }),
      },
      { u: 1, pose: pose({}) },
    ],
  },
  {
    file: "idle-bow-slight.vrma",
    name: "idle-bow-slight",
    duration: 3.4,
    keys: [
      { u: 0, pose: pose({}) },
      {
        u: 0.35,
        pose: pose({
          spine: [0.18, 0, 0],
          chest: [0.22, 0, 0],
          upperChest: [0.12, 0, 0],
          neck: [0.15, 0, 0],
          head: [0.2, 0, 0],
          hips: [0.05, 0, 0],
          leftUpperArm: [0.08, 0, 0.08],
          rightUpperArm: [0.08, 0, -0.08],
        }),
      },
      {
        u: 0.55,
        pose: pose({
          spine: [0.22, 0, 0],
          chest: [0.26, 0, 0],
          head: [0.24, 0, 0],
        }),
      },
      { u: 1, pose: pose({}) },
    ],
  },
];

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  // 清掉舊版同前綴檔，避免殘留未登錄片段。
  for (const entry of fs.readdirSync(OUT_DIR)) {
    if (entry.startsWith("idle-") && entry.endsWith(".vrma")) {
      fs.unlinkSync(path.join(OUT_DIR, entry));
    }
  }
  for (const clip of CLIPS) {
    const tracks = sampleClip(clip.duration, clip.keys);
    const bytes = buildVrma(clip.name, tracks);
    const outPath = path.join(OUT_DIR, clip.file);
    fs.writeFileSync(outPath, bytes);
    console.log(
      `wrote ${path.relative(process.cwd(), outPath)} (${bytes.length} bytes, ${Object.keys(tracks).length} bones)`,
    );
  }
  console.log(`total clips: ${CLIPS.length}`);
}

main();
