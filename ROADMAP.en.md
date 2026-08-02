# VoxAvatar product roadmap

[繁體中文](ROADMAP.md) · English

Updated: 2026-08-02
Planning baseline: `v0.13.5` (`main` tip; published Release tag `v0.13.0`; upstream eval in [`docs/DECISIONS.md`](docs/DECISIONS.md) §1)

VoxAvatar is a **local-first Windows desktop character presentation layer that AI agents can control through explicit, testable boundaries**. Versions express dependency order, not delivery dates. See [`CHANGELOG.md`](CHANGELOG.md) for completed work.

## Current health

Review baseline: `v0.13.5` / `main`; GitHub Latest Release: `v0.13.0`

No known open P0/P1. `v0.13.0` is Latest. Upstream open PR/issues evaluated (nothing to merge; see [`docs/DECISIONS.md`](docs/DECISIONS.md) §1). Roadmap focus is **v0.14**. `main` tip `0.13.5` includes the voice output privacy-warning display fix (no extra tag).

- Latest Release: `v0.13.0`; `main` tip is `0.13.x`.
- Upstream: commit watermark `cf27d12`; open PR #16 / issue #13 are macOS (skip); issue #11 first-run avatar docs already covered.
- MCP tools: 5 (including opt-in `show_message`); state-event normalize ready, state tools not wired yet.
- Settings: custom actions support multi-clip VRMA on cards; output-device privacy warning follows the current UI selection immediately.

Still open: system state-slot UI; MCP state tools; action-pack import pipeline; App/Settings jsdom integration; precise head projection, DPI/30%/Idle long-run on real hardware; installer signing and Windows GUI smoke (unverified without keys/desktop).

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
| v0.5.x | Error recovery, settings splits, bundle/SBOM/release-evidence tools |
| v0.6.x | Settings/IPC/asset-validation convergence and renderer error tests |
| v0.7.x | Bundle/startup baselines, non-critical lazy loading, and further settings splits |
| v0.8.x | Synthetic VRM/VRMA matrix, exporter notes, and import rollback |
| v0.9–v0.10 | Motion purpose, state arbitration, bubble DOM, `show_message` opt-in, lip-sync gain wiring |
| v0.11–v0.12 | action-pack contract, overlay/catalog splits, state-event normalize, Idle long-run freeze fix |
| v0.13.0 | Upstream #14/#15 evaluated and skipped; batch Release of accumulated work |

Completed v0.9–v0.12 items are no longer repeated here. Remaining work lives under v0.14 below.

## v0.14.x: state-slot wiring, deeper tests, and Windows validation

### Character and MCP

The detailed contract is in [`docs/CHARACTER_BEHAVIOR.md`](docs/CHARACTER_BEHAVIOR.md) (Traditional Chinese).

- System state-slot UI (Settings bindings from state → motion); MCP state tool on top of `normalizeExternalStateEvent`.
- Real `action-pack.json` import pipeline (must not bypass license / path / GLB gates).
- Precise head projection for lip-sync gain and bubble anchors (currently size-based estimates).

### Testing and quality

- Add App/Settings jsdom integration tests.
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

1. Wire system state-slot UI and an MCP state tool on the existing normalize/arbitrate path.
2. Add App/Settings jsdom coverage and an action-pack import pipeline that still respects gates.
3. When Windows/secrets are available, complete smoke, signing, and 30%/DPI real-machine evidence.
