# VoxAvatar product roadmap

[繁體中文](ROADMAP.md) · English

Updated: 2026-08-02
Planning baseline: `v0.15.2` (`main` tip; published Release tag `v0.13.0`; upstream eval in [`docs/DECISIONS.md`](docs/DECISIONS.md) §1)

VoxAvatar is a **local-first Windows desktop character presentation layer that AI agents can control through explicit, testable boundaries**. Versions express dependency order, not delivery dates. See [`CHANGELOG.md`](CHANGELOG.md) for completed work.

> **Doc entry**: the former standalone `REVIEW.md` was merged into “Current health” in 0.13.3. Do not create a parallel review file. `CHANGELOG` covers finished work; this file covers health and open gaps.

## Current health

Review baseline: `v0.15.2` / `main`; GitHub Latest Release: `v0.13.0`

No known open P0/P1. `v0.13.0` is Latest. Upstream open PR/issues evaluated (nothing to merge; see [`docs/DECISIONS.md`](docs/DECISIONS.md) §1). **No new features this round**—align docs claims with implementation. `main` tip `0.15.2`: docs/integration gap closure (no extra tag).

- Latest Release: `v0.13.0`; `main` tip is `0.15.2`.
- Upstream: commit watermark `cf27d12`; open PR #16 / issue #13 are macOS (skip); issue #11 already covered.
- MCP tools: 6 (including `show_message` and `set_character_state`); Settings shows tools/status schema versions.
- HTTP `/events` accepts `character-state`; `VOXAVATAR_TARGET_PROCESS_PATTERN` overrides application targeting; external listener state is correct.

This round: `npm run check` green; Release/Latest/assets verified per [`docs/RELEASING.md`](docs/RELEASING.md).

### Verification gaps (marked unverified; never fabricate completion)

| Item | Status | Reason |
| --- | --- | --- |
| Windows GUI smoke (install/upgrade/uninstall/tray/MCP/DPI/keyboard) | **Unverified** | No Windows desktop |
| 30% character size and multi-DPI readability | **Unverified** | No Windows desktop |
| Idle long-run / model-switch memory (GUI residency) | **Unverified** | No Windows desktop; `baseline:startup` excludes GUI |
| Installer signing / publisher / SmartScreen / upgrade path | **Unverified** | No signing secrets |
| Native helper COM/WASAPI typed exit codes (C++) | **Unverified** | Needs Windows runner/toolchain; JS classification exists |
| Real VRoid/UniVRM/Blender sample results | **Unverified** | No clearly licensed off-repo sample evidence yet |

### Doc claims aligned / still missing product entry (not Windows-blocked)

| Item | Status | Notes |
| --- | --- | --- |
| Lip-sync / head projection narrative | **Aligned** | Scene bone wiring shipped; docs no longer say “projection still pending” |
| HTTP integration `character-state` | **Shipped** | `POST /events` + `normalizeExternalStateEvent` |
| Env process pattern overrides UI | **Shipped** | Overrides application/default/custom; not output/external |
| External `listener.state` | **Shipped** | Reports `external` |
| Settings MCP schema versions / 6-tool copy | **Shipped** | |
| `ttl_ms` 0 = default TTL | **Shipped** | |
| `show_message` zod limit relaxed | **Shipped** | Authority remains 80-grapheme sanitize |
| Bubble “source priority” | **Docs corrected** | Implementation is a bounded queue without cross-source priority |
| User manual state UI | **Not built** | Arbitration keeps `user` highest; **no Settings/tray entry** (noted only; no new feature track) |
| Speaking secondary head/torso cue | **Not built** | Still listed in CHARACTER_BEHAVIOR; not a hard 1.0 gate |

Product remains **Windows-only**; do not restore Linux/macOS shipping.

## Principles

1. Privacy, security, licensing, and release correctness come first.
2. Character reactions must be understandable and degradable without guessing chat content or emotion.
3. Automate pure logic and contracts; keep real Windows evidence for desktop behavior, WASAPI, DPI, tray, and installers.
4. Regular development does not require Visual Studio Build Tools; the GitHub Windows runner is the canonical native and installer gate.
5. Do not compete on bundled characters, motions, or agent count; do not expand into a chat client.
6. **Close existing gaps and doc/implementation drift before new features**; mark what cannot be verified as unverified.

## Completed summary

| Series | Highlights |
| --- | --- |
| v0.1.x–v0.13.0 | See CHANGELOG; `REVIEW` → Current health |
| v0.14.0–v0.14.1 | State slots / MCP state / head-projection pure logic / native JS classification |
| v0.15.0 | Scene/Avatar VRM head bone projection wiring |
| v0.15.1 | jsdom interaction tests, import partial-failure feedback, catalog schema policy |
| v0.15.2 | Docs/integration alignment (HTTP character-state, env pattern, MCP UI, TTL/message contract) |

## Closing existing gaps

### Automatable (done)

- [x] State-slot UI; MCP `set_character_state`; HTTP `character-state`.
- [x] Action-pack import; head projection wiring; jsdom tests; import partial-failure feedback.
- [x] Settings/catalog/MCP schema policy and tests; env pattern override; external listener state.
- [x] Docs/implementation drift fixes (bubble queue, quality-gate report mode, CHARACTER_BEHAVIOR projection copy).

### Still open / unverified

- [~] Native COM/WASAPI typed exit codes (Windows runner).
- [~] Idle/DPI/30%/GUI smoke/installer signing (see verification table).
- [~] Real exporter manual results.
- [~] User manual state UI (arbitration ready; no product entry).
- [~] Speaking secondary head/torso cue (docs still pending; non-blocking).

## v1.0.0 criteria

- [x] No known P0/P1; active operations report success or failure.
- [~] Windows real-machine evidence. **Unverified**.
- [~] Installer signing. **Unverified**; unsigned builds cannot become 1.0.
- [x] Settings/catalog/MCP schema version policies and tests.
- [x] Failed imports do not lose data.
- [~] Common exporters’ **real** compatibility results. **Unverified**.
- [x] Privacy, loopback-only, media licensing, Windows-only, upstream attribution remain verifiable.

### Completion gate (required before 1.0)

- Every “unverified” row must gain evidence or an explicit downgrade note.
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
