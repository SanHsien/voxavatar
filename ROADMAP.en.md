# VoxAvatar product roadmap

[繁體中文](ROADMAP.md) · English

Updated: 2026-08-02
Planning baseline: `v0.15.1` (`main` tip; published Release tag `v0.13.0`; upstream eval in [`docs/DECISIONS.md`](docs/DECISIONS.md) §1)

VoxAvatar is a **local-first Windows desktop character presentation layer that AI agents can control through explicit, testable boundaries**. Versions express dependency order, not delivery dates. See [`CHANGELOG.md`](CHANGELOG.md) for completed work.

> **Doc entry**: the former standalone `REVIEW.md` was merged into “Current health” in 0.13.3. Do not create a parallel review file. `CHANGELOG` covers finished work; this file covers health and open gaps.

## Current health

Review baseline: `v0.15.1` / `main`; GitHub Latest Release: `v0.13.0`

No known open P0/P1. `v0.13.0` is Latest. Upstream open PR/issues evaluated (nothing to merge; see [`docs/DECISIONS.md`](docs/DECISIONS.md) §1). **No new features this round**—only closing existing gaps. `main` tip `0.15.1`: jsdom interaction tests, import partial-failure feedback, catalog schema policy/tests (no extra tag).

- Latest Release: `v0.13.0`; `main` tip is `0.15.1`.
- Upstream: commit watermark `cf27d12`; open PR #16 / issue #13 are macOS (skip); issue #11 first-run avatar docs already covered.
- MCP tools: 6 (including opt-in `show_message` and `set_character_state`); `tools_schema_version` = 3.
- Settings: state slots, action-pack, quality thresholds; state-slot / threshold / voice / bubble have jsdom interaction tests.
- Head anchors: Scene/Avatar project VRM humanoid bones; missing data falls back to size estimate.

This round: `npm run check` green; Release/Latest/assets verified per [`docs/RELEASING.md`](docs/RELEASING.md).

### Verification gaps (marked unverified; never fabricate completion)

| Item | Status | Reason |
| --- | --- | --- |
| Windows GUI smoke (install/upgrade/uninstall/tray/MCP/DPI/keyboard) | **Unverified** | No Windows desktop |
| 30% character size and multi-DPI on hardware | **Unverified** | No Windows desktop |
| Idle long-run / model-switch memory (GUI residency) | **Unverified** | No Windows desktop; `baseline:startup` excludes GUI |
| Installer signing / publisher / SmartScreen / upgrade path | **Unverified** | No signing secrets |
| Native helper COM/WASAPI typed exit codes (C++) | **Unverified** | Needs Windows runner/toolchain; JS classification exists |
| Real VRoid/UniVRM/Blender sample results | **Unverified** | No clearly licensed off-repo sample evidence yet |

Product remains **Windows-only**; do not restore Linux/macOS shipping.

## Principles

1. Privacy, security, licensing, and release correctness come first.
2. Character reactions must be understandable and degradable without guessing chat content or emotion.
3. Automate pure logic and contracts; keep real Windows evidence for desktop behavior, WASAPI, DPI, tray, and installers.
4. Regular development does not require Visual Studio Build Tools; the GitHub Windows runner is the canonical native and installer gate.
5. Do not compete on bundled characters, motions, or agent count; do not expand into a chat client.
6. **Close existing gaps before new features**; mark what cannot be verified as unverified.

## Completed summary

| Series | Highlights |
| --- | --- |
| v0.1.x | Stable Windows baseline, licensing, CI, and Release trust root |
| v0.2.x | Voice sources, IPC/preload, readiness, diagnostics, MCP session and action queue |
| v0.3.x | Confirmed media import, migration fixtures, clip ordering, quality reports |
| v0.4.x | Structured MCP schemas, integration docs, multi-client tests |
| v0.5.x | Error recovery, settings module split, bundle/SBOM/release-evidence tooling |
| v0.6.x | Settings/IPC/asset validation convergence and renderer error tests |
| v0.7.x | Bundle/startup baselines, non-first-screen lazy-load, Settings further split |
| v0.8.x | Synthetic VRM/VRMA matrix, exporter notes, import rollback |
| v0.9–v0.10 | Motion purpose, state arbitration, bubble DOM, opt-in `show_message`, lip-sync gain |
| v0.11–v0.12 | Action-pack contract, overlay/catalog extraction, state-event normalize, Idle freeze fix |
| v0.13.0 | Upstream #14/#15 skipped; batch Release; `REVIEW` → Current health |
| v0.14.0 | State-slot UI, MCP `set_character_state`, action-pack import, settings schema 9 |
| v0.14.1 | head-projection pure logic, Settings SSR tests, native helper failure classification |
| v0.15.0 | Scene/Avatar VRM head bone projection (bubble anchors + lip-sync gain) |
| v0.15.1 | jsdom interaction tests, import partial-failure feedback, catalog schema policy/reject tests |

## Closing existing gaps (v0.14–v0.15)

### Character, MCP, tests (automatable)

Detailed contract: [`docs/CHARACTER_BEHAVIOR.md`](docs/CHARACTER_BEHAVIOR.md) (Traditional Chinese).

- [x] System state-slot UI; MCP `set_character_state`.
- [x] `action-pack.json` import pipeline (no bypass of license/path/GLB gates).
- [x] Precise head projection: pure logic + Scene/Avatar VRM bone wiring; missing bones fall back.
- [x] Settings state-slot / quality-threshold / voice-mode / bubble-anchor jsdom interaction tests.
- [x] Native helper failure classification vocabulary (JS).
- [x] Directory / action-pack import partial-failure user-visible feedback (skip/fail counts).

### Still open / unverified (see table above)

- [~] Native helper COM/WASAPI typed exit codes (needs Windows runner).
- [~] Idle long-run / model-switch GUI baselines; real exporter manual results.
- [~] Windows smoke, DPI/30%, installer signing.

## v1.0.0 criteria

- [x] No known P0/P1; active operations (Settings `run` / import / MCP / listener state) report success or failure; directory and action-pack partial failures are visible.
- [~] Windows 10/11 install, upgrade, uninstall, onboarding, voice, media, character presence, and MCP have real-machine evidence. **Unverified** (no desktop).
- [~] Installer signed with publisher, SmartScreen, and upgrade path verified. **Unverified** (no secrets); unsigned builds cannot become 1.0.
- [x] Settings, catalog, and MCP schemas have version policies ([`docs/DECISIONS.md`](docs/DECISIONS.md) §9) and tests (Settings 1–8→9, catalog unsupported reject, MCP schema outputs).
- [x] Failed imports do not lose data: single-file VRM/VRMA rollback, catalog mutation all-or-nothing, directory/action-pack best-effort structured results tested.
- [~] Common exporters’ **real** compatibility results. **Unverified** (synthetic matrix only; see [`docs/VRM_VRMA_COMPATIBILITY.md`](docs/VRM_VRMA_COMPATIBILITY.md)).
- [x] Privacy, loopback-only, media licensing, Windows-only, and upstream attribution have docs and automated gates (`SECURITY` / bridge / assets / listener tests).

### Completion gate (required before 1.0)

- Every “unverified” row above must gain evidence or an explicit downgrade note (never pretend done).
- At least one published asset set has SHA-256, Windows smoke evidence, and recorded signing status.
- `npm run check`, CI, CodeQL, and production audit have no unresolved high-risk findings.

## Explicit non-goals

- Microphone capture, recording, transcription, or retention/transmission of audio.
- LAN/Internet exposure for MCP or the bridge, or arbitrary command/file access.
- Inferring text, emotion, or work state from chat screens, audio, or other apps.
- Redistributing unlicensed VRM/VRMA or restoring Linux/macOS releases.
- Running an LLM, retaining chat history, or replacing a chat client inside VoxAvatar.
- **No new feature tracks until existing gaps and unverified 1.0 items are closed.**

## Next three actions

1. When a Windows runner is available, add native COM/WASAPI typed exit codes and `native:test`.
2. When Windows/secrets are available, complete smoke, signing, and 30%/DPI/Idle real-machine evidence.
3. After clearly licensed real exporter sample results exist, batch-publish a Release (Latest remains `v0.13.0`).
