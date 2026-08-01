"use strict";

/**
 * VRMA（glTF 2 binary）啟發式品質分析。
 * 僅供本機匯入參考，不取代實機播放判斷。
 */

const fs = require("node:fs");
const path = require("node:path");

const GLB_MAGIC = 0x46546c67;
const CHUNK_JSON = 0x4e4f534a;
const CHUNK_BIN = 0x004e4942;
const COMPONENT_FLOAT = 5126;
const COMPONENT_BYTE = 5120;
const COMPONENT_UBYTE = 5121;
const COMPONENT_SHORT = 5122;
const COMPONENT_USHORT = 5123;

const CORE_BONES = Object.freeze([
  "hips",
  "spine",
  "chest",
  "neck",
  "head",
  "leftUpperArm",
  "rightUpperArm",
  "leftLowerArm",
  "rightLowerArm",
  "leftHand",
  "rightHand",
  "leftUpperLeg",
  "rightUpperLeg",
]);

const VERDICT = Object.freeze({
  KEEP: "keep",
  REVIEW: "review",
  REJECT: "reject",
});

/** 分數低於此值（或 critical）→ 淘汰 */
const REJECT_SCORE_BELOW = 60;
/** 分數低於此值（或 high）→ 觀察；達標且無高嚴重度 → 保留 */
const KEEP_SCORE_AT_LEAST = 75;

const QUALITY_GATE = Object.freeze({
  REPORT: "report",
  STRICT: "strict",
  OFF: "off",
});

const DEFAULT_REPORT_FILENAME = "voxavatar-vrma-report.md";

const TYPE_COUNTS = Object.freeze({
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16,
});

function normalizeQualityGate(value) {
  if (value === QUALITY_GATE.STRICT || value === QUALITY_GATE.OFF) return value;
  return QUALITY_GATE.REPORT;
}

function normalizeReportDir(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return path.resolve(trimmed);
}

function readGlb(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.length < 12) {
    throw new Error("檔案過短，不是有效的 GLB。");
  }
  if (buffer.readUInt32LE(0) !== GLB_MAGIC) {
    throw new Error("檔案魔術碼不是 glTF。");
  }
  if (buffer.readUInt32LE(4) !== 2) {
    throw new Error("僅支援 glTF 2.0 binary。");
  }
  const totalLength = buffer.readUInt32LE(8);
  if (totalLength > buffer.length) {
    throw new Error("GLB 宣告長度超過實際檔案。");
  }

  let offset = 12;
  let json = null;
  let bin = Buffer.alloc(0);

  while (offset + 8 <= buffer.length) {
    const chunkLength = buffer.readUInt32LE(offset);
    const chunkType = buffer.readUInt32LE(offset + 4);
    offset += 8;
    if (offset + chunkLength > buffer.length) {
      throw new Error("GLB chunk 長度無效。");
    }
    const chunkData = buffer.subarray(offset, offset + chunkLength);
    offset += chunkLength;
    if (chunkType === CHUNK_JSON) {
      const text = chunkData.toString("utf8").replace(/\0+$/, "").trimEnd();
      json = JSON.parse(text);
    } else if (chunkType === CHUNK_BIN) {
      bin = Buffer.from(chunkData);
    }
  }

  if (!json || typeof json !== "object") {
    throw new Error("GLB 缺少 JSON chunk。");
  }
  return { json, bin, byteLength: buffer.length };
}

function componentByteSize(componentType) {
  switch (componentType) {
    case COMPONENT_BYTE:
    case COMPONENT_UBYTE:
      return 1;
    case COMPONENT_SHORT:
    case COMPONENT_USHORT:
      return 2;
    case COMPONENT_FLOAT:
      return 4;
    default:
      return 0;
  }
}

function readAccessorFloats(json, bin, accessorIndex) {
  const accessor = json.accessors?.[accessorIndex];
  if (!accessor) throw new Error(`缺少 accessor ${accessorIndex}`);
  const typeCount = TYPE_COUNTS[accessor.type];
  if (!typeCount) throw new Error(`不支援的 accessor type: ${accessor.type}`);
  const componentSize = componentByteSize(accessor.componentType);
  if (!componentSize) {
    throw new Error(`不支援的 componentType: ${accessor.componentType}`);
  }
  if (accessor.componentType !== COMPONENT_FLOAT) {
    throw new Error("動畫取樣目前僅支援 FLOAT accessor。");
  }

  const count = accessor.count;
  const values = new Float32Array(count * typeCount);
  if (accessor.bufferView == null) {
    return { values, count, typeCount };
  }

  const view = json.bufferViews?.[accessor.bufferView];
  if (!view) throw new Error(`缺少 bufferView ${accessor.bufferView}`);
  const byteOffset =
    (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const stride = view.byteStride ?? typeCount * componentSize;
  for (let i = 0; i < count; i += 1) {
    const start = byteOffset + i * stride;
    for (let c = 0; c < typeCount; c += 1) {
      values[i * typeCount + c] = bin.readFloatLE(start + c * 4);
    }
  }
  return { values, count, typeCount };
}

function quatDot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
}

function quatNormalize(q) {
  const len = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
  return [q[0] / len, q[1] / len, q[2] / len, q[3] / len];
}

/** 兩個單位四元數之間的夾角（弧度）。 */
function quatAngle(a, b) {
  let d = Math.abs(quatDot(quatNormalize(a), quatNormalize(b)));
  d = Math.min(1, Math.max(0, d));
  return 2 * Math.acos(d);
}

function nodeNameMap(json) {
  const map = new Map();
  const nodes = Array.isArray(json.nodes) ? json.nodes : [];
  for (let i = 0; i < nodes.length; i += 1) {
    const name = typeof nodes[i]?.name === "string" ? nodes[i].name : `node_${i}`;
    map.set(i, name);
  }
  return map;
}

function humanoidBoneMap(json) {
  const map = new Map();
  const humanBones =
    json.extensions?.VRMC_vrm_animation?.humanoid?.humanBones ??
    json.extensions?.VRM?.humanoid?.humanBones ??
    null;
  if (!humanBones || typeof humanBones !== "object") return map;
  for (const [boneName, entry] of Object.entries(humanBones)) {
    const nodeIndex =
      typeof entry?.node === "number"
        ? entry.node
        : typeof entry === "number"
          ? entry
          : null;
    if (nodeIndex != null) map.set(nodeIndex, boneName);
  }
  return map;
}

function analyzeAnimationTracks(json, bin) {
  const animations = Array.isArray(json.animations) ? json.animations : [];
  if (animations.length === 0) {
    return {
      animationCount: 0,
      durationSec: 0,
      trackCount: 0,
      rotationTracks: [],
      translationTracks: [],
      estimatedFps: 0,
      maxAngularVelocity: 0,
      meanAngularVelocity: 0,
      loopSeamMaxRad: 0,
      motionAmplitudeRad: 0,
      animatedNodeIndexes: new Set(),
    };
  }

  const animation = animations[0];
  const channels = Array.isArray(animation.channels) ? animation.channels : [];
  const samplers = Array.isArray(animation.samplers) ? animation.samplers : [];
  const rotationTracks = [];
  const translationTracks = [];
  const animatedNodeIndexes = new Set();
  let durationSec = 0;
  let fpsSamples = [];

  for (const channel of channels) {
    const sampler = samplers[channel.sampler];
    if (!sampler) continue;
    const nodeIndex = channel.target?.node;
    const pathName = channel.target?.path;
    if (typeof nodeIndex !== "number" || typeof pathName !== "string") continue;
    animatedNodeIndexes.add(nodeIndex);

    const input = readAccessorFloats(json, bin, sampler.input);
    const output = readAccessorFloats(json, bin, sampler.output);
    const times = [];
    for (let i = 0; i < input.count; i += 1) times.push(input.values[i]);
    if (times.length > 0) {
      durationSec = Math.max(durationSec, times[times.length - 1] ?? 0);
    }
    if (times.length >= 2) {
      const span = times[times.length - 1] - times[0];
      if (span > 1e-6) fpsSamples.push((times.length - 1) / span);
    }

    if (pathName === "rotation" && output.typeCount === 4) {
      const keys = [];
      for (let i = 0; i < output.count; i += 1) {
        const o = i * 4;
        keys.push({
          t: times[i] ?? 0,
          q: [
            output.values[o],
            output.values[o + 1],
            output.values[o + 2],
            output.values[o + 3],
          ],
        });
      }
      rotationTracks.push({ nodeIndex, keys });
    } else if (pathName === "translation" && output.typeCount === 3) {
      const keys = [];
      for (let i = 0; i < output.count; i += 1) {
        const o = i * 3;
        keys.push({
          t: times[i] ?? 0,
          v: [
            output.values[o],
            output.values[o + 1],
            output.values[o + 2],
          ],
        });
      }
      translationTracks.push({ nodeIndex, keys });
    }
  }

  let maxAngularVelocity = 0;
  let velocitySum = 0;
  let velocityCount = 0;
  let loopSeamMaxRad = 0;
  let motionAmplitudeRad = 0;

  for (const track of rotationTracks) {
    const { keys } = track;
    if (keys.length === 0) continue;
    if (keys.length >= 2) {
      loopSeamMaxRad = Math.max(
        loopSeamMaxRad,
        quatAngle(keys[0].q, keys[keys.length - 1].q),
      );
    }
    let amplitude = 0;
    for (let i = 1; i < keys.length; i += 1) {
      const dt = keys[i].t - keys[i - 1].t;
      const angle = quatAngle(keys[i - 1].q, keys[i].q);
      amplitude += angle;
      if (dt > 1e-6) {
        const velocity = angle / dt;
        maxAngularVelocity = Math.max(maxAngularVelocity, velocity);
        velocitySum += velocity;
        velocityCount += 1;
      }
    }
    motionAmplitudeRad += amplitude;
  }

  const estimatedFps =
    fpsSamples.length === 0
      ? 0
      : fpsSamples.reduce((sum, value) => sum + value, 0) / fpsSamples.length;

  return {
    animationCount: animations.length,
    durationSec,
    trackCount: channels.length,
    rotationTracks,
    translationTracks,
    estimatedFps,
    maxAngularVelocity,
    meanAngularVelocity: velocityCount === 0 ? 0 : velocitySum / velocityCount,
    loopSeamMaxRad,
    motionAmplitudeRad,
    animatedNodeIndexes,
  };
}

function scoreReport(filePath, parsed, tracks) {
  const issues = [];
  let score = 100;
  const humanoid = humanoidBoneMap(parsed.json);
  const names = nodeNameMap(parsed.json);
  const animatedBones = new Set();
  for (const nodeIndex of tracks.animatedNodeIndexes) {
    animatedBones.add(humanoid.get(nodeIndex) ?? names.get(nodeIndex) ?? `node_${nodeIndex}`);
  }

  const hasVrmAnimationExt = Boolean(
    parsed.json.extensions?.VRMC_vrm_animation ||
      parsed.json.extensionsUsed?.includes("VRMC_vrm_animation") ||
      parsed.json.extensions?.VRM,
  );
  if (!hasVrmAnimationExt) {
    score -= 25;
    issues.push({
      code: "missing_vrm_animation_extension",
      severity: "high",
      message: "缺少 VRMC_vrm_animation／VRM 動畫擴充，可能無法正確對應人形骨骼。",
    });
  }

  if (tracks.animationCount === 0) {
    score -= 80;
    issues.push({
      code: "no_animation",
      severity: "critical",
      message: "檔案內沒有任何 animation。",
    });
  }

  if (tracks.durationSec < 0.4) {
    score -= 25;
    issues.push({
      code: "too_short",
      severity: "high",
      message: `時長過短（${tracks.durationSec.toFixed(2)} 秒）。`,
    });
  } else if (tracks.durationSec < 1.2) {
    score -= 10;
    issues.push({
      code: "short_clip",
      severity: "medium",
      message: `時長偏短（${tracks.durationSec.toFixed(2)} 秒），待機循環可能顯得單調。`,
    });
  }

  if (tracks.estimatedFps > 0 && tracks.estimatedFps < 12) {
    score -= 20;
    issues.push({
      code: "low_fps",
      severity: "high",
      message: `關鍵幀密度偏低（約 ${tracks.estimatedFps.toFixed(1)} fps），播放可能頓挫。`,
    });
  } else if (tracks.estimatedFps > 0 && tracks.estimatedFps < 18) {
    score -= 8;
    issues.push({
      code: "moderate_fps",
      severity: "medium",
      message: `關鍵幀密度一般（約 ${tracks.estimatedFps.toFixed(1)} fps）。`,
    });
  }

  if (tracks.maxAngularVelocity > 18) {
    score -= 30;
    issues.push({
      code: "velocity_spike",
      severity: "high",
      message: `偵測到旋轉突波（最大 ${tracks.maxAngularVelocity.toFixed(1)} rad/s），動作可能不順。`,
    });
  } else if (tracks.maxAngularVelocity > 10) {
    score -= 12;
    issues.push({
      code: "velocity_high",
      severity: "medium",
      message: `旋轉速度偏高（最大 ${tracks.maxAngularVelocity.toFixed(1)} rad/s）。`,
    });
  }

  if (tracks.loopSeamMaxRad > 0.55) {
    score -= 25;
    issues.push({
      code: "loop_seam",
      severity: "high",
      message: `循環接縫落差大（最大 ${tracks.loopSeamMaxRad.toFixed(2)} rad），重複播放可能跳一下。`,
    });
  } else if (tracks.loopSeamMaxRad > 0.25) {
    score -= 10;
    issues.push({
      code: "loop_seam_mild",
      severity: "medium",
      message: `循環接縫略有落差（最大 ${tracks.loopSeamMaxRad.toFixed(2)} rad）。`,
    });
  }

  if (tracks.motionAmplitudeRad < 0.08 && tracks.durationSec >= 0.4) {
    score -= 35;
    issues.push({
      code: "dead_motion",
      severity: "high",
      message: "全身幾乎沒有旋轉運動量，疑似死素材或轉檔失敗。",
    });
  }

  const coveredCore = CORE_BONES.filter((bone) => animatedBones.has(bone));
  if (humanoid.size > 0 && coveredCore.length < 3) {
    score -= 20;
    issues.push({
      code: "low_bone_coverage",
      severity: "high",
      message: `核心人形骨骼覆蓋不足（僅 ${coveredCore.length}／${CORE_BONES.length}）。`,
    });
  } else if (humanoid.size === 0 && tracks.animatedNodeIndexes.size < 3) {
    score -= 15;
    issues.push({
      code: "few_animated_nodes",
      severity: "medium",
      message: `動畫節點過少（${tracks.animatedNodeIndexes.size}）。`,
    });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  let verdict = VERDICT.KEEP;
  if (
    score < REJECT_SCORE_BELOW ||
    issues.some((issue) => issue.severity === "critical") ||
    issues.some((issue) => issue.code === "no_animation")
  ) {
    verdict = VERDICT.REJECT;
  } else if (
    score < KEEP_SCORE_AT_LEAST ||
    issues.some((issue) => issue.severity === "high")
  ) {
    verdict = VERDICT.REVIEW;
  }

  return {
    filePath,
    fileName: path.basename(filePath),
    byteLength: parsed.byteLength,
    score,
    verdict,
    issues,
    metrics: {
      durationSec: Number(tracks.durationSec.toFixed(3)),
      estimatedFps: Number(tracks.estimatedFps.toFixed(2)),
      trackCount: tracks.trackCount,
      animationCount: tracks.animationCount,
      animatedNodeCount: tracks.animatedNodeIndexes.size,
      humanoidBoneCount: humanoid.size,
      coveredCoreBones: coveredCore,
      maxAngularVelocity: Number(tracks.maxAngularVelocity.toFixed(3)),
      meanAngularVelocity: Number(tracks.meanAngularVelocity.toFixed(3)),
      loopSeamMaxRad: Number(tracks.loopSeamMaxRad.toFixed(3)),
      motionAmplitudeRad: Number(tracks.motionAmplitudeRad.toFixed(3)),
    },
  };
}

function analyzeVrmaFile(filePath) {
  try {
    if (path.extname(filePath).toLowerCase() !== ".vrma") {
      return {
        filePath,
        fileName: path.basename(filePath),
        score: 0,
        verdict: VERDICT.REJECT,
        issues: [
          {
            code: "wrong_extension",
            severity: "critical",
            message: "副檔名不是 .vrma。",
          },
        ],
        metrics: null,
        error: "wrong_extension",
      };
    }
    const parsed = readGlb(filePath);
    const tracks = analyzeAnimationTracks(parsed.json, parsed.bin);
    return scoreReport(filePath, parsed, tracks);
  } catch (error) {
    return {
      filePath,
      fileName: path.basename(filePath),
      score: 0,
      verdict: VERDICT.REJECT,
      issues: [
        {
          code: "parse_error",
          severity: "critical",
          message: error instanceof Error ? error.message : String(error),
        },
      ],
      metrics: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function analyzeVrmaFiles(filePaths) {
  return filePaths.map((filePath) => analyzeVrmaFile(filePath));
}

function verdictLabelZh(verdict) {
  if (verdict === VERDICT.KEEP) return "保留";
  if (verdict === VERDICT.REVIEW) return "觀察";
  return "淘汰";
}

function formatMarkdownReport(reports, options = {}) {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const sourceDir = options.sourceDir ?? "";
  const gate = normalizeQualityGate(options.gate);
  const sorted = [...reports].sort((a, b) => a.score - b.score);

  const counts = {
    keep: sorted.filter((item) => item.verdict === VERDICT.KEEP).length,
    review: sorted.filter((item) => item.verdict === VERDICT.REVIEW).length,
    reject: sorted.filter((item) => item.verdict === VERDICT.REJECT).length,
  };

  const lines = [
    "# VoxAvatar VRMA 品質報告",
    "",
    `- 產生時間：\`${generatedAt}\``,
    sourceDir ? `- 掃描目錄：\`${sourceDir}\`` : null,
    `- 把關模式：\`${gate}\`（report＝全部匯入並寫報告；strict＝略過淘汰；off＝不分析）`,
    `- 檔案數：${sorted.length}（保留 ${counts.keep}／觀察 ${counts.review}／淘汰 ${counts.reject}）`,
    "",
    "> 本報告為啟發式自動判斷，僅供參考。最終請以 VoxAvatar 設定頁的即時預覽為準。",
    "",
    "## 判定門檻（簡要）",
    "",
    "| 結果 | 條件概要 |",
    "| --- | --- |",
    "| 保留 | 分數 ≥ 75，且無高嚴重度問題 |",
    "| 觀察 | 分數 60–74，或有高嚴重度問題 |",
    "| 淘汰 | 分數 < 60，或無法解析／無動畫 |",
    "",
    "主要檢查：時長、關鍵幀密度、旋轉突波、循環接縫、運動量、人形骨骼覆蓋。",
    "",
    "## 總表",
    "",
    "| 判定 | 分數 | 檔名 | 時長(s) | fps | 最大角速度 | 接縫(rad) | 問題數 |",
    "| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |",
  ].filter((line) => line != null);

  for (const report of sorted) {
    const metrics = report.metrics;
    lines.push(
      `| ${verdictLabelZh(report.verdict)} | ${report.score} | \`${report.fileName}\` | ${
        metrics ? metrics.durationSec : "-"
      } | ${metrics ? metrics.estimatedFps : "-"} | ${
        metrics ? metrics.maxAngularVelocity : "-"
      } | ${metrics ? metrics.loopSeamMaxRad : "-"} | ${report.issues.length} |`,
    );
  }

  const detailReports = sorted.filter(
    (report) =>
      report.verdict === VERDICT.REVIEW || report.verdict === VERDICT.REJECT,
  );
  lines.push("", "## 觀察／淘汰明細", "");
  if (detailReports.length === 0) {
    lines.push("無觀察或淘汰項目。", "");
  } else {
    for (const report of detailReports) {
      lines.push(
        `### ${verdictLabelZh(report.verdict)} · ${report.score} · \`${report.fileName}\``,
        "",
        `- 路徑：\`${report.filePath}\``,
      );
      if (report.issues.length === 0) {
        lines.push("- （無細部問題代碼）", "");
      } else {
        for (const issue of report.issues) {
          lines.push(`- \`[${issue.severity}/${issue.code}]\` ${issue.message}`);
        }
        lines.push("");
      }
    }
  }

  lines.push(
    "## 使用建議",
    "",
    "1. 先在設定 → 動作列表用即時預覽確認「觀察／淘汰」項目。",
    "2. 若把關設為「嚴格」，淘汰檔不會被匯入；仍可改回「分析並寫報告」後再試。",
    "3. 官方／市集優質素材（例如 VRoid 官方 VRMA）通常會落在「保留」。",
    "",
  );

  return `${lines.join("\n")}\n`;
}

function resolveReportPath(preferredDir, sourceDir) {
  const dir = normalizeReportDir(preferredDir) ?? normalizeReportDir(sourceDir);
  if (!dir) {
    throw new Error("未指定報告儲存目錄。");
  }
  return path.join(dir, DEFAULT_REPORT_FILENAME);
}

function writeMarkdownReport(reports, options = {}) {
  const reportPath = resolveReportPath(options.reportDir, options.sourceDir);
  const markdown = formatMarkdownReport(reports, options);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, markdown, "utf8");
  return { reportPath, markdown };
}

function summarizeReports(reports) {
  return {
    total: reports.length,
    keep: reports.filter((item) => item.verdict === VERDICT.KEEP).length,
    review: reports.filter((item) => item.verdict === VERDICT.REVIEW).length,
    reject: reports.filter((item) => item.verdict === VERDICT.REJECT).length,
  };
}

module.exports = {
  CORE_BONES,
  DEFAULT_REPORT_FILENAME,
  KEEP_SCORE_AT_LEAST,
  QUALITY_GATE,
  REJECT_SCORE_BELOW,
  VERDICT,
  analyzeVrmaFile,
  analyzeVrmaFiles,
  formatMarkdownReport,
  normalizeQualityGate,
  normalizeReportDir,
  readGlb,
  resolveReportPath,
  scoreReport,
  summarizeReports,
  verdictLabelZh,
  writeMarkdownReport,
};
