# VoxAvatar Product Roadmap

[繁體中文](ROADMAP.md) · English

Updated: 2026-08-01

Planning baseline: `v0.8.0` (accumulated on `main`; Latest Release is `v0.5.0`—see D-23).

This roadmap defines product direction, milestone order, and completion criteria. Versions express dependencies, not date commitments. See [`CHANGELOG.md`](CHANGELOG.md) for completed work and [`REVIEW.md`](REVIEW.md) for current repository health. In lists, `- [x]` means done; `-` means not done.

## Product judgment

VoxAvatar should not become another chat UI or compete on the number of bundled characters. Its highest-value position is:

> **A local-first Windows desktop-avatar presentation layer that AI agents can control through a clear, constrained interface.**

The user's actual jobs are:

1. **See it:** keep a stable avatar on the desktop without disrupting normal work.
2. **See speech react:** animate lip sync and motion when a selected app (or explicitly opted-in system output) plays assistant audio.
3. **Let an agent act:** use MCP to play configured actions, control the window, and inspect trustworthy status.
4. **Stay in control:** keep media, settings, and level detection local, with explainable failures and explicit privacy and license boundaries.

```text
v0.1–v0.5   Completed baseline → hardening → media/MCP → maintainability start (see "Completed milestones" below)
   │
   ├─ v0.6.x  Module convergence and renderer/settings testability
   ├─ v0.7.x  Performance baseline deepening and non-first-frame splits
   ├─ v0.8.x  Asset exporter compatibility matrix (synthetic + public docs)
   ├─ v0.9.x  Windows real-machine/signing/native acceptance track (may start later; does not block 0.6–0.8)
   └─ v1.0.0  Long-term trust threshold
```

SemVer pace: capability or security-boundary hardening ships as a **minor**; use patch only for pure fixes. Windows real-machine work and signing **must not** block 0.6–0.8 (D-23).

## Priority order

1. **Privacy, security, licensing, and release correctness**
2. **First-run success and recoverable failures**
3. **Maintainability and testability (locally verifiable)**
4. **Asset compatibility documentation and synthetic matrix**
5. **Windows real-machine/signing/native (when a desktop or signing keys are available)**
6. **More visual or action features**

## Existing foundation, do not rebuild it

- [x] Windows-only Electron overlay, transparent-area click-through, drag/zoom/rotate, and reliable tray controls.
- [x] WASAPI application-loopback helper; first-run readiness/diagnostic summary; helper state model.
- [x] VRM/VRMA import, folder import, quality reports, clip ordering, migration fixtures.
- [x] Loopback-only MCP (JSON schema, session TTL, multi-client, action queue), HTTP/`voxavatar://`.
- [x] Avatar/settings preload split; CI, CodeQL, Dependabot, NSIS, SHA-256, batch Release.
- [x] Settings lazy-load, bundle/SBOM/evidence scripts, synthetic compatibility matrix skeleton.

## Completed milestones (summary)

| Series | Representative outcomes |
| --- | --- |
| v0.1.x | First stable Windows baseline, licensing/CI/Release trust root |
| v0.2.x | Discovery/matcher/IPC/session, readiness, diagnostics, preload, action queue |
| v0.3.x | Import confirmation, schema 4/5→6 fixtures, clip ordering, report navigation |
| v0.4.x | MCP JSON schema, integration docs, multi-client tests |
| v0.5.x | Migration/sanitize/renderer-windows/SettingsModels split start, bundle baseline, matrix skeleton |
| v0.6.x | SettingsAnimations/Voice, settings-ipc/asset-validation, scene-error-recovery, roadmap tracks |
| v0.7.x | Bundle compare/guidance, startup baseline, Appearance/MCP/Preview splits |
| v0.8.x | Expanded synthetic matrix, exporter notes, import-failure catalog safety |

Historical detail is in [`CHANGELOG.md`](CHANGELOG.md). The sections below list only **unfinished** and **newly planned** work.

---

## v0.6.x: module convergence and testability

Goal: keep splitting large files so common settings/IPC changes do not require touching all of `SettingsPage`/`main`/store at once; add error-recovery tests that can run on Linux CI.

### Work

- [x] Continue splitting `SettingsPage` sections: `SettingsAnimationsSection`, `SettingsVoiceSection` (appearance/mcp/preview continued in v0.7).
- [x] Extract settings IPC registration from `main.cjs` into `settings-ipc.cjs` (overlay lifecycle can still split further).
- [x] Extract `settings-asset-validation.cjs`; store CRUD boundaries can keep converging.
- [x] Add Scene/preview error-recovery pure-function tests (`scene-error-recovery`); jsdom App integration and protocol/tray desktop smoke remain later/v0.9.
- Protocol/tray desktop smoke remains in v0.9 (real machine).

### Completion criteria

- [x] `SettingsPage`/`main`/`settings-store` line counts drop meaningfully; sections/IPC/store have clear boundaries (further splits welcome).
- [x] Scene/preview error recovery has automated coverage of the main path (pure helper + Scene boundary).
- [x] `npm run check` stays green; Visual Studio Build Tools are not required for this work.

## v0.7.x: performance baseline deepening

Goal: use repeatable data to guide bundle splits and deferred loading—not bundle warnings alone.

### Work

- [x] Extend `baseline:bundle`: record historical comparisons and threshold guidance (documented, not telemetry).
- [x] Further split non-first-frame code (`SettingsAppearanceSection` / `SettingsMcpSection` / `SettingsPreviewPanel`; heavier quality-report views can still split later).
- [x] Software-side timing scripts (`baseline:startup` Node `require()` timing; real-machine memory belongs in v0.9).
- Repeatable local baseline notes for long idle runs and model switching (real machine in v0.9; docs already mark the boundary).

### Completion criteria

- [x] At least two comparable bundle/startup baseline recording methods are documented in development docs.
- [x] After non-first-frame splits, the overlay first-frame chunk does not regress to pre-split levels (per `baseline:bundle`; SettingsPage remains a lazy chunk).

## v0.8.x: asset exporter compatibility matrix

Goal: expand the synthetic matrix into maintainable public compatibility documentation without committing unauthorized binary media.

### Work

- [x] Extend [`docs/VRM_VRMA_COMPATIBILITY.md`](docs/VRM_VRMA_COMPATIBILITY.md): mark common exporters/versions and known limits from public information.
- [x] Add synthetic cases (skeleton coverage, expressions, missing textures, motion spikes/short/no-animation/loop seam, etc.) and wire them to automated tests.
- [x] Keep import failure/skip paths from breaking the existing library (regression tests).
- Real vendor-file manual evidence may follow when lawful samples are available; it does **not** block this series' docs and synthetic tests.

### Completion criteria

- [x] The public matrix covers main failure modes, and each case maps to an automated test or an explicit "manual pending" marker.
- [x] Incompatible imports do not leave half-finished catalog records.

## v0.9.x: Windows real-machine/signing/native track

Goal: collect real-machine and native work previously **extracted and deferred** from 0.1–0.5 into one acceptance track. The whole section may pause without a Windows desktop or signing keys; it does not block 0.6–0.8.

### Work

- Fill versioned `docs/release-evidence/v{version}/windows-smoke.md` (install/upgrade/uninstall, protocol, tray, MCP).
- Real-machine acceptance on Windows 10/11, DPI (100%/150%/225%), and keyboard focus.
- Installer signing (`WIN_CSC_*`) and SmartScreen/upgrade-path validation.
- Native helper: COM/WASAPI capture typed failures and non-zero exits; real-machine playback, device switch, and recovery tests.
- Protocol/tray/desktop E2E smoke.

### Completion criteria

- At least one release has complete smoke evidence and checksum cross-checks.
- Signing status matches Release notes and SECURITY; unsigned builds must not claim SmartScreen pass.
- Native failure paths have testable error types or exit-code contracts.

## v1.0.0 criteria

`1.0.0` means users can trust the product contract long-term. It does not mean maximizing feature count.

- [x] No known P0/P1; no unresolved CodeQL/production high alerts (per current `REVIEW`).
- Windows 10/11 install, upgrade, uninstall, first-run setup, lip sync, media, and MCP have real-machine evidence (v0.9).
- Signed-installer publisher, SmartScreen, and update-path validation are complete; unsigned releases cannot qualify for 1.0.
- [x] Settings/catalog/MCP schema have version policies and migration tests for the last two MINOR releases (may keep strengthening).
- Common VRM/VRMA exporters have a public compatibility matrix; failures do not lose data (v0.8 + manual evidence).
- Every user-triggered operation reports success or failure; no known silent failure remains.
- [x] Privacy, loopback, media licensing, Windows-only scope, and upstream attribution remain verifiable.

## Measurement

VoxAvatar will not add telemetry. Metrics come from automated tests, benchmarks, GitHub workflows, and versioned manual smoke evidence.

| Metric | Target |
| --- | --- |
| Unresolved P0/P1 | 0 |
| High CodeQL security alerts | 0 |
| High-or-higher production audit vulnerabilities | 0 |
| Release tag/package/Latest/installer/checksum agreement | 100% (on batch Release) |
| Known existing-library data loss after failed import | 0 cases |
| MCP boundary and tool-contract regression tests | All pass on every CI run |

## Main risks and defenses

| Risk or dependency | Consequence | Defense and evidence |
| --- | --- | --- |
| Windows drivers and target apps differ | Listener fails | Helper states, v0.9 real-machine matrix |
| VRM/VRMA exporters differ | Broken avatar, expression, or motion | Synthetic matrix, import validation, v0.8 docs |
| Unsigned installer | SmartScreen friction | State signing status clearly; complete v0.9 signing before 1.0 |
| Local MCP has no authentication | Same-account processes can control the avatar | Loopback/schema bounds; no privilege expansion |
| Large files regress | Rising regression cost | v0.6 continued splits, behavior tests, bundle baseline |

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
3. Use automated tests for logic; use Windows real-machine smoke for WASAPI, transparent windows, tray behavior, and installers (v0.9).
4. Pass at least `npm run check`; native and Release work runs the full gate on a GitHub Windows runner.
5. **Before every push**, review and sync Traditional Chinese/English public docs plus `CHANGELOG.md`.
6. After push, verify CI and CodeQL; **on batch Release**, also verify published Latest, tag SHA, installer, and checksum.
7. Delete older Releases/tags only after a successful new Release, keeping only the latest; leave older ones untouched if the new Release fails.
8. Mark roadmap work complete only when completion criteria have evidence; v0.9 real-machine items do not block v0.6–0.8.
9. After an interrupted session, agents and maintainers must resume unfinished work automatically; see [`AGENTS.md`](AGENTS.md).

## Next three actions

1. [x] **Finish v0.6:** further Settings/IPC/asset-validation splits, error-recovery tests, and roadmap replan.
2. [x] **Finish this v0.7 / v0.8 slice:** deepen bundle/startup baselines, further settings splits, expand synthetic matrix and exporter notes.
3. **Open v0.9 only with Windows/secrets:** smoke evidence, signing, native capture; until then do not idle-spin Releases. Remaining Linux-CI work: overlay lifecycle extraction, settings-store CRUD boundaries, App jsdom integration tests.
