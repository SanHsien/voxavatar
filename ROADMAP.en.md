# VoxAvatar Product Roadmap

[繁體中文](ROADMAP.md) · English

Updated: 2026-08-01

Planning baseline: `v0.4.0` (accumulated on `main`; Latest Release may still point at an earlier tag—see D-23)

This roadmap defines product direction, milestone order, and completion criteria. Versions express dependencies, not date commitments. See [`CHANGELOG.md`](CHANGELOG.md) for completed work and [`REVIEW.md`](REVIEW.md) for current repository health. In lists, `- [x]` means done (may appear under any version section); `-` means not done.

## Product judgment

VoxAvatar should not become another chat UI or compete on the number of bundled characters. Its highest-value position is:

> **A local-first Windows desktop-avatar presentation layer that AI agents can control through a clear, constrained interface.**

The user's actual jobs are:

1. **See it:** keep a stable avatar on the desktop without disrupting normal work.
2. **See speech react:** animate lip sync and motion when a selected app (or explicitly opted-in system output) plays assistant audio.
3. **Let an agent act:** use MCP to play configured actions, control the window, and inspect trustworthy status.
4. **Stay in control:** keep media, settings, and level detection local, with explainable failures and explicit privacy and license boundaries.

```text
v0.1.x  Stabilize the first Windows release baseline (complete through 0.1.2)
   │
   ├─ v0.2.x  Diagnostics/discovery hardening → first-run and installer closed loop
   ├─ v0.3.x  VRM/VRMA compatibility and media lifecycle
   ├─ v0.4.x  MCP contracts, status, and multi-client reliability
   └─ v0.5.x  Maintainability, startup, and renderer performance
        │
        ▼
v1.0.0: a Windows desktop avatar and local agent interface users can trust long-term
```

SemVer pace: capability or security-boundary hardening ships as a **minor** (for example `0.1.2` → `0.2.0`); do not pile features into a long `0.1.x` series. Use patch only for pure fixes.

## Existing foundation, do not rebuild it

- [x] Windows-only Electron overlay, transparent-area click-through, avatar drag/zoom/rotate, and reliable tray controls.
- [x] A WASAPI application-loopback helper that measures only selected-app playback level.
- [x] Local VRM/VRMA import, folder import, quality reports, custom actions, and common presets.
- [x] Loopback-only MCP, HTTP event API, `voxavatar://` protocol, and a live action catalog.
- [x] Traditional Chinese and English settings UI. Settings opens when no model is configured, with lawful-media guidance.
- [x] CI, CodeQL, guarded Dependabot auto-merge, media-license gates, NSIS, and SHA-256 releases.

New work should close user loops around these capabilities. Make listener failures diagnosable before adding a second audio path.

## Priority order

1. **Privacy, security, licensing, and release correctness**
2. **First-run success and recoverable failures**
3. **Windows, VRM/VRMA, and application compatibility**
4. **MCP contract and status fidelity**
5. **Maintainability, performance, and accessibility**
6. **More visual or action features**

## v0.1.x: close stable-baseline gaps

Goal: prove the `0.1.0` promise through code, GitHub state, and downloaded artifacts.

### Work

- [x] Clear current CodeQL alerts by reading asset metadata from an already-open file descriptor and removing an unused function argument.
- [x] Enable GitHub Dependabot security alerts and automated security-fix proposals while retaining the existing risk policy for normal updates.
- [x] Keep `LICENSE` as canonical MIT text; keep third-party media exclusions and redistribution rules in `NOTICE.md` and `ASSET_LICENSES.md`.
- [x] Separate regular Node/Electron development from native C++ and installer tooling so every contributor does not need Visual Studio Build Tools.
- [x] Define a downloaded-installer smoke record covering install, first launch, model import, voice source, tray, MCP, upgrade, and uninstall.

### Completion criteria

- [x] `main` has no unresolved CodeQL security or quality alerts.
- [x] Dependabot security alerts are enabled and production audit has no high-or-higher vulnerability.
- [x] GitHub recognizes the MIT license while the media-license gate remains fail closed.
- [x] Release tag, package version, installer, Latest status, and SHA-256 agree.
- [x] Unsigned installers are not presented as SmartScreen-signing validated.
- ~~Real Windows smoke evidence is traceable~~ **Deferred (not a v0.3+ blocker, D-23)**: format exists; filled records wait for a Windows desktop.

## v0.2.x: diagnostics hardening and first-run closed loop

Goal: `0.2.0` hardens listener, matcher, IPC, and MCP session reliability; later `0.2.x` closes first-run progress, diagnostics, and the real-machine matrix.

### Work

- [x] Turn first-run setup into a progress checklist for model, optional actions, voice source, MCP health, and completion state.
- [x] Give the native helper explicit states: missing, launch failed, target process missing, no output, and listening.
- [x] Add a copyable diagnostic summary that redacts usernames, absolute paths, and media filenames by default and never includes audio or model content.
- [x] Make `get_status` and Settings share one readiness and error vocabulary.
- ~~Establish a real Windows 10/11 matrix for install, upgrade, uninstall, and protocol registration.~~ **Deferred (not a v0.3+ blocker, D-23)**: add versioned evidence when a Windows desktop is available.
- [x] Replace fixed process discovery with a PID-liveness fast path and adaptive backoff, and define sticky active-source semantics for multiple matching roots (`0.2.0`).
- [x] Restrict custom process matchers to a non-explosive safe subset (`0.2.0`).
- [x] Add MCP session idle TTL, hard capacity, and testable eviction (pulled forward from `0.4` into `0.2.0`).
- [x] Validate sender URL on privileged IPC; avatar/Settings preload split and Settings webContents binding shipped in `0.2.9`.

### Completion criteria

- [x] Every incomplete first-run step has a reason and an executable next action.
- [x] Common helper and source failures are recognizable without opening DevTools.
- [x] Settings and MCP cannot report contradictory states for the same condition.
- [x] Diagnostic summaries pass sensitive-data tests and can be attached directly to an issue.
- [x] Stable capture no longer launches a full PowerShell process scan on every poll, and multiple matching roots have predictable sticky selection.
- [x] Malicious or pathological matchers cannot block the Electron main process.
- [x] Abandoned or excessive MCP sessions cannot grow without bound.

## v0.3.x: media compatibility and lifecycle

Goal: users can understand availability, quality, and migration results before relying on assets from different exporters.

### Work

- Publish a verified VRM 0.x/1.0 and common VRMA exporter matrix covering skeleton, expression, texture, and motion results.
- [x] Show format and quality summaries before import and write to the catalog only after confirmation (folder-import dialog; failure reasons and strict skip behavior remain).
- [x] Add explicit schema versions and migration fixtures for the settings catalog across the last two MINOR releases (schema 4/5→6; back up the original file when migration is not possible).
- [x] Improve clip reordering and quality-report navigation (move up/down, reveal report in File Explorer).
- [x] Preserve separate decisions for lawful local import and project redistribution permission.

### Completion criteria

- Every matrix entry has an automated fixture or versioned manual evidence.
- [x] Interrupted, duplicate, corrupt, oversized, or incompatible imports cannot damage the existing library.
- [x] Settings and catalogs from the last two MINOR releases upgrade safely; failed migrations preserve original data and explain the problem.

## v0.4.x: a stable local MCP contract

Goal: agents do not guess tool capabilities, action names, or error states, and long-lived sessions do not use stale catalogs.

### Work

- [x] Version MCP status and tool-output schemas, with an explicit SemVer compatibility policy (`status_schema_version` / `tools_schema_version`).
- [x] Add Codex and generic Streamable HTTP client examples for port changes, reconnects, and troubleshooting (`docs/INTEGRATIONS.md`).
- [x] Validate multiple local MCP clients, long-session catalog refresh, and handler close/restart behavior (automated tests).
- [x] Add idle TTL, a hard capacity limit, and testable eviction/close behavior for MCP sessions (shipped in `0.2.0`).
- [x] Separate avatar and Settings preload privileges; sender URL validation shipped in `0.2.0`, window binding completed in `0.2.9`.
- [x] Define bounded queueing or throttling for repeated high-frequency actions so the renderer cannot be flooded indefinitely.
- [x] Keep the visual-control scope. Do not add arbitrary commands, arbitrary files, network proxying, or speech generation.

### Completion criteria

- [x] Supported clients never need to parse human prose to determine state (tool results are parseable JSON).
- [x] Breaking schema changes include version and migration guidance (INTEGRATIONS / DECISIONS).
- [x] App restart, client disconnect, multiple clients, and action updates have automated tests or reproducible smoke evidence.
- [x] MCP remains loopback-only with complete boundary tests.
- [x] Abandoned or excessive sessions cannot grow without bound.
- [x] The avatar renderer cannot call Settings or asset-management IPC (preload split and Settings webContents checks are in place).

## v0.5.x: maintainability and performance

Goal: new features do not turn one Settings page, the main process, and the settings store into permanent change bottlenecks.

### Work

- Split `SettingsPage.tsx`, `electron/main.cjs`, and `settings-store.cjs` by responsibility, preserving behavior tests before moving code.
- [x] Extract folder-import evaluate helper (`directory-import.cjs`); continue splitting Settings, main, and store.
- Benchmark cold launch, first avatar display, model switching, long idle sessions, and large libraries.
- [x] Lazy-load Settings (`React.lazy`) without sacrificing overlay first paint; quality-report and other non-first-frame splits remain.
- Add Windows keyboard, focus-order, scaling, and high-DPI acceptance checks.
- Give native COM/WASAPI capture failures typed errors and non-zero exits, with real-machine playback, device-switch, and recovery tests.
- Add component tests for App, Settings, and Scene recovery plus desktop smoke for protocol, tray, and MCP behavior.
- [x] Provide a production dependency SBOM script (`npm run sbom`); release-evidence manifest and installer inventory remain.

### Completion criteria

- Large files have clear module ownership, and common changes do not require simultaneous renderer, main, and store edits.
- Performance improvements include before/after data; silencing a bundle warning is not itself success.
- Core keyboard flows at 100%, 150%, and 225% DPI have no blocking clipping or focus failures.
- A release can provide installer, checksum, dependency inventory, and version evidence together.

## v1.0.0 criteria

`1.0.0` means users can trust the product contract long-term. It does not mean maximizing feature count.

- [x] No known P0/P1, unresolved high CodeQL alert, or unresolved high production security alert.
- Windows 10/11 install, upgrade, uninstall, first-run setup, lip sync, media, and MCP have real-machine evidence.
- Signed-installer publisher, SmartScreen, and update-path validation are complete. An unsigned release cannot qualify for 1.0.
- Settings, catalog, MCP status, and tool schemas have stable version policies and migration tests for the last two MINOR releases.
- Common VRM/VRMA exporters have a public compatibility matrix, and failures do not lose data.
- Every user-triggered operation reports success or failure; no known silent failure remains.
- [x] Privacy, loopback, media licensing, Windows-only scope, and upstream attribution remain verifiable.

## Measurement

VoxAvatar will not add telemetry. Metrics come from automated tests, benchmarks, GitHub workflows, and versioned manual smoke evidence.

| Metric | Target |
| --- | --- |
| Unresolved P0/P1 | 0 |
| High CodeQL security alerts | 0 |
| High-or-higher production audit vulnerabilities | 0 |
| Release tag/package/Latest/installer/checksum agreement | 100% |
| Blocking defects in the verified Windows install matrix | 0 |
| Known existing-library data loss after failed import | 0 cases |
| MCP boundary and tool-contract regression tests | All pass on every CI run |

Startup, memory, and renderer-bundle targets will be set from a v0.5 baseline instead of invented in advance.

## Main risks and defenses

| Risk or dependency | Consequence | Defense and evidence |
| --- | --- | --- |
| Windows builds, audio drivers, and target apps differ | Listener has no output or cannot attach | Helper states, fixtures, and a Windows 10/11 real-machine matrix |
| VRM/VRMA exporters differ | Broken avatar, expression, or motion | Import validation, compatibility matrix, and versioned fixtures |
| Unsigned installer | SmartScreen friction and low trust | State signing status clearly; complete signing validation before 1.0 |
| Local MCP has no authentication | Same-account processes can control the avatar | Loopback, Host/origin/schema bounds, and no sensitive capabilities |
| Third-party media terms are complex | Redistribution violation | No bundled media by default, fail-closed manifests, and human license evidence |
| Large renderer/main files continue growing | Cross-feature regressions become easier | Behavior-first tests, responsibility-based splits, and bundle/startup benchmarks |

## Explicit non-goals

- [x] No microphone capture, recording, audio retention, upload, or transcription.
- [x] No LAN or Internet exposure for MCP or the HTTP bridge.
- [x] No arbitrary commands, arbitrary file access, network proxy, or remote-desktop capability.
- [x] No bundled or redistributed VRM/VRMA without verified permission.
- [x] No restored Linux, PipeWire, Hyprland, macOS-native, or cross-platform releases.
- [x] No embedded LLM, model-account management, or replacement chat client.
- [x] No product success metric based on the number of characters, actions, or agents.

## Execution rules

1. Write user-visible outcomes as acceptance criteria first.
2. Record security, licensing, schema, and product tradeoffs in [`docs/DECISIONS.md`](docs/DECISIONS.md).
3. Use automated tests for logic and real Windows smoke for WASAPI, transparent windows, tray behavior, and installers.
4. Pass at least `npm run check`; native and Release work runs the full gate on a GitHub Windows runner.
5. **Before every push**, review and sync Traditional Chinese / English public docs plus `CHANGELOG.md` (including `README`, `ROADMAP`, `SECURITY`, `REVIEW`, decisions, and process docs); confirm the review even when no edit is needed.
6. After push, verify CI and CodeQL; **on batch Release**, also verify published Latest, tag SHA, installer, and checksum (routine bumps do not publish).
7. Delete older Releases/tags only after a successful new Release, keeping only the latest; leave older ones untouched if the new Release fails.
8. Mark roadmap work complete only when the completion criteria have evidence; deferred Windows real-machine items do not block later milestones (D-23).
9. After an interrupted session, agents and maintainers must resume unfinished work automatically; see [`AGENTS.md`](AGENTS.md).

## Next three actions

1. [x] **Close v0.1.x / v0.2.x baseline and hardening** (including preload split and bounded action queue).
2. [x] **Advance v0.3 / v0.4:** migration fixtures, import confirmation summaries, clip ordering / report navigation, MCP schema JSON, multi-client tests, integration docs.
3. **Continue v0.5:** split large modules, error-recovery component tests, performance benchmarks; defer exporter matrix, real-machine, and signing evidence.
