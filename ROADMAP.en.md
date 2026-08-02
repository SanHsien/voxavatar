# VoxAvatar product roadmap

[繁體中文](ROADMAP.md) · English

Updated: 2026-08-02
Planning baseline: `0.16.9` (`main`; GitHub Latest Release tag remains `v0.16.0`; upstream eval in [`docs/DECISIONS.md`](docs/DECISIONS.md) §1)

VoxAvatar is a **local-first Windows desktop character presentation layer that AI agents can control through explicit, testable boundaries**. Versions express dependency order, not delivery dates. See [`CHANGELOG.md`](CHANGELOG.md) for completed work.

> **Doc entry**: the former standalone `REVIEW.md` was merged into “Current health” in 0.13.3. Do not create a parallel review file. `CHANGELOG` covers finished work; this file covers health and open gaps.

## Current health

Review baseline: `0.16.9` / `main`; GitHub Latest Release: `v0.16.0`

No known open P0/P1. Upstream open PR/issues evaluated (nothing to merge; see [`docs/DECISIONS.md`](docs/DECISIONS.md) §1). **No new feature tracks this round**—close existing gaps and contract drift. `main` tip `0.16.9`: unassigned clip pool, readable on-disk filenames, batch purpose.

- Latest Release: `v0.16.0` (GUI/signing/real exporters still unverified).
- Upstream: commit watermark `9287ea3`; no open PR; #16 / closed issue #13 are macOS (skip), and issue #11 is already covered.
- MCP tools: 6; HTTP `character-state`; tray manual state; Speaking secondary head/torso cue shipped.
- System state slots preselect when playable; Settings includes expandable action-pack help and a copyable example; optional “Assign by filename”. Setup progress panel hides after required items are done; clips support preview, rename, purpose, and move.

This round: `npm run check` green; Release/Latest/assets verified per [`docs/RELEASING.md`](docs/RELEASING.md).

### Verification gaps (marked unverified; never fabricate completion)

| Item | Status | Reason |
| --- | --- | --- |
| Windows GUI smoke (install/upgrade/uninstall/tray/MCP/DPI/keyboard) | **Unverified** | No Windows desktop |
| 30% character size and multi-DPI readability | **Unverified** | No Windows desktop |
| Idle long-run / model-switch memory (GUI residency) | **Unverified** | No Windows desktop; `baseline:startup` excludes GUI |
| Installer signing / publisher / SmartScreen / upgrade path | **Unverified** | No signing secrets |
| Native COM/WASAPI/Device/Event **real** failure paths | **Unverified** | Usage=2 assertable on runner; real audio/COM failures need the environment |
| Real VRoid/UniVRM/Blender sample results | **Unverified** | No clearly licensed off-repo sample evidence yet |

### Doc claims aligned / still open (not Windows-blocked)

| Item | Status | Notes |
| --- | --- | --- |
| Lip-sync / head projection narrative | **Aligned** | Scene bone wiring shipped |
| HTTP/env/external/MCP UI/TTL/message contract | **Shipped** | See 0.15.2 |
| Bubble “source priority” | **Docs corrected** | Bounded queue without cross-source priority |
| User manual state UI | **Shipped** | Tray/context; menu structure tested |
| Native typed exit / NDJSON `code` | **Code + Usage=2 assert shipped** | JS/listener tests covered; real COM/WASAPI failures unverified |
| Speaking secondary head/torso cue | **Shipped** | Pure logic + Avatar wiring; real-machine look unverified |

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
| v0.15.0–v0.15.3 | Head bone projection, jsdom, docs alignment, manual state, typed exit codes |
| v0.16.0 | Speaking secondary motion; testable tray menu; Usage=2 native assertion |
| v0.16.1 | Original brand icon; upstream credit; fork-network detachment; standalone/metadata/squash verification |
| v0.16.2 | Default state-slot bindings; in-Settings action-pack help and examples |
| v0.16.3 | Animations page: create form next to list; guide collapsed, state slots below |
| v0.16.4 | Clarify listening state slot defaults to idle (no separate listening system action) |
| v0.16.5 | action-pack purpose written to clips; opt-in filename whitelist assignment (DECISIONS §10) |
| v0.16.6 | Hide setup progress when complete; clarify no AI VRMA semantic slotting (DECISIONS §10/§11) |
| v0.16.9 | Unassigned clip pool, readable disk filenames, batch purpose (schema 11; DECISIONS §12) |
| v0.16.7 | VRMA clip preview / display name / purpose / move-to-action (schema 10; DECISIONS §12) |

## Closing existing gaps

### Automatable (done)

- [x] State-slot UI; MCP/HTTP character-state; action-pack; head projection.
- [x] jsdom / import partial-failure; schema policy; env pattern; external listener.
- [x] Docs drift fixes; user manual state; native typed exit codes with JS/listener tests.
- [x] Speaking secondary head/torso; tray menu extract tests; Usage=2 runner assertion.

### Still open / unverified

- [~] Native COM/WASAPI/Device/Event real failure paths.
- [~] Idle/DPI/30%/GUI smoke/installer signing (see verification table).
- [~] Real exporter manual results.

## Full production-release assurance

- [x] No known P0/P1; active operations report success or failure.
- [~] Windows real-machine evidence. **Unverified**.
- [~] Installer signing. **Unverified**; unsigned builds must be labelled explicitly.
- [x] Settings/catalog/MCP schema version policies and tests.
- [x] Failed imports do not lose data.
- [~] Common exporters’ **real** compatibility results. **Unverified**.
- [x] Privacy, loopback-only, media licensing, Windows-only, upstream attribution remain verifiable.

### Completion gate

- Every “unverified” row must gain evidence or an explicit downgrade note.
- At least one published asset set has SHA-256, Windows smoke evidence, and recorded signing status.
- `npm run check`, CI, CodeQL, and production audit have no unresolved high-risk findings.

## Explicit non-goals

- Microphone capture, recording, transcription, or retention/transmission of audio.
- LAN/Internet exposure for MCP or the bridge, or arbitrary command/file access.
- Inferring text, emotion, or work state from chat screens, audio, or other apps.
- Redistributing unlicensed VRM/VRMA or restoring Linux/macOS releases.
- Running an LLM, retaining chat history, or replacing a chat client inside VoxAvatar.
- **No new feature tracks until existing gaps and unverified items are closed.**

## Next three actions

1. When Windows/secrets are available, complete smoke, signing, and 30%/DPI/Idle real-machine evidence.
2. Obtain clearly licensed real exporter sample results.
3. Native COM/WASAPI/Device/Event real failure paths (when the environment exists).

Action↔VRMA auto-assignment policy is settled (pack / name preselect / whitelist confirm; no semantic guessing); see [`docs/DECISIONS.md`](docs/DECISIONS.md) §10. Do not open a semantic slotting track.
