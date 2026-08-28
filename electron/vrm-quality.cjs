"use strict";

/**
 * VRM（glTF 2 binary）啟發式品質分析。
 * 僅供本機目錄匯入參考，不取代設定頁即時預覽。
 */

const fs = require("node:fs");
const path = require("node:path");
const {
  CORE_BONES,
  KEEP_SCORE_AT_LEAST,
  QUALITY_GATE,
  REJECT_SCORE_BELOW,
  VERDICT,
  normalizeQualityGate,
  normalizeQualityScoreThresholds,
  normalizeReportDir,
  readGlb,
  resolveScoreThresholds,
  summarizeReports,
  verdictLabelZh,
} = require("./vrma-quality.cjs");

const DEFAULT_REPORT_FILENAME = "voxavatar-vrm-report.md";
/** 超過此大小標為高嚴重度觀察（仍可匯入；嚴格模式不因此淘汰） */
const LARGE_FILE_BYTES = 80 * 1024 * 1024;
/** 粗估三角面數超過此值標觀察 */
const HIGH_TRIANGLE_COUNT = 150_000;
/** 節點數超過此值標中嚴重度 */
const HIGH_NODE_COUNT = 400;

function extensionNames(json) {
  return new Set([
    ...(Array.isArray(json.extensionsUsed) ? json.extensionsUsed : []),
    ...(Array.isArray(json.extensionsRequired)
      ? json.extensionsRequired
      : []),
    ...Object.keys(json.extensions ?? {}),
  ]);
}

function hasVrmExtension(json) {
  const names = extensionNames(json);
  return names.has("VRM") || names.has("VRMC_vrm");
}

/**
 * 正規化 humanoid 骨骼名稱：VRM0／VRM1 皆為 camelCase（hips、leftUpperArm…）。
 * 少數匯出工具會寫成 PascalCase，比對前統一成首字小寫。
 */
function normalizeHumanoidBoneName(name) {
  const raw = String(name ?? "").trim();
  if (!raw) return "";
  return raw.charAt(0).toLowerCase() + raw.slice(1);
}

/**
 * 讀取 VRM0／VRM1 humanoid 對應。
 * - VRM 1.0（VRMC_vrm）：`humanBones` 為 { boneName: { node } }
 * - VRM 0.x（VRM）：`humanBones` 為 [{ bone, node }, ...]
 * 不可對陣列使用 Object.entries，否則會把索引當骨名、覆蓋永遠算成 0。
 */
function humanoidBoneMap(json) {
  const map = new Map();
  const humanBones =
    json.extensions?.VRMC_vrm?.humanoid?.humanBones ??
    json.extensions?.VRM?.humanoid?.humanBones ??
    null;
  if (!humanBones || typeof humanBones !== "object") return map;

  const addBone = (boneName, nodeIndex) => {
    const name = normalizeHumanoidBoneName(boneName);
    if (!name || !Number.isInteger(nodeIndex)) return;
    map.set(name, nodeIndex);
  };

  if (Array.isArray(humanBones)) {
    for (const entry of humanBones) {
      if (!entry || typeof entry !== "object") continue;
      addBone(entry.bone, entry.node);
    }
    return map;
  }

  for (const [boneName, entry] of Object.entries(humanBones)) {
    if (typeof entry === "number") {
      addBone(boneName, entry);
      continue;
    }
    if (entry && typeof entry === "object" && Number.isInteger(entry.node)) {
      addBone(boneName, entry.node);
    }
  }
  return map;
}

function estimateTriangleCount(json) {
  const accessors = Array.isArray(json.accessors) ? json.accessors : [];
  const meshes = Array.isArray(json.meshes) ? json.meshes : [];
  let triangles = 0;
  for (const mesh of meshes) {
    const primitives = Array.isArray(mesh?.primitives) ? mesh.primitives : [];
    for (const primitive of primitives) {
      if (primitive?.indices != null) {
        const accessor = accessors[primitive.indices];
        const count = Number(accessor?.count) || 0;
        triangles += Math.floor(count / 3);
        continue;
      }
      const position = primitive?.attributes?.POSITION;
      if (position == null) continue;
      const accessor = accessors[position];
      const count = Number(accessor?.count) || 0;
      triangles += Math.floor(count / 3);
    }
  }
  return triangles;
}

function materialCount(json) {
  return Array.isArray(json.materials) ? json.materials.length : 0;
}

function textureCount(json) {
  return Array.isArray(json.textures) ? json.textures.length : 0;
}

function meshCount(json) {
  return Array.isArray(json.meshes) ? json.meshes.length : 0;
}

function nodeCount(json) {
  return Array.isArray(json.nodes) ? json.nodes.length : 0;
}

function hasExpressions(json) {
  if (json.extensions?.VRMC_vrm?.expressions) return true;
  const blend =
    json.extensions?.VRM?.blendShapeMaster?.blendShapeGroups ??
    json.extensions?.VRM?.blendShapeMaster?.BlendShapeGroups;
  return Array.isArray(blend) && blend.length > 0;
}

function hasLookAt(json) {
  return Boolean(
    json.extensions?.VRMC_vrm?.lookAt ||
      json.extensions?.VRM?.firstPerson?.lookAt ||
      json.extensions?.VRM?.firstPerson?.lookAtTypeName,
  );
}

function scoreReport(filePath, parsed, options = {}) {
  const { json, byteLength } = parsed;
  const issues = [];
  let score = 100;

  if (!hasVrmExtension(json)) {
    score -= 50;
    issues.push({
      code: "missing_vrm_extension",
      severity: "critical",
      message: "缺少 VRM／VRMC_vrm 擴充，可能無法作為角色載入。",
    });
  }

  const meshes = meshCount(json);
  const nodes = nodeCount(json);
  if (meshes === 0) {
    score -= 40;
    issues.push({
      code: "no_meshes",
      severity: "critical",
      message: "找不到任何 mesh，角色可能無法顯示。",
    });
  }
  if (nodes === 0) {
    score -= 30;
    issues.push({
      code: "no_nodes",
      severity: "critical",
      message: "找不到任何 node。",
    });
  }

  const humanoid = humanoidBoneMap(json);
  const coveredCore = CORE_BONES.filter((bone) => humanoid.has(bone));
  if (humanoid.size === 0) {
    score -= 25;
    issues.push({
      code: "missing_humanoid",
      severity: "high",
      message: "缺少 humanoid 骨骼對應，口型／動作可能對位失敗。",
    });
  } else if (coveredCore.length < Math.ceil(CORE_BONES.length * 0.6)) {
    score -= 20;
    issues.push({
      code: "low_bone_coverage",
      severity: "high",
      message: `核心人形骨骼覆蓋不足（僅 ${coveredCore.length}／${CORE_BONES.length}）。`,
    });
  } else if (coveredCore.length < CORE_BONES.length) {
    score -= 8;
    issues.push({
      code: "partial_bone_coverage",
      severity: "medium",
      message: `部分核心骨骼未對應（${coveredCore.length}／${CORE_BONES.length}）。`,
    });
  }

  if (byteLength >= LARGE_FILE_BYTES) {
    score -= 12;
    issues.push({
      code: "large_file",
      severity: "high",
      message: `檔案偏大（${(byteLength / (1024 * 1024)).toFixed(1)} MB），可能影響啟動與記憶體。`,
    });
  }

  const triangles = estimateTriangleCount(json);
  if (triangles >= HIGH_TRIANGLE_COUNT) {
    score -= 10;
    issues.push({
      code: "high_triangle_count",
      severity: "high",
      message: `粗估三角面數偏高（約 ${triangles}），桌面 overlay 可能較吃效能。`,
    });
  }

  const materials = materialCount(json);
  const textures = textureCount(json);
  if (meshes > 0 && materials === 0) {
    score -= 10;
    issues.push({
      code: "no_materials",
      severity: "medium",
      message: "有 mesh 但沒有 materials，顯示可能異常。",
    });
  }
  if (meshes > 0 && textures === 0) {
    score -= 6;
    issues.push({
      code: "no_textures",
      severity: "medium",
      message: "找不到 textures；若角色應有貼圖，請確認匯出設定。",
    });
  }

  if (nodes >= HIGH_NODE_COUNT) {
    score -= 6;
    issues.push({
      code: "high_node_count",
      severity: "medium",
      message: `節點數偏高（${nodes}），可能來自複雜綁定或未合併物件。`,
    });
  }

  if (!hasExpressions(json)) {
    score -= 4;
    issues.push({
      code: "missing_expressions",
      severity: "medium",
      message: "未偵測到表情／blendShape；口型仍可能可用，但表情動作會受限。",
    });
  }

  if (!hasLookAt(json)) {
    score -= 2;
    issues.push({
      code: "missing_look_at",
      severity: "low",
      message: "未偵測到 lookAt；視線追蹤相關功能可能不可用。",
    });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const { rejectBelow, keepAtLeast } = resolveScoreThresholds(options);
  let verdict = VERDICT.KEEP;
  if (
    score < rejectBelow ||
    issues.some((issue) => issue.severity === "critical")
  ) {
    verdict = VERDICT.REJECT;
  } else if (
    score <= keepAtLeast ||
    issues.some((issue) => issue.severity === "high")
  ) {
    verdict = VERDICT.REVIEW;
  }

  return {
    filePath,
    fileName: path.basename(filePath),
    byteLength,
    score,
    verdict,
    thresholds: { rejectBelow, keepAtLeast },
    issues,
    metrics: {
      meshCount: meshes,
      nodeCount: nodes,
      materialCount: materials,
      textureCount: textures,
      triangleCount: triangles,
      humanoidBoneCount: humanoid.size,
      coveredCoreBones: coveredCore,
      hasExpressions: hasExpressions(json),
      hasLookAt: hasLookAt(json),
    },
  };
}

function analyzeVrmFile(filePath, options = {}) {
  try {
    if (path.extname(filePath).toLowerCase() !== ".vrm") {
      return {
        filePath,
        fileName: path.basename(filePath),
        score: 0,
        verdict: VERDICT.REJECT,
        issues: [
          {
            code: "wrong_extension",
            severity: "critical",
            message: "副檔名不是 .vrm。",
          },
        ],
        metrics: null,
        error: "wrong_extension",
      };
    }
    const parsed = readGlb(filePath);
    return scoreReport(filePath, parsed, options);
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

function analyzeVrmFiles(filePaths, options = {}) {
  return filePaths.map((filePath) => analyzeVrmFile(filePath, options));
}

function formatMarkdownReport(reports, options = {}) {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const sourceDir = options.sourceDir ?? "";
  const gate = normalizeQualityGate(options.gate);
  const { rejectBelow, keepAtLeast } = resolveScoreThresholds(options);
  const sorted = [...reports].sort((a, b) => a.score - b.score);
  const counts = summarizeReports(sorted);
  const reviewUpper = Math.max(rejectBelow, keepAtLeast);

  const lines = [
    "# VoxAvatar VRM 品質報告",
    "",
    `- 產生時間：\`${generatedAt}\``,
    sourceDir ? `- 掃描目錄：\`${sourceDir}\`` : null,
    `- 把關模式：\`${gate}\`（report＝全部匯入並寫報告；strict＝略過淘汰；off＝不分析）`,
    `- 分數門檻：淘汰 < ${rejectBelow}；觀察 ${rejectBelow}–${reviewUpper}；保留 > ${keepAtLeast}`,
    `- 檔案數：${sorted.length}（保留 ${counts.keep}／觀察 ${counts.review}／淘汰 ${counts.reject}）`,
    "",
    "> 本報告為啟發式自動判斷，僅供參考。最終請以 VoxAvatar 設定頁的即時預覽為準。",
    "",
    "## 判定門檻（簡要）",
    "",
    "| 結果 | 條件概要 |",
    "| --- | --- |",
    `| 保留 | 分數 > ${keepAtLeast}，且無高嚴重度問題 |`,
    `| 觀察 | 分數 ${rejectBelow}–${reviewUpper}，或有高嚴重度問題 |`,
    `| 淘汰 | 分數 < ${rejectBelow}，或無法解析／缺 VRM 擴充／無 mesh |`,
    "",
    "主要檢查：VRM 擴充、mesh／node、humanoid 覆蓋、檔案大小、粗估三角面、材質／貼圖、表情與 lookAt。",
    "",
    "## 總表",
    "",
    "| 判定 | 分數 | 檔名 | mesh | 三角面 | humanoid | 問題數 |",
    "| --- | ---: | --- | ---: | ---: | ---: | ---: |",
  ].filter((line) => line != null);

  for (const report of sorted) {
    const metrics = report.metrics;
    lines.push(
      `| ${verdictLabelZh(report.verdict)} | ${report.score} | \`${report.fileName}\` | ${
        metrics ? metrics.meshCount : "-"
      } | ${metrics ? metrics.triangleCount : "-"} | ${
        metrics ? metrics.humanoidBoneCount : "-"
      } | ${report.issues.length} |`,
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
    "1. 先在設定 → 模型資料庫用即時預覽確認「觀察／淘汰」項目。",
    "2. 若把關設為「嚴格」，淘汰檔不會被匯入；仍可改回「分析並寫報告」後再試。",
    "3. 合法來源的完整 VRoid／市集角色通常會落在「保留」或輕度「觀察」。",
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

module.exports = {
  CORE_BONES,
  DEFAULT_REPORT_FILENAME,
  HIGH_NODE_COUNT,
  HIGH_TRIANGLE_COUNT,
  KEEP_SCORE_AT_LEAST,
  LARGE_FILE_BYTES,
  QUALITY_GATE,
  REJECT_SCORE_BELOW,
  VERDICT,
  analyzeVrmFile,
  analyzeVrmFiles,
  estimateTriangleCount,
  formatMarkdownReport,
  hasVrmExtension,
  humanoidBoneMap,
  normalizeHumanoidBoneName,
  normalizeQualityGate,
  normalizeQualityScoreThresholds,
  normalizeReportDir,
  resolveReportPath,
  resolveScoreThresholds,
  scoreReport,
  summarizeReports,
  writeMarkdownReport,
};
