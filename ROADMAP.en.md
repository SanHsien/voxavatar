# VoxAvatar product roadmap

[繁體中文](ROADMAP.md) · English

Updated: 2026-08-10
Planning baseline: `0.16.21` (`main`; GitHub Latest Release: `v0.16.20`; upstream eval in [`docs/DECISIONS.md`](docs/DECISIONS.md) §1)

VoxAvatar is a **local-first Windows desktop character presentation layer that AI agents can control through explicit, testable boundaries**. Versions express dependency order, not delivery dates. See [`CHANGELOG.md`](CHANGELOG.md) for completed work.

> **Doc entry**: the former standalone `REVIEW.md` was merged into “Current health” in 0.13.3. Do not create a parallel review file. `CHANGELOG` covers finished work; this file covers health and open gaps.

## Current health

Review baseline: `0.16.21` / `main`; GitHub Latest Release: `v0.16.20`

Known open defect: Speaking motions do not cycle randomly (see below). Upstream watermark `bb7ef24` (#17 **not merged**). `0.16.21` fixes idle motion being locked to a single looping clip by the default state-slot bindings, which made the whole `ambientIdleMotionUrls` pool unreachable. `0.16.20` fixed the path-redaction tail leak in the diagnostic summary and in MCP `get_status` / the Settings voice-source list, and cut an installer Release.

- Latest Release: `v0.16.20` (installer + SHA256 downloaded and matched; Authenticode `NotSigned` confirmed via both PowerShell and the PE Certificate Table; GUI / signing / real exporters still unverified).
- Upstream: commit watermark `bb7ef24` (#17 bundles AvatarSample / speaking VRMA — **do not merge**); no open PR; #16 / closed issue #13 are macOS (skip), and issue #11 is already covered.
- MCP tools: 6; HTTP `character-state`; tray manual state; Speaking secondary head/torso cue shipped.
- System state slots preselect when playable; Settings includes expandable action-pack help and a copyable example; optional “Assign by filename”. Setup progress panel hides after required items are done; clips support preview, rename, purpose, move, and an unassigned pool.

This round: `npm run check` green (the authoritative gate is CI on Node 24). Known local limitation: Node 25 ships a built-in Web Storage global that shadows jsdom's `window.localStorage`, so `src/theme.test.ts` fails under Node 25. Unrelated to product code; not yet addressed.

### Known defects (not fixed)

| Item | Impact | Notes |
| --- | --- | --- |
| Speaking motions never cycle | One clip loops for the whole utterance | `cycleRandomMotions` is hard-gated to `animation === 'IDLE'`, so TALK always uses `playback: 'loop'` and `animationRequest` never advances. Assigning several Speaking clips still yields one clip per utterance |

### Verification gaps (marked unverified; never fabricate completion)

| Item | Status | Reason |
| --- | --- | --- |
| Real-desktop confirmation of the 0.16.21 idle-cycling fix | **Unverified** | Covered by unit tests; the single-instance lock prevents launching a second instance while the user's installed build is running |
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
| v0.1–v0.13 | Windows-only fork baseline; `REVIEW` → Current health (details in CHANGELOG) |
| v0.14–v0.15 | State slots / MCP / HTTP / head projection / manual state / typed exit |
| v0.16.0–0.16.9 | Speaking secondary, tray, slot defaults, action-pack, clip pool/preview, UI spacing |
| v0.16.10–0.16.20 | `vrma:curate`, contracts, NotSigned/evidence, helper/MCP redaction (incl. the 0.16.20 placeholder-tail fix), CodeQL, i18n/sanitize/IPC, evidence-path scaffolding |

Per-version detail lives only in [`CHANGELOG.md`](CHANGELOG.md); this table stays collapsed.

## Closing existing gaps

### Automatable / evidence copy (done)

- [x] State slots / MCP / HTTP / action-pack / head projection; jsdom / schema / env / external listener; manual state; typed exit + Usage=2.
- [x] Speaking secondary, tray, `vrma:curate`, schema 10→11, IPC/Settings contracts, assign / show_message / secureRenderer.
- [x] release-evidence (Latest SHA / NotSigned; `ci_gates` green); README / SECURITY / About unsigned labeling; helper_error copy and path redaction.
- [x] Setup voice-code i18n; MCP/Settings voice-catalog path redaction; zh/en i18n key parity; helper state next-step hints; sanitize/migration/preload contracts.
- [x] Settings notice redaction; tip evidence does not invent tags; dual-track redact fixtures; confirm-dialog / listener-pattern / TTL extraction; format / rate-limit / IPC channel contracts.
- [x] `evidence:verify` / PE NotSigned; `--emit-error`; separate Event code; smoke sub-items; exporter schema; 30%/idle/theme contracts.

### Still open / unverified (blocked on desktop, secrets, or licensed samples)

- [~] Native COM/WASAPI/Device/Event **real** failure paths (HRESULT / device environment).
- [~] Idle/DPI/30% real-machine readability / GUI smoke / installer signing & SmartScreen (see verification table).
- [~] Real exporter manual results (redistributable-clear samples).

### Evidence-path progress (automatable / Linux-safe; ≠ desktop complete)

- [x] Usage=2 + JS typed-exit classification; `--emit-error` 10/11/12/13 contracts (real COM/WASAPI still unverified).
- [x] Event exit **13** is `native_helper_event_error` (no longer folded into wasapi wording).
- [x] `evidence:verify`: GitHub digest / SHA256SUMS / NotSigned label checks (≠ SmartScreen).
- [x] Empty PE Certificate Table ⇒ machine-provable `NotSigned` (`evidence:pe`; ≠ publisher acceptance).
- [x] Smoke checklist split into fillable sub-items; tip evidence can mark `ci_gates=pass` with tip SHA.
- [x] Exporter evidence JSON schema / empty results table (`docs/release-evidence/_templates/`; no real results).
- [x] Character size 30% / idle settings interaction contracts (multi-DPI readability unverified).

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

1. With Windows/secrets: fill segmented smoke sub-items under `docs/release-evidence/`, and cross-check NotSigned via `evidence:verify` / `evidence:pe` (SmartScreen still needs a human).
2. Obtain clearly licensed real exporter samples and fill `_templates/exporter-results.json`.
3. With audio/COM environments, add real failure-path coverage (`--emit-error` is contract-only).

Action↔VRMA auto-assignment policy is settled (pack / name preselect / whitelist confirm; no semantic guessing); see [`docs/DECISIONS.md`](docs/DECISIONS.md) §10. Do not open a semantic slotting track.
