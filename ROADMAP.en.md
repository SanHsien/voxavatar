# VoxAvatar product roadmap

[繁體中文](ROADMAP.md) · English

Updated: 2026-08-01
Planning baseline: `v0.8.1` accumulated on `main`; Latest Release: `v0.5.0`

VoxAvatar is a **local-first Windows desktop character presentation layer that AI agents can control through explicit, testable boundaries**. Versions express dependency order, not delivery dates. See [`CHANGELOG.md`](CHANGELOG.md) for completed work and [`REVIEW.md`](REVIEW.md) for current health.

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

Completed v0.6–v0.8 items are no longer repeated here. Every unfinished item from those series is consolidated into v0.9.

## v0.9.x: character presence, convergence, and Windows validation

### Character presence

The detailed contract is in [`docs/CHARACTER_BEHAVIOR.md`](docs/CHARACTER_BEHAVIOR.md) (Traditional Chinese).

- Classify VRMA as `loop`, `one-shot`, or `pose` and apply purpose-aware quality rules instead of rejecting one-shot actions for loop seams.
- Add `idle`, `listening`, `speaking`, `working`, `reviewing`, `success`, and `failed` states with fixed priority, TTL, optional system slots, and safe fallback.
- Improve lip-sync readability for small avatars with adjustable intensity, a visible minimum opening, and screen-space head-size gain; describe it accurately as amplitude-driven rather than phoneme sync.
- Add a comic-style bubble that follows the avatar and supports short text, Emoji, kaomoji, screen-edge avoidance, TTL, reduced motion, and a bounded queue.
- Let connected local AI clients display short messages through MCP `show_message`; keep it disabled by default, then apply session-derived source labels, rate limiting, input sanitization, and no message history when enabled.
- Evaluate a thin `action-pack.json` that describes purpose and state mappings without bypassing import, path, or licensing gates.

### Unfinished work moved from v0.6–v0.8

- Extract the `main` overlay lifecycle and `settings-store` CRUD boundaries.
- Add App/Settings jsdom integration tests.
- Establish repeatable Windows baselines for long-running Idle, model switching, and memory.
- Add manual exporter results from clearly licensed VRoid, UniVRM, and Blender samples; do not commit the binaries.

### Windows and release validation

- Keep versioned Windows smoke evidence for a release candidate: install, upgrade, uninstall, protocol, tray, MCP, DPI, and keyboard.
- Validate installer signing, publisher, SmartScreen, and upgrade behavior.
- Give the native helper testable COM/WASAPI error types or exit codes and exercise playback, device changes, and recovery.
- Run real protocol/tray/desktop smoke. Mark unavailable desktop or signing steps as unverified; never fabricate completion.

### Completion criteria

- State arbitration, motion purpose, lip-sync gain, bubble input/TTL/queue, and the MCP opt-in capability gate have automated tests; Windows UI behavior at 30% avatar size and multiple DPI settings has real-machine evidence.
- Every carried v0.6–v0.8 item is complete or explicitly removed from the 1.0 scope with rationale.
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

1. Implement purpose-aware motion profiles for `loop`, `one-shot`, and `pose`.
2. Implement state arbitration and fallback, then add the floating bubble and MCP `show_message`.
3. When a Windows desktop and signing credentials are available, complete release evidence, native, and installer validation.
