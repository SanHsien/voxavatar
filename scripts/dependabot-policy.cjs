"use strict";

const fs = require("node:fs");

const AUTO_MERGE_LABEL = "dependencies-auto-merge";
const MANUAL_REVIEW_LABEL = "dependencies-manual-review";
const SAFE_UPDATE_TYPES = new Set([
  "version-update:semver-patch",
  "version-update:semver-minor",
]);
const CI_EXERCISED_DEV_PACKAGES = new Set([
  "@eslint/js",
  "@types/node",
  "@types/react",
  "@types/react-dom",
  "@vitejs/plugin-react-swc",
  "concurrently",
  "cross-env",
  "eslint",
  "eslint-plugin-react-hooks",
  "eslint-plugin-react-refresh",
  "globals",
  "typescript",
  "typescript-eslint",
  "vite",
  "vitest",
  "wait-on",
]);

function manual(reason) {
  return { decision: "manual", label: MANUAL_REVIEW_LABEL, reason };
}

function classifyUpdate({
  ecosystem,
  dependencyType,
  updateType,
  changedFiles = [],
  dependencyNames = [],
}) {
  const files = changedFiles.filter(Boolean).map((file) => file.replaceAll("\\", "/"));
  if (files.length === 0) return manual("沒有可驗證的變更檔案。");
  if (!SAFE_UPDATE_TYPES.has(updateType)) return manual("major 或未知幅度更新需人工審查。");

  if (ecosystem === "npm_and_yarn") {
    if (!files.every((file) => ["package.json", "package-lock.json"].includes(file))) {
      return manual("npm 更新超出 package manifest 與 lockfile 範圍。");
    }
    if (dependencyType !== "direct:development") {
      return manual("執行期、間接或未知依賴需人工審查。");
    }
    const names = dependencyNames.map((name) => name.trim().toLowerCase()).filter(Boolean);
    if (names.length === 0 || !names.every((name) => CI_EXERCISED_DEV_PACKAGES.has(name))) {
      return manual("包含未列入安全清單的開發或打包依賴。");
    }
    return {
      decision: "auto_merge",
      label: AUTO_MERGE_LABEL,
      reason: "CI 直接覆蓋的開發工具 minor 或 patch 更新。",
    };
  }

  if (ecosystem === "github-actions") {
    if (!files.every((file) => /^\.github\/workflows\/.*\.ya?ml$/u.test(file))) {
      return manual("GitHub Actions 更新包含 workflow 以外檔案。");
    }
    return {
      decision: "auto_merge",
      label: AUTO_MERGE_LABEL,
      reason: "只修改 workflow 的 GitHub Actions minor 或 patch 更新。",
    };
  }

  return manual("未列入自動合併政策的套件生態系。");
}

function parseArgs(args) {
  const options = { changedFiles: [], githubOutput: false };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--github-output") options.githubOutput = true;
    else if (argument === "--changed-file") options.changedFiles.push(args[++index]);
    else if (argument.startsWith("--")) {
      const key = argument.slice(2).replace(/-([a-z])/gu, (_, letter) => letter.toUpperCase());
      options[key] = args[++index];
    }
  }
  return options;
}

function main(args = process.argv.slice(2)) {
  const options = parseArgs(args);
  const result = classifyUpdate({
    ecosystem: options.ecosystem,
    dependencyType: options.dependencyType,
    updateType: options.updateType,
    changedFiles: options.changedFiles,
    dependencyNames: (options.dependencyNames ?? "").split(","),
  });
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (options.githubOutput && process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `decision=${result.decision}\nlabel=${result.label}\nreason=${result.reason}\n`,
    );
  }
}

if (require.main === module) main();

module.exports = { classifyUpdate, CI_EXERCISED_DEV_PACKAGES };
