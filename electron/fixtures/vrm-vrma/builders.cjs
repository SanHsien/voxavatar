"use strict";

/**
 * 合成 GLB 建構器，供品質測試與相容矩陣 fixture 共用。
 * 不提交二進位媒體；測試執行時於暫存目錄產生 .vrm / .vrma。
 */

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
  includeTextures = true,
  triangleVertices = 30,
  vrm0ArrayHumanoid = false,
  sparseHumanoidBones = false,
} = {}) {
  const positions = [];
  for (let i = 0; i < triangleVertices; i += 1) {
    positions.push(i * 0.01, (i % 3) * 0.02, 0);
  }
  const binary = Buffer.from(new Float32Array(positions).buffer);
  const fullHumanBoneEntries = [
    ["hips", 0],
    ["spine", 1],
    ["chest", 2],
    ["neck", 3],
    ["head", 4],
    ["leftUpperArm", 5],
    ["rightUpperArm", 6],
    ["leftLowerArm", 5],
    ["rightLowerArm", 6],
    ["leftHand", 5],
    ["rightHand", 6],
    ["leftUpperLeg", 0],
    ["rightUpperLeg", 0],
  ];
  const humanBoneEntries = sparseHumanoidBones
    ? [
        ["hips", 0],
        ["spine", 1],
        ["head", 4],
      ]
    : fullHumanBoneEntries;

  const extensions = {};
  const extensionsUsed = [];
  if (includeExtension) {
    if (vrm0ArrayHumanoid) {
      extensionsUsed.push("VRM");
      const humanBones = includeHumanoid
        ? humanBoneEntries.map(([bone, node]) => ({ bone, node }))
        : [];
      extensions.VRM = {
        humanoid: { humanBones },
        blendShapeMaster: includeExpressions
          ? { blendShapeGroups: [{ name: "A", presetName: "a" }] }
          : { blendShapeGroups: [] },
        firstPerson: { lookAtTypeName: "Bone" },
      };
    } else {
      extensionsUsed.push("VRMC_vrm");
      const humanBones = includeHumanoid
        ? Object.fromEntries(
            humanBoneEntries.map(([bone, node]) => [bone, { node }]),
          )
        : undefined;
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
            ...(includeTextures
              ? {
                  textures: [{ source: 0 }],
                  images: [{ mimeType: "image/png" }],
                }
              : {}),
          }
        : {
            buffers: [{ byteLength: binary.length }],
          }),
    },
    binary,
  );
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
  loopSeamDelta = 0.35,
  includeHumanoid = true,
  includeAnimation = true,
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
        localAngle = angle + loopSeamDelta;
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
      ...(includeAnimation
        ? { animations: [{ name: "clip", samplers, channels }] }
        : {}),
      accessors,
      bufferViews,
      buffers: [{ byteLength: binary.length }],
    },
    binary,
  );
}

module.exports = {
  buildRotationVrma,
  buildVrmGlb,
  packGlb,
  quatFromAxisAngle,
};
