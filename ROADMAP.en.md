# VoxAvatar product roadmap

[繁體中文](ROADMAP.md) · English

Updated: 2026-08-14
Planning baseline: `1.0.6` (`main`; GitHub Latest Release: `v1.0.5`; upstream eval in [`docs/DECISIONS.md`](docs/DECISIONS.md) §1)

VoxAvatar is a **local-first Windows desktop character presentation layer that AI agents can control through explicit, testable boundaries**. Versions express dependency order, not delivery dates. See [`CHANGELOG.md`](CHANGELOG.md) for completed work.

> **Doc entry**: the former standalone `REVIEW.md` was merged into “Current health” in 0.13.3. Do not create a parallel review file. `CHANGELOG` covers finished work; this file covers health and open gaps.

## Current health

Review baseline: `1.0.6` / `main`; GitHub Latest Release: `v1.0.5`

No known open P0/P1. `1.0.0` stabilizes the existing Windows-only, local-first, loopback-only MCP, level-driven lip-sync, and no-microphone product boundaries. `1.0.4` on `main` adds four redistribution-cleared VRMs scoring 100 / `keep` and 13 explicitly CC0 VRMAs scoring 78–100 / `keep`; all 18 unlicensed upstream VRMAs and ten local `review` motions remain excluded. Real-machine testing on Windows 11 found and fixed mixed Big5/UTF-8 process JSON from Traditional Chinese Windows PowerShell 5.1: automatic voice discovery no longer enters `launch_failed`, and a system-output TTS pass again proved the `speaking` / `listening` path. The general upstream-code watermark remains `152b1b4` (2026-08-10; see the renewed asset decision for #17 in [`docs/DECISIONS.md`](docs/DECISIONS.md) §1).

- Formal Release: `v1.0.5` (Release workflow `31800788259` completed the licensed-asset gate, Node 24 check, full dependency audit, Windows native build/self-test, NSIS packaging, and publishing; the runner installer digest, `SHA256SUMS.txt`, and local SHA-256 match, with Authenticode `NotSigned` confirmed two ways). A clean per-user installation on Windows 11 at 225% DPI confirmed AvatarSample_A as default, zero custom models/actions, and MCP Online/Ready with six tools and 12 actions; the unverified tray, full-DPI, voice-playback, and SmartScreen rows remain explicit in the versioned evidence.
- Security baseline: Electron 39.8.10 is upgraded to supported 43.4.0. `extract-zip@2.0.1`, affected by GHSA-jmr9-qjv8-65gv, is absent from the lockfile and replaced by Electron's maintained extractor. The complete dependency audit is clean, and daily / CI gates no longer audit production dependencies only.
- Bundled assets: VRoid Sample A/B/C, Tsukuyomi-chan Type A, and 13 CC0 VRMAs all pass source, redistribution, quality-`keep` (default >75; 75 is `review`), and SHA-256 review. Idle, Speaking, and ten custom actions work out of the box; `assets:release` recomputes every digest.
- Upstream: commit watermark `152b1b4` (2026-08-10, evaluated). Of the 12 commits: 6 rejected (the four VRoid Hub account commits and the #23 scheduler among them), 1 already covered, 1 not applicable, 4 shortlisted. Open PRs: #45 rejected (microphone capture crosses a hard boundary), #47 out of scope, #46 shortlisted, #48 partially adopted and shipped. Open issues: #43 already covered and further hardened, #44 / #18 out of scope, #35 shortlisted, #11 already covered.
- MCP tools: 6; HTTP `character-state`; tray manual state; Speaking secondary head/torso cue shipped.
- System state slots preselect when playable; Settings includes expandable action-pack help and a copyable example; optional “Assign by filename”. Setup progress panel hides after required items are done; clips support preview, rename, purpose, move, and an unassigned pool.
- The 1.0.6 idle pool includes every non-speaking action by default and lets Settings exclude action types; `TALK`, the Speaking slot, and its bound action are forced out. Schema 12 and the store / IPC / preload / renderer paths have contract coverage.

The 1.0.4 candidate used Node 24.19.0 for lint, 305 Node tests, 152 renderer tests, the production build, the release asset gate, and a local `electron-builder` NSIS package; the packaged app contains exactly four VRMs and 13 VRMAs. Release workflow `31795033665` then completed the licensed-asset gate, Node 24 check, Windows native build, NSIS packaging, and publishing; the downloaded SHA-256 and two independent `NotSigned` checks match. A Windows 11, 225% DPI fresh-userData smoke rendered AvatarSample_A and listed the complete catalog; no claim is expanded to formal install/upgrade, 100% / 150% DPI, switching the other three models, or per-clip playback.

### Verification gaps (marked unverified; never fabricate completion)

| Item | Status | Reason |
| --- | --- | --- |
| Real-desktop confirmation of the 0.16.21–0.16.23 idle and speaking shuffle-bag cycling | **Partially verified** | The 1.0 candidate plays Idle and Speaking with visible motion; a full no-repeat round still has only shuffle-bag contract tests because no clip ID is exposed for observation |
| Windows GUI smoke (install/upgrade/uninstall/tray/MCP/DPI/keyboard) | **Partially verified** | Both the local candidate 0.16.23→1.0.0 and formal-download 1.0.0→1.0.2 upgrades preserved settings; Settings, preview, About, MCP/bubbles/window control passed at 225% DPI; uninstall, tray, and keyboard matrix remain open |
| 30% character size and multi-DPI readability | **Partially verified** | 225% DPI at 50% character size is readable; 30% and 100%/150% remain unverified |
| Idle long-run / model-switch memory (GUI residency) | **Unverified** | Only a short GUI session was run; `baseline:startup` excludes GUI |
| Installer signing / publisher / SmartScreen / upgrade path | **Partially verified** | The 1.0.0, 1.0.2, and 1.0.4 formal runner assets are proven `NotSigned` two ways; the 0.16.23→1.0.0 and 1.0.0→1.0.2 upgrades preserved user data, while the formal 1.0.4 upgrade is unverified. SmartScreen and publisher remain open |
| Native COM/WASAPI/Device/Event **real** failure paths | **Unverified** | Usage=2 assertable on runner; real audio/COM failures need the environment |
| Real VRoid/UniVRM/Blender sample results | **Partially verified** | All four bundled VRMs score 100 / `keep`; all 13 bundled VRMAs score 78–100 / `keep`. A Windows fresh-userData smoke rendered AvatarSample_A and listed all four models / 13 clips; switching the other three models, per-clip playback, and other exporters remain open |

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
| v1.0.0 | Stable product contract; UTF-8 fix for Traditional Chinese Windows process discovery; candidate 225% DPI GUI/WASAPI/MCP real-machine smoke |
| v1.0.1 | Post-release `v1.0.0` runner asset/workflow/Latest evidence and old-tag cleanup |
| v1.0.2 | Formal installer desktop reinstall evidence; Settings MCP status reads live runtime state |
| v1.0.3 | `v1.0.2` runner / Latest / formal upgrade and MCP-fix desktop evidence closeout |
| v1.0.4 | Four licensed quality-`keep` VRMs, 13 CC0 quality-`keep` VRMAs, per-file SHA-256 release gate, and exclusion of unlicensed or `review` media |
| v1.0.5 | Upgrade to supported Electron 43, remove symlink-path-traversal-affected `extract-zip`, enforce the full dependency audit in CI, and record the formal clean-install/MCP smoke |
| v1.0.6 | Configurable non-speaking idle pool; forced Speaking / TALK exclusion; schema 12 persistence and UI / IPC contracts |

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
- [x] Idle pool: every non-speaking action defaults in and user exclusions persist; Speaking / TALK and the bound action cannot be enabled, with static / interaction / migration / IPC contracts.

### Still open / unverified (blocked on desktop, secrets, or licensed samples)

- [~] Native COM/WASAPI/Device/Event **real** failure paths (HRESULT / device environment).
- [~] Idle/DPI/30% real-machine readability / GUI smoke / installer signing & SmartScreen (see verification table).
- [~] Real exporter manual results: four bundled VRMs and 13 VRMAs pass the automated quality gate; Windows fresh-userData rendered AvatarSample_A and read the complete packaged catalog. Switching the other three models, per-clip playback, and other exporter samples remain in the full matrix.

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
- [~] Windows real-machine evidence. **Partially verified**; local candidate install/upgrade and 225% DPI smoke passed, while uninstall and the multi-DPI matrix remain open.
- [~] Installer signing. **Unverified**; unsigned builds must be labelled explicitly.
- [x] Settings/catalog/MCP schema version policies and tests.
- [x] Failed imports do not lose data.
- [~] Common exporters’ **real** compatibility results. **Partially verified**: the official VRoid sample passes the automated quality gate and AvatarSample_A passes a fresh-userData display smoke; the other three models and other exporters remain open.
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

1. Fill the remaining real-machine matrix: 100% / 150% DPI, 30% character size, tray, keyboard, uninstall, idle residency, and a full shuffle round with observable clip IDs.
2. When signing secrets, licensed samples, and a controllable COM-failure environment exist, add SmartScreen/publisher, real exporter, and true Native COM/WASAPI/Device/Event failure evidence.
3. After those stability records mature, select the next explicit feature from [`docs/DECISIONS.md`](docs/DECISIONS.md) §1 without expanding the established security boundary.

Action↔VRMA auto-assignment policy is settled (pack / name preselect / whitelist confirm; no semantic guessing); see [`docs/DECISIONS.md`](docs/DECISIONS.md) §10. Do not open a semantic slotting track.
