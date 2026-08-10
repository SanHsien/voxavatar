# VoxAvatar product roadmap

[繁體中文](ROADMAP.md) · English

Updated: 2026-08-10
Planning baseline: `0.16.23` (`main`; GitHub Latest Release: `v0.16.22`; upstream eval in [`docs/DECISIONS.md`](docs/DECISIONS.md) §1)

VoxAvatar is a **local-first Windows desktop character presentation layer that AI agents can control through explicit, testable boundaries**. Versions express dependency order, not delivery dates. See [`CHANGELOG.md`](CHANGELOG.md) for completed work.

> **Doc entry**: the former standalone `REVIEW.md` was merged into “Current health” in 0.13.3. Do not create a parallel review file. `CHANGELOG` covers finished work; this file covers health and open gaps.

## Current health

Review baseline: `0.16.23` / `main`; GitHub Latest Release: `v0.16.22`

No known open P0/P1. Upstream watermark `152b1b4` (rescanned 2026-08-10; 12 commits after `bb7ef24` still need per-item evaluation — see [`docs/DECISIONS.md`](docs/DECISIONS.md) §1). `0.16.21` and `0.16.22` fix both halves of the motion-cycling defect: idle was locked to a single looping clip by the default state-slot bindings (making the whole `ambientIdleMotionUrls` pool unreachable), and speaking always used `loop` because cycling was hard-gated to `IDLE`, so only one Speaking clip was ever used per utterance. `0.16.23` then replaced pure random selection with a shuffle bag — every clip plays once per round before reshuffling — fixing the poor coverage and near-repeats of pure random. `0.16.20` fixed the path-redaction tail leak in the diagnostic summary and in MCP `get_status` / the Settings voice-source list.

- Latest Release: `v0.16.22` (installer + SHA256 downloaded and matched; Authenticode `NotSigned` confirmed via both PowerShell and the PE Certificate Table; GUI / signing / real exporters still unverified).
- Upstream: commit watermark `152b1b4` (2026-08-10). The 12 commits after `bb7ef24` (#17 bundles AvatarSample / speaking VRMA — **do not merge**) are listed but still need per-item diff review; open PRs #45–#48 and open issues #18 / #35 / #43 / #44 (#45 includes microphone capture, which crosses a hard boundary; #18 is out of scope; #11 is already covered).
- MCP tools: 6; HTTP `character-state`; tray manual state; Speaking secondary head/torso cue shipped.
- System state slots preselect when playable; Settings includes expandable action-pack help and a copyable example; optional “Assign by filename”. Setup progress panel hides after required items are done; clips support preview, rename, purpose, move, and an unassigned pool.

This round: `npm run check` green (the authoritative gate is CI on Node 24). Known local limitation: Node 25 ships a built-in Web Storage global that shadows jsdom's `window.localStorage`, so `src/theme.test.ts` fails under Node 25. Unrelated to product code; not yet addressed.

### Verification gaps (marked unverified; never fabricate completion)

| Item | Status | Reason |
| --- | --- | --- |
| Real-desktop confirmation of the 0.16.21–0.16.23 idle and speaking shuffle-bag cycling | **Unverified** | Covered by unit tests; the single-instance lock prevents launching a second instance while an installed build is running, so this needs a reinstall and desktop observation |
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
| v0.16.10–0.16.23 | `vrma:curate`, contracts, NotSigned/evidence, helper/MCP redaction (incl. the 0.16.20 placeholder-tail fix), CodeQL, i18n/sanitize/IPC, evidence-path scaffolding, idle/speaking cycling fixes and the shuffle bag (0.16.21–0.16.23) |

Per-version detail lives only in [`CHANGELOG.md`](CHANGELOG.md); this table stays collapsed.

## Closing existing gaps

### Automatable / evidence copy (done)

- [x] State slots / MCP / HTTP / action-pack / head projection; jsdom / schema / env / external listener; manual state; typed exit + Usage=2.
- [x] Speaking secondary, tray, `vrma:curate`, schema 10→11, IPC/Settings contracts, assign / show_message / secureRenderer.
- [x] release-evidence (Latest SHA / NotSigned; `ci_gates` green); README / SECURITY / About unsigned labeling; helper_error copy and path redaction.
- [x] Setup voice-code i18n; MCP/Settings voice-catalog path redaction; zh/en i18n key parity; helper state next-step hints; sanitize/migration/preload contracts.
- [x] Settings notice redaction; tip evidence does not invent tags; dual-track redact fixtures; confirm-dialog / listener-pattern / TTL extraction; format / rate-limit / IPC channel contracts.
- [x] `evidence:verify` / PE NotSigned; `--emit-error`; separate Event code; smoke sub-items; exporter schema; 30%/idle/theme contracts.
- [x] Idle/speaking cycling: `shouldCycleRandomMotions`, `motionRestMsForAnimation`, `isSystemSlotFallbackMotion`, and the shuffle bag (round coverage / seam / pool change / random-source hardening) pure-logic contracts (real-desktop observation listed under verification gaps).

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

1. Reinstall `v0.16.23` and confirm idle and speaking shuffle-bag cycling on a real desktop (idle switches clip per segment plus gap; speaking chains clips without freezing; no repeat within a round). This is the only item still blocking a verified-complete claim for the action system.
2. Review the 12 upstream commits in `bb7ef24..152b1b4` plus the open PRs/issues item by item and resolve the **待評估** (pending) rows in [`docs/DECISIONS.md`](docs/DECISIONS.md) §1 — starting with #23 (stateful animation scheduler, which overlaps this fork's cycling design) and #43 / #48 (settings IPC sender gate, possibly already covered).
3. Blocked on a Windows desktop / signing secrets / licensed samples: fill segmented smoke sub-items under `docs/release-evidence/` and cross-check NotSigned via `evidence:verify` / `evidence:pe` (SmartScreen still needs a human); obtain clearly licensed real exporter samples for `_templates/exporter-results.json`; add real failure-path coverage once an audio/COM environment is available (`--emit-error` is contract-only).

Action↔VRMA auto-assignment policy is settled (pack / name preselect / whitelist confirm; no semantic guessing); see [`docs/DECISIONS.md`](docs/DECISIONS.md) §10. Do not open a semantic slotting track.
