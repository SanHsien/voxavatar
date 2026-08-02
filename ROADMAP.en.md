# VoxAvatar product roadmap

[繁體中文](ROADMAP.md) · English

Updated: 2026-08-02
Planning baseline: `v0.15.0` (`main` tip; published Release tag `v0.13.0`; upstream eval in [`docs/DECISIONS.md`](docs/DECISIONS.md) §1)

VoxAvatar is a **local-first Windows desktop character presentation layer that AI agents can control through explicit, testable boundaries**. Versions express dependency order, not delivery dates. See [`CHANGELOG.md`](CHANGELOG.md) for completed work.

## Current health

Review baseline: `v0.15.0` / `main`; GitHub Latest Release: `v0.13.0`

No known open P0/P1. `v0.13.0` is Latest. Upstream open PR/issues evaluated (nothing to merge; see [`docs/DECISIONS.md`](docs/DECISIONS.md) §1). Roadmap focus is **remaining after v0.15** (jsdom interaction tests / Windows validation). `main` tip `0.15.0` wires VRM head bone projection to bubble anchors and lip-sync gain (no extra tag).

- Latest Release: `v0.13.0`; `main` tip is `0.15.0`.
- Upstream: commit watermark `cf27d12`; open PR #16 / issue #13 are macOS (skip); issue #11 first-run avatar docs already covered.
- MCP tools: 6 (including opt-in `show_message` and `set_character_state`); `tools_schema_version` = 3.
- Settings: system state-slot bindings; action-pack import; adjustable score thresholds; state-slot/threshold panels have SSR tests.
- Head anchors: Scene/Avatar project VRM humanoid bones; missing data falls back to size estimate.

Still open: full App/Settings jsdom interaction tests; DPI/30%/Idle long-run on real hardware; installer signing and Windows GUI smoke (unverified without keys/desktop). Product remains **Windows-only**; do not restore Linux/macOS shipping.

This round: `npm run check` green; Release/Latest/assets verified per [`docs/RELEASING.md`](docs/RELEASING.md).

## Principles

1. Privacy, security, licensing, and release correctness come first.
2. Character reactions must be understandable and degradable without guessing chat content or emotion.
3. Automate pure logic and contracts; keep real Windows evidence for desktop behavior, WASAPI, DPI, tray, and installers.
4. Regular development does not require Visual Studio Build Tools; the GitHub Windows runner is the canonical native and installer gate.
5. Do not compete on bundled character, motion, or agent counts, and do not become another chat client.

## Completed summary

| Series | Representative outcome |
| --- | --- |
| v0.1.x | Stable Windows baseline, licensing, CI, and release trust root |
| v0.2.x | Voice sources, IPC/preload, readiness, diagnostics, MCP sessions, and action queue |
| v0.3.x | Confirmed media import, migration fixtures, clip ordering, and quality reports |
| v0.4.x | Structured MCP schemas, integration docs, and multi-client tests |
| v0.5.x | Error recovery, settings module split, bundle/SBOM/release-evidence tooling |
| v0.6.x | Settings/IPC/asset validation consolidation and renderer error tests |
| v0.7.x | Bundle/startup baselines, non-first-screen lazy-load, and Settings page split |
| v0.8.x | Synthetic VRM/VRMA compatibility matrix, exporter notes, and import rollback |
| v0.9–v0.10 | Motion purpose, state arbitration, bubble DOM, opt-in `show_message`, lip-sync gain wiring |
| v0.11–v0.12 | Action-pack contract, overlay/catalog extraction, state-event normalize, Idle long-run freeze fix |
| v0.13.0 | Upstream #14/#15 evaluated and skipped; batch Release of accumulated work |
| v0.14.0 | System state-slot UI, MCP `set_character_state`, action-pack import, settings schema 9 |
| v0.14.1 | head-projection pure logic, Settings state-slot/threshold SSR tests, native helper failure classification |
| v0.15.0 | Scene/Avatar VRM head bone projection wiring (bubble anchors + lip-sync gain) |

Completed v0.9–v0.13 items stay in the summary only; remaining work is under v0.14–v0.15 below.

## v0.14.x–v0.15.x: deeper tests and Windows validation

### Character and MCP

The detailed contract is in [`docs/CHARACTER_BEHAVIOR.md`](docs/CHARACTER_BEHAVIOR.md) (Traditional Chinese).

- [x] System state-slot UI (Settings bindings from state → motion); MCP `set_character_state` on `normalizeExternalStateEvent`.
- [x] Real `action-pack.json` import pipeline (must not bypass license / path / GLB gates).
- [x] Precise head projection: `head-projection` pure logic plus Scene/Avatar VRM head/chest bone wiring; missing bones fall back to size estimate.
- [x] Settings state-slot / quality-threshold panel SSR tests; full jsdom interaction tests still open.
- [x] Native helper failure classification vocabulary (JS); typed COM/WASAPI exit codes still need the Windows runner.

### Testing and quality

- Add App/Settings jsdom interaction tests.
- Establish repeatable Windows baselines for long-running Idle, model switching, and memory (automated `baseline:startup` does not cover GUI residency).
- Add manual exporter results from clearly licensed VRoid, UniVRM, and Blender samples; do not commit the binaries.

### Windows and release validation

- Keep versioned Windows smoke evidence for candidate/published releases: install, upgrade, uninstall, protocol, tray, MCP, DPI, and keyboard.
- Validate installer signing, publisher, SmartScreen, and upgrade behavior.
- Give the native helper testable COM/WASAPI error types or exit codes and exercise playback, device changes, and recovery.
- Mark unavailable desktop or signing steps as unverified; never fabricate completion.

### Completion criteria

- State-slot UI / MCP state tool have automated tests; 30% avatar size and multiple DPI settings have real-machine evidence.
- At least one published asset set has SHA-256, Windows smoke evidence, and recorded signing status.
- `npm run check`, CI, CodeQL, and production audit have no unresolved high-risk findings.

## v1.0.0 criteria

- No known P0/P1 issues; every active operation reports success or failure.
- Windows 10/11 installation, upgrade, uninstall, onboarding, voice, media, character presence, and MCP have real-machine evidence.
- The installer is signed and its publisher, SmartScreen, and update path are verified; unsigned builds cannot become 1.0.
- Settings, catalog, and MCP schemas have version policies and migration tests.
- Common exporters have publicly verifiable compatibility results, and failed imports do not lose data.
- Privacy, loopback-only networking, media licensing, Windows-only scope, and upstream attribution remain verifiable.

## Explicit non-goals

- Microphone capture, recording, transcription, or retention/transmission of audio.
- LAN/Internet exposure for MCP or the bridge, or arbitrary command/file access.
- Inferring text, emotion, or work state from chat screens, audio, or other apps.
- Redistributing unlicensed VRM/VRMA or restoring Linux/macOS releases.
- Running an LLM, retaining chat history, or replacing a chat client inside VoxAvatar.

## Next three actions

1. Add App/Settings jsdom interaction tests (select/import behavior).
2. When Windows/secrets are available, complete smoke, signing, and 30%/DPI real-machine evidence.
3. After enough `main` tip versions accumulate, batch-publish a Release (Latest remains `v0.13.0` for now).
