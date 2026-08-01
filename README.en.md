<p align="center">
  <img src="./public/assets/avatar.png" alt="VoxAvatar" width="144" />
</p>

<h1 align="center">VoxAvatar</h1>

<p align="center"><strong>Give your AI assistant a talking, animated, MCP-controlled VRM presence on the Windows desktop.</strong></p>

<p align="center">
  <a href="./README.md">繁體中文</a> · English ·
  <a href="https://github.com/SanHsien/voxavatar/releases/latest">Latest release</a> ·
  <a href="./ROADMAP.en.md">Product roadmap</a>
</p>

[![Release](https://img.shields.io/github/v/release/SanHsien/voxavatar?sort=semver)](https://github.com/SanHsien/voxavatar/releases/latest)
[![CI](https://github.com/SanHsien/voxavatar/actions/workflows/ci.yml/badge.svg)](https://github.com/SanHsien/voxavatar/actions/workflows/ci.yml)
[![CodeQL](https://github.com/SanHsien/voxavatar/actions/workflows/codeql.yml/badge.svg)](https://github.com/SanHsien/voxavatar/actions/workflows/codeql.yml)
[![Windows Release](https://github.com/SanHsien/voxavatar/actions/workflows/release.yml/badge.svg)](https://github.com/SanHsien/voxavatar/actions/workflows/release.yml)
[![Node.js 24](https://img.shields.io/badge/Node.js-24-339933.svg?logo=nodedotjs&logoColor=white)](package.json)
[![Platform: Windows 10/11](https://img.shields.io/badge/Platform-Windows%2010%2F11-0078D4.svg?logo=windows11&logoColor=white)](#requirements)
[![Local-first](https://img.shields.io/badge/Architecture-Local--first-2E7D32.svg)](#privacy-and-security-boundaries)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> VoxAvatar is derived from [`xikhar/persona`](https://github.com/xikhar/persona) and independently maintained at [`SanHsien/voxavatar`](https://github.com/SanHsien/voxavatar). This fork supports Windows only. See [`NOTICE.md`](NOTICE.md) for provenance and attribution.

## What it is

VoxAvatar is a Windows-only, local-first VRM desktop companion. It measures the **playback level** of a selected application so the avatar can lip-sync and enter its Speaking motion. Codex and other compatible agents can also use the local MCP server to play actions, show or hide the avatar, and inspect status.

It is not another chatbot and does not run a language model. VoxAvatar focuses on being the local visual-presence layer for an AI assistant: characters, actions, settings, and audio-level decisions stay on the computer.

## Feature overview

| Area | Capability |
| --- | --- |
| Voice lip sync | WASAPI application/system-output loopback for lip sync and Speaking, with explicit helper states (`missing` / `target_missing` / `no_output` / `listening`) |
| Desktop avatar | Transparent topmost window, transparent-area click-through, drag, zoom, rotate, show/hide, and tray controls (including reset view) |
| Local media | Imports `.vrm` and `.vrma`, evaluate-and-import folders, VRM 0.x/1.0 and VRMA quality reports, strict gate, bulk deletion, and custom actions |
| First-run setup | Settings checklist (model / optional actions / voice / MCP) and a copyable diagnostic summary with path and asset-name redaction |
| Action system | Idle and Speaking system slots, random multi-clip playback, common presets, and a live MCP catalog |
| Agent integration | Loopback-only MCP, versioned `get_status` readiness, HTTP event API, and the `voxavatar://` URL protocol |
| Release quality | Windows CI, CodeQL, media-license gate, NSIS installer, and SHA-256 checksum |

## Capabilities unique to this fork

Relative to [`xikhar/persona`](https://github.com/xikhar/persona), this fork is intentionally a **Windows-only local presence layer**, with the product capabilities below (see [`CHANGELOG.md`](CHANGELOG.md) and [`docs/DECISIONS.md`](docs/DECISIONS.md)):

### Platform and identity

- Maintains only Windows WASAPI, NSIS, and desktop behavior; does not restore PipeWire, Hyprland, macOS native, or Linux/macOS distribution targets.
- Product identity is always **VoxAvatar / `voxavatar`** (appId, MCP CLI, `voxavatar://`, `VOXAVATAR_*`, `voxavatar-asset:`, native helper name).
- Public docs default to Traditional Chinese, with English counterparts.

### Desktop interaction

- Transparent-area click-through; left-drag move, mouse-wheel zoom (minimum 30%), middle-drag rotate, and a right-click shortcut menu.
- Reliable Windows tray: left-click show/hide; right-click menu (reset view, listening/speaking preview, settings, about).
- Reset view from both tray and avatar menus; About shows the app version.

### Voice and listener

- Voice sources: default / selected application / custom process matcher / external events / **system-output mix (opt-in, privacy warning in Settings)**.
- Searchable catalog of running local apps; sticky active root when multiple roots match.
- Process discovery with PID-liveness fast path and adaptive backoff; custom matchers use a bounded safe subset (ReDoS resistant).
- Explicit native helper states: `missing` / `launch_failed` / `target_missing` / `no_output` / `listening`.
- Configurable Idle rest interval (default 8s, range 2–60s).

### Media and actions

- Releases **ship without** third-party VRM or Idle/Speaking VRMA by default; first launch opens Settings and guides lawful download then local import.
- Recursive **evaluate-and-import** folders for VRM and VRMA; shared quality gate (`report` / `strict` / `off`) and Markdown reports (`voxavatar-vrm-report.md` / `voxavatar-vrma-report.md`).
- Correct humanoid coverage for VRM 0.x (`humanBones` array) and VRM 1.0 (object map); VRMA defaults to strict thresholds (reject below 60, keep at 75+).
- Import path: copy → GLB/extension validation → atomic rename; load failures return to a recoverable Settings surface.
- Custom actions (name / description / trigger / multi-clip), common presets, and one-click delete of all user VRM/VRMA.
- Idle picks from the non-speaking action pool without immediate repeats; MCP sees a live action catalog.

### First-run and diagnostics

- Settings first-run checklist: model, optional actions, voice source, MCP health, and completion.
- Copyable diagnostic summary that redacts usernames, absolute paths, and `.vrm` / `.vrma` filenames, and never includes audio or model bytes.
- Settings and MCP `get_status` share one readiness / helper-state vocabulary.

### Agent and security hardening

- MCP registration name is `voxavatar`; sessions have idle TTL (30 min) and a hard capacity of 32.
- Privileged IPC validates renderer sender URLs; HTTP events / MCP POST reject non-JSON media types.
- Local MCP/HTTP remain loopback-only, with no arbitrary command or arbitrary file access.

### Release and maintenance baseline

- Windows CI, CodeQL, media-license gate, Dependabot guarded auto-merge, NSIS, and SHA-256 Releases.
- Packaging runs when the `main` tip already has the matching `v{version}` tag; after a successful new Release, only the latest public Release is kept.
- Bilingual `ROADMAP` / `REVIEW` / `DECISIONS` and agent guidance (`AGENTS.md`) form the product and maintenance contract.

Upstream may still offer cross-platform listeners or different settings paths. This project prioritizes the Windows local closed loop, media-license boundaries, and diagnosable first-run setup over tracking every upstream branch.

## How it works

```text
Selected application playback
        │ WASAPI process loopback, level only
        ▼
voxavatar-audio-listener.exe
        │ NDJSON
        ▼
Electron main ── settings / tray / MCP / HTTP / URL protocol
        │ sandboxed, context-isolated preload bridge
        ▼
React + Three.js ── VRM / VRMA / lip sync / desktop interaction
```

## Privacy and security boundaries

- **No microphone capture**, recording, transcription, audio retention, or audio transmission.
- By default only the selected application's playback is measured. The optional **system-output** mode listens to the current render-endpoint mix (music, video, games, and other apps). Settings shows an explicit privacy warning; levels stay local and are never uploaded.
- The MCP and HTTP bridge binds only to `127.0.0.1` and constrains Host, origin, body size, and input schemas. MCP sessions have idle TTL and a hard capacity limit.
- MCP controls only avatar actions, window state, and status. It cannot execute arbitrary commands or read arbitrary files.
- Custom process matchers are limited to a bounded safe subset that rejects obvious ReDoS patterns.
- Imported media is copied to per-user app data. The renderer can read only registered asset IDs through `voxavatar-asset:`.
- Releases ship without third-party characters or motions by default. Lawful local import does not grant this project redistribution rights.

Other processes under the same Windows account can still connect to the unauthenticated local MCP endpoint. Never forward the port to a LAN or the Internet. See [`SECURITY.en.md`](SECURITY.en.md) for the complete model.

## Requirements

| Use | Requirement |
| --- | --- |
| Installed release | Windows 10 build 20348+ or Windows 11 x64, with a hardware-accelerated desktop session |
| Character media | One `.vrm` you are allowed to use; `.vrma` motions are optional |
| Regular source development | Windows, Node.js 24+, and npm |
| Native-listener changes or local packaging | Visual Studio Build Tools with the Desktop development with C++ workload |

Visual Studio Build Tools is not required for normal UI, settings, MCP, documentation, or JavaScript/TypeScript work. GitHub Actions performs the canonical Windows native build and packaging.

## Quick start

1. Download the Windows installer from [GitHub Releases](https://github.com/SanHsien/voxavatar/releases/latest).
2. Launch VoxAvatar. Settings opens automatically when no model is configured.
3. Under **Models**, import a `.vrm` you are allowed to use. Releases do not ship third-party characters by default.
4. Add `.vrma` clips to Idle, Speaking, or custom actions. Lip sync still works without motion clips.
5. Under **Voice**, select the application that plays assistant audio.

Find lawful models and motions on [VRoid Hub](https://hub.vroid.com/), [BOOTH](https://booth.pm/), or create an original model with [VRoid Studio](https://vroid.com/studio). Download, avatar use, commercial use, and redistribution terms vary by asset. See [`ASSET_LICENSES.md`](ASSET_LICENSES.md) and [`docs/IDLE_MOTIONS.md`](docs/IDLE_MOTIONS.md).

## Connect Codex and MCP

Keep VoxAvatar running and register it once:

```powershell
codex mcp add voxavatar --url http://127.0.0.1:47831/mcp
```

Restart Codex or start a new task, then ask it to list installed actions, play an action such as `wave-hello`, control the window, or report model and listener status.

The MCP tools are `list_animations`, `play_animation`, `control_window`, and `get_status`. Existing sessions receive updated tool descriptions after actions are added or removed in Settings. See [`docs/INTEGRATIONS.md`](docs/INTEGRATIONS.md) for schemas, health checks, HTTP events, and URL protocol details.

## Avatar controls

- Mouse wheel: zoom.
- Left-drag on the avatar: move the window.
- Middle-drag: rotate the view.
- Right-click the avatar: open the shortcut menu (reset view, settings, language, about).
- Tray left-click: show or hide; tray right-click: open the menu (reset view, listening/speaking preview, settings, about).

## Project status and roadmap

Latest is `v0.2.x`: includes system-output voice, folder quality gates, idle rest timing, discovery/matcher/MCP session/IPC sender hardening, VRM0 humanoid coverage fix, plus first-run readiness and copyable diagnostics. Next: versioned Windows smoke evidence, then media compatibility matrix and MCP contract / preload separation.

See [`ROADMAP.en.md`](ROADMAP.en.md) for milestones, completion criteria, risks, and explicit non-goals. See [`REVIEW.md`](REVIEW.md) for the latest repository health review and manual-validation gaps (Traditional Chinese).

## Run from source

For regular Electron, React, and MCP development:

```powershell
git clone https://github.com/SanHsien/voxavatar.git
cd voxavatar
npm ci
npm run dev
npm run check
```

Without a compiled native helper, the desktop UI and most features still work for development, but application-loopback listening is unavailable. Build the helper only when changing C++, validating the full audio path, or creating an installer locally:

```powershell
npm run native:build
npm run native:test
npm run dist:windows
```

`npm run check` runs lint, Markdown checks, Node and renderer tests, the asset contract, production audit, and a production build. See [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) for the complete environment and command matrix.

## Project structure

```text
electron/        Electron main, preload, settings, MCP/HTTP, and Node tests
src/             React/Three.js renderer, action logic, and Vitest tests
native/windows/  WASAPI process-loopback C++ helper
scripts/         Build, media, docs, Dependabot, version, and checksum gates
public/assets/   UI icon and release manifests; no VRM/VRMA by default
docs/            Development, integration, decisions, and release docs
.github/         CI, CodeQL, Dependabot, Release, and contribution templates
```

## Documentation

| Document | Purpose |
| --- | --- |
| [`ROADMAP.en.md`](ROADMAP.en.md) | Product positioning, milestones, completion criteria, risks, and non-goals |
| [`REVIEW.md`](REVIEW.md) | Latest repository review and open validation gaps (Traditional Chinese) |
| [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) | Architecture, directories, toolchain, and validation matrix |
| [`docs/INTEGRATIONS.md`](docs/INTEGRATIONS.md) | MCP, HTTP event API, and URL protocol |
| [`docs/RELEASING.md`](docs/RELEASING.md) | Versioning, GitHub Actions, assets, and post-release verification |
| [`docs/WINDOWS_VALIDATION.md`](docs/WINDOWS_VALIDATION.md) | Real-machine installer, desktop, audio, MCP, and signing checks (Traditional Chinese) |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Fork, privacy, licensing, and maintenance decisions |
| [`CONTRIBUTING.en.md`](CONTRIBUTING.en.md) | Contribution workflow and hard boundaries |
| [`SECURITY.en.md`](SECURITY.en.md) | Supported versions, security model, and vulnerability reporting |
| [`ASSET_LICENSES.md`](ASSET_LICENSES.md) | Media provenance and redistribution gate (Traditional Chinese) |
| [`CHANGELOG.md`](CHANGELOG.md) | Version history (Traditional Chinese) |

## Support and contributing

- Bugs and feature requests: use the [issue templates](https://github.com/SanHsien/voxavatar/issues/new/choose).
- Security vulnerabilities: follow [`SECURITY.en.md`](SECURITY.en.md) and use Private Vulnerability Reporting.
- Before submitting code: read [`CONTRIBUTING.en.md`](CONTRIBUTING.en.md) and run at least `npm run check`.

## Provenance and license

Source code is available under the [MIT License](LICENSE), retaining copyright and attribution from `xikhar/persona`. Third-party VRM, VRMA, image, and environment assets do not automatically become MIT-licensed when imported or packaged. See [`NOTICE.md`](NOTICE.md) and [`ASSET_LICENSES.md`](ASSET_LICENSES.md) for the complete scope.
