"use strict";

/**
 * 驗證 release-evidence 與 GitHub Release／SHA256SUMS 的誠實對照。
 * 不把 digest 相符當成 GUI smoke 或 SmartScreen 通過。
 */

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

function parseSha256Sums(text) {
  const entries = new Map();
  for (const line of String(text ?? "").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = /^([A-Fa-f0-9]{64})\s+\*?(.+)$/.exec(trimmed);
    if (!match) continue;
    entries.set(path.basename(match[2].trim()), match[1].toLowerCase());
  }
  return entries;
}

function normalizeDigest(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed.startsWith("sha256:") ? trimmed.slice("sha256:".length) : trimmed;
}

/**
 * @param {{
 *   manifest: object,
 *   release?: object|null,
 *   sha256SumsText?: string|null,
 * }} input
 */
function verifyReleaseEvidenceConsistency({
  manifest,
  release = null,
  sha256SumsText = null,
} = {}) {
  const errors = [];
  const notes = [];
  if (!manifest || typeof manifest !== "object") {
    return { ok: false, errors: ["manifest is required"], notes };
  }
  if (manifest.smokeExecuted === true) {
    errors.push("smokeExecuted must stay false until a human desktop run completes.");
  }

  const hasInstaller = Boolean(manifest.release?.hasInstaller);
  if (!hasInstaller) {
    if (manifest.release?.tag != null) {
      notes.push(
        "tip evidence may set an explicit tag, but default tip manifests use tag=null.",
      );
    }
    if (manifest.assets?.installerFilename || manifest.assets?.installerSha256) {
      errors.push("tip/--no-installer manifest must not claim installer assets.");
    }
  }

  if (release) {
    if (release.draft) errors.push("GitHub release must not be draft.");
    if (release.prerelease) {
      notes.push("GitHub release is marked prerelease.");
    }
    const expectedTag = manifest.release?.tag;
    if (expectedTag && release.tag_name !== expectedTag) {
      errors.push(
        `release tag ${release.tag_name} does not match manifest tag ${expectedTag}.`,
      );
    }
    const body = String(release.body ?? "");
    if (!/NotSigned|未簽署|未验|未驗/i.test(body)) {
      errors.push("release body should mention NotSigned / 未簽署.");
    }
    const assets = Array.isArray(release.assets) ? release.assets : [];
    const installerAsset = assets.find((asset) =>
      /\.exe$/i.test(String(asset.name ?? "")),
    );
    const sumsAsset = assets.find((asset) =>
      /SHA256SUMS\.txt$/i.test(String(asset.name ?? "")),
    );
    if (hasInstaller) {
      if (!installerAsset) errors.push("release is missing a .exe installer asset.");
      if (!sumsAsset) errors.push("release is missing SHA256SUMS.txt.");
    }
    if (hasInstaller && installerAsset && manifest.assets?.installerSha256) {
      const digest = normalizeDigest(installerAsset.digest);
      const expected = String(manifest.assets.installerSha256).toLowerCase();
      if (digest && digest !== expected) {
        errors.push(
          `GitHub asset digest ${digest} does not match manifest sha256 ${expected}.`,
        );
      } else if (digest && digest === expected) {
        notes.push("GitHub asset digest matches manifest installerSha256.");
      }
      if (sha256SumsText) {
        const map = parseSha256Sums(sha256SumsText);
        const name = path.basename(
          manifest.assets.installerFilename || installerAsset.name,
        );
        const fromSums = map.get(name);
        if (!fromSums) {
          errors.push(`SHA256SUMS.txt is missing entry for ${name}.`);
        } else if (fromSums !== expected) {
          errors.push(
            `SHA256SUMS.txt hash ${fromSums} does not match manifest ${expected}.`,
          );
        } else {
          notes.push("SHA256SUMS.txt matches manifest installerSha256.");
        }
      }
    }
  }

  const signingItem = (manifest.smokeChecklist?.items ?? []).find(
    (item) => item.id === "signing" || item.id === "smartscreen",
  );
  if (signingItem && /pass/i.test(String(signingItem.result)) && !hasInstaller) {
    errors.push("tip evidence must not mark signing/smartscreen as pass.");
  }

  return { ok: errors.length === 0, errors, notes };
}

function loadManifest(manifestPath) {
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

function fetchLatestReleaseViaGh({ repo = "SanHsien/voxavatar" } = {}) {
  const result = spawnSync(
    "gh",
    ["api", `repos/${repo}/releases/latest`],
    { encoding: "utf8" },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr || `gh api failed with ${result.status}`);
  }
  return JSON.parse(result.stdout);
}

function fetchReleaseAssetTextViaGh(assetApiUrl) {
  const result = spawnSync(
    "gh",
    ["api", "-H", "Accept: application/octet-stream", assetApiUrl],
    { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr || `gh asset fetch failed with ${result.status}`);
  }
  return result.stdout;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const readFlag = (name) => {
    const index = args.indexOf(name);
    if (index === -1) return null;
    return args[index + 1] ?? null;
  };
  const hasFlag = (name) => args.includes(name);
  try {
    if (hasFlag("--help") || hasFlag("-h")) {
      console.log(`Usage: node scripts/verify-release-evidence.cjs --manifest <path> [options]
  --manifest <path>   required manifest.json
  --online            fetch GitHub latest release via gh and compare digests
  --repo <owner/name> default SanHsien/voxavatar
  --sums <path>       local SHA256SUMS.txt (optional with --online)`);
      process.exitCode = 0;
    } else {
      const manifestPath = readFlag("--manifest");
      if (!manifestPath) {
        throw new Error("Provide --manifest <path> (see --help).");
      }
      const manifest = loadManifest(manifestPath);
      let release = null;
      let sha256SumsText = null;
      if (hasFlag("--online")) {
        release = fetchLatestReleaseViaGh({
          repo: readFlag("--repo") ?? "SanHsien/voxavatar",
        });
        const sumsAsset = (release.assets ?? []).find((asset) =>
          /SHA256SUMS\.txt$/i.test(String(asset.name ?? "")),
        );
        if (sumsAsset?.url) {
          sha256SumsText = fetchReleaseAssetTextViaGh(sumsAsset.url);
        }
      }
      const sumsPath = readFlag("--sums");
      if (sumsPath) {
        sha256SumsText = fs.readFileSync(sumsPath, "utf8");
      }
      const result = verifyReleaseEvidenceConsistency({
        manifest,
        release,
        sha256SumsText,
      });
      for (const note of result.notes) console.log(`note: ${note}`);
      if (!result.ok) {
        console.error(result.errors.join("\n"));
        process.exitCode = 1;
      } else {
        console.log("Release evidence consistency checks passed.");
      }
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

module.exports = {
  fetchLatestReleaseViaGh,
  fetchReleaseAssetTextViaGh,
  loadManifest,
  normalizeDigest,
  parseSha256Sums,
  verifyReleaseEvidenceConsistency,
};
