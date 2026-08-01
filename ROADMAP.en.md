# VoxAvatar Product Roadmap

[繁體中文](ROADMAP.md) · English

Updated: 2026-08-01

Planning baseline: `v0.1.0`

This roadmap defines product direction, milestone order, and completion criteria. Versions express dependencies, not date commitments. See [`CHANGELOG.md`](CHANGELOG.md) for completed work and [`REVIEW.md`](REVIEW.md) for current repository health.

## Product judgment

VoxAvatar should not become another chat UI or compete on the number of bundled characters. Its highest-value position is:

> **A local-first Windows desktop-avatar presentation layer that AI agents can control through a clear, constrained interface.**

The user's actual jobs are:

1. **See it:** keep a stable avatar on the desktop without disrupting normal work.
2. **See speech react:** animate lip sync and motion when a selected app plays assistant audio.
3. **Let an agent act:** use MCP to play configured actions, control the window, and inspect trustworthy status.
4. **Stay in control:** keep media, settings, and level detection local, with explainable failures and explicit privacy and license boundaries.

```text
v0.1.x  Stabilize the first Windows release baseline
   │
   ├─ v0.2  First-run setup, diagnostics, and installer validation
   ├─ v0.3  VRM/VRMA compatibility and media lifecycle
   ├─ v0.4  MCP contracts, status, and multi-client reliability
   └─ v0.5  Maintainability, startup, and renderer performance
        │
        ▼
v1.0: a Windows desktop avatar and local agent interface users can trust long-term
```

## Existing foundation, do not rebuild it

- Windows-only Electron overlay, transparent-area click-through, avatar drag/zoom/rotate, and reliable tray controls.
- A WASAPI application-loopback helper that measures only selected-app playback level.
- Local VRM/VRMA import, folder import, quality reports, custom actions, and common presets.
- Loopback-only MCP, HTTP event API, `voxavatar://` protocol, and a live action catalog.
- Traditional Chinese and English settings UI. Settings opens when no model is configured, with lawful-media guidance.
- CI, CodeQL, guarded Dependabot auto-merge, media-license gates, NSIS, and SHA-256 releases.

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

- Clear current CodeQL alerts by reading asset metadata from an already-open file descriptor and removing an unused function argument.
- Enable GitHub Dependabot security alerts and automated security-fix proposals while retaining the existing risk policy for normal updates.
- Keep `LICENSE` as canonical MIT text; keep third-party media exclusions and redistribution rules in `NOTICE.md` and `ASSET_LICENSES.md`.
- Separate regular Node/Electron development from native C++ and installer tooling so every contributor does not need Visual Studio Build Tools.
- Define a downloaded-installer smoke record covering install, first launch, model import, voice source, tray, MCP, upgrade, and uninstall.

### Completion criteria

- `main` has no unresolved CodeQL security or quality alerts.
- Dependabot security alerts are enabled and production audit has no high-or-higher vulnerability.
- GitHub recognizes the MIT license while the media-license gate remains fail closed.
- Release tag, package version, installer, Latest status, and SHA-256 agree.
- Real Windows smoke evidence is traceable; unsigned installers are not presented as SmartScreen-signing validated.

## v0.2.0: first-run setup and recoverable diagnostics

Goal: a new user can import a character, select a voice source, and connect MCP, or understand exactly why a step failed.

### Work

- Turn first-run setup into a progress checklist for model, optional actions, voice source, MCP health, and completion state.
- Give the native helper explicit states: missing, launch failed, target process missing, no output, and listening.
- Add a copyable diagnostic summary that redacts usernames, absolute paths, and media filenames by default and never includes audio or model content.
- Make `get_status` and Settings share one readiness and error vocabulary.
- Establish a real Windows 10/11 matrix for install, upgrade, uninstall, and protocol registration.
- Replace fixed process discovery with a PID-liveness fast path and adaptive backoff, and define active-source or multi-root semantics when several roots match.
- Restrict custom process matchers to a non-explosive safe subset, or use RE2 or timeout-isolated execution.

### Completion criteria

- Every incomplete first-run step has a reason and an executable next action.
- Common helper and source failures are recognizable without opening DevTools.
- Settings and MCP cannot report contradictory states for the same condition.
- Diagnostic summaries pass sensitive-data tests and can be attached directly to an issue.
- Stable capture no longer launches a full PowerShell process scan every 1.5 seconds, and multiple matching roots have predictable selection behavior.
- Malicious or pathological matchers cannot block the Electron main process.

## v0.3.0: media compatibility and lifecycle

Goal: users can understand availability, quality, and migration results before relying on assets from different exporters.

### Work

- Publish a verified VRM 0.x/1.0 and common VRMA exporter matrix covering skeleton, expression, texture, and motion results.
- Show format, size, and quality summaries before import; failures must not leave partial catalog records.
- Add explicit schema versions and migration fixtures for Settings and the library catalog across the last two MINOR releases.
- Improve action preview, clip ordering, and navigation from a quality report to the affected action.
- Preserve separate decisions for lawful local import and project redistribution permission.

### Completion criteria

- Every matrix entry has an automated fixture or versioned manual evidence.
- Interrupted, duplicate, corrupt, oversized, or incompatible imports cannot damage the existing library.
- Settings and catalogs from the last two MINOR releases migrate safely; failed migrations preserve original data and explain the problem.

## v0.4.0: a stable local MCP contract

Goal: agents do not guess tool capabilities, action names, or error states, and long-lived sessions do not use stale catalogs.

### Work

- Version MCP status and tool-output schemas, with an explicit SemVer compatibility policy.
- Add Codex and generic Streamable HTTP examples for port changes, reconnects, and troubleshooting.
- Validate multiple local clients, long-session catalog refresh, and app close/restart behavior.
- Add idle TTL, a hard capacity limit, and testable eviction/close behavior for MCP sessions.
- Separate avatar and Settings preload privileges, and validate sender, frame, and app URL for every privileged IPC handler.
- Define bounded queueing or throttling for repeated high-frequency actions so the renderer cannot be flooded indefinitely.
- Keep the visual-control scope. Do not add arbitrary commands, arbitrary files, network proxying, or speech generation.

### Completion criteria

- Supported clients never need to parse human prose to determine state.
- Breaking schema changes include version and migration guidance.
- App restart, disconnect, multiple clients, and action updates have automated tests or reproducible smoke evidence.
- MCP remains loopback-only with complete boundary tests.
- Abandoned or excessive sessions cannot grow without bound, and the avatar renderer cannot call Settings or asset-management IPC.

## v0.5.0: maintainability and performance

Goal: new features do not turn one Settings page, the main process, and the settings store into permanent change bottlenecks.

### Work

- Split `SettingsPage.tsx`, `electron/main.cjs`, and `settings-store.cjs` by responsibility, preserving behavior tests before moving code.
- Benchmark cold launch, first avatar display, model switching, long idle sessions, and large libraries.
- Use bundle analysis to defer Settings, quality-report, and other non-first-frame code without harming overlay startup.
- Add Windows keyboard, focus-order, scaling, and high-DPI acceptance checks.
- Give native COM/WASAPI capture failures typed errors and non-zero exits, with real-machine playback, device-switch, and recovery tests.
- Add component tests for App, Settings, and Scene recovery plus desktop smoke for protocol, tray, and MCP behavior.
- Evaluate an SBOM and release-evidence manifest so installer contents and dependencies are auditable.

### Completion criteria

- Large files have clear module ownership, and common changes do not require simultaneous renderer, main, and store edits.
- Performance improvements include before/after data; silencing a bundle warning is not itself success.
- Core keyboard flows at 100%, 150%, and 225% DPI have no blocking clipping or focus failures.
- A release can provide installer, checksum, dependency inventory, and version evidence together.

## v1.0.0 criteria

`1.0.0` means users can trust the product contract long-term. It does not mean maximizing feature count.

- No known P0/P1, unresolved high CodeQL alert, or unresolved high production security alert.
- Windows 10/11 install, upgrade, uninstall, first-run setup, lip sync, media, and MCP have real-machine evidence.
- Signed-installer publisher, SmartScreen, and update-path validation are complete. An unsigned release cannot qualify for 1.0.
- Settings, catalog, MCP status, and tool schemas have stable version policies and migration tests for the last two MINOR releases.
- Common VRM/VRMA exporters have a public compatibility matrix, and failures do not lose data.
- Every user-triggered operation reports success or failure; no known silent failure remains.
- Privacy, loopback, media licensing, Windows-only scope, and upstream attribution remain verifiable.

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

- No microphone capture, recording, audio retention, upload, or transcription.
- No LAN or Internet exposure for MCP or the HTTP bridge.
- No arbitrary commands, arbitrary file access, network proxy, or remote-desktop capability.
- No bundled or redistributed VRM/VRMA without verified permission.
- No restored Linux, PipeWire, Hyprland, macOS-native, or cross-platform releases.
- No embedded LLM, model-account management, or replacement chat client.
- No product success metric based on the number of characters, actions, or agents.

## Execution rules

1. Write user-visible outcomes as acceptance criteria first.
2. Record security, licensing, schema, and product tradeoffs in [`docs/DECISIONS.md`](docs/DECISIONS.md).
3. Use automated tests for logic and real Windows smoke for WASAPI, transparent windows, tray behavior, and installers.
4. Pass at least `npm run check`; native and Release work runs the full gate on a GitHub Windows runner.
5. Keep Traditional Chinese and English public docs plus `CHANGELOG.md` synchronized.
6. After push, verify CI, CodeQL, published Latest Release, tag SHA, installer, and checksum.
7. Mark roadmap work complete only when the completion criteria have evidence.

## Next three actions

1. **Close v0.1.x trust gaps:** clear CodeQL alerts, enable Dependabot security alerts, restore MIT detection, and ship the maintenance release.
2. **Define release smoke evidence:** download the GitHub installer and record Windows build, install/uninstall, first launch, voice source, and MCP results.
3. **Design the v0.2 readiness model:** give Settings and `get_status` one vocabulary for model, helper, voice source, and MCP state.
