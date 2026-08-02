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

> VoxAvatar is derived from [`xikhar/persona`](https://github.com/xikhar/persona). Thanks to `xikhar` and the upstream contributors for the original foundation. Their copyright, MIT License, and attribution are retained while [`SanHsien/voxavatar`](https://github.com/SanHsien/voxavatar) independently maintains the Windows product.

## What it is

VoxAvatar is a Windows-only, local-first VRM desktop companion. It measures the **playback level** of a selected application so the avatar can lip-sync and enter its Speaking motion. Codex and other compatible agents can also use the local MCP server to play actions, show or hide the avatar, and inspect status.

It is not another chatbot and does not run a language model. VoxAvatar focuses on being the local visual-presence layer for an AI assistant: characters, actions, settings, and audio-level decisions stay on the computer.

## Feature overview

| Area | Capability |
| --- | --- |
| Voice lip sync | App / custom matcher / external events / system-output (opt-in) loopback; searchable sources; sticky discovery and helper states (`missing` / `target_missing` / `no_output` / `listening`) |
| Desktop avatar | Transparent topmost click-through, drag, zoom (min 30%), rotate, tray left/right menus, reset view, listen/speak preview, About |
| Local media | Import `.vrm` / `.vrma`; folder evaluate-and-import with quality reports (`report` / `strict` / `off`); VRM 0.x / 1.0; one-click clear; recoverable load failures |
| Action system | Idle / Speaking slots, random multi-clip (no immediate repeat), configurable Idle rest, `loop` / `one-shot` / `pose` purpose, custom actions and live MCP catalog |
| Character presence | State arbitration, system state-slot bindings, comic bubbles, `show_message` (Settings opt-in), lip-sync gain (size-based estimate) |
| First-run setup | Progress checklist (model / optional actions / voice / MCP); copyable redacted diagnostics; shared readiness with `get_status` |
| Agent integration | Loopback-only MCP (6 tools including opt-in `show_message` and `set_character_state`), HTTP event API, `voxavatar://` |
| Release quality | Windows CI, CodeQL, media-license gate, NSIS, SHA-256; package only when `main` tip is tagged |

## Upstream credit and product differences

VoxAvatar began from the original code in [`xikhar/persona`](https://github.com/xikhar/persona). Special thanks go to `xikhar` and every upstream contributor. This project continues to retain upstream copyright, the MIT License, and attribution whether or not GitHub displays a fork relationship.

The current VoxAvatar product is **Windows-only** (no PipeWire / Hyprland / macOS distribution), uses the **VoxAvatar / `voxavatar`** identity, ships **without** bundled third-party VRM/VRMA by default, and independently maintains Windows audio listening, character states, comic bubbles, MCP controls, action imports, and release workflows. See [`docs/DECISIONS.md`](docs/DECISIONS.md) §1 for provenance, product boundaries, and upstream evaluations.

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

Lip sync drives VRM expressions from the live level; VRMA supplies optional body motion only, so the mouth still moves without a Speaking clip. This is amplitude response, not speech recognition or phoneme sync.

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

Find lawful models and motions on [VRoid Hub](https://hub.vroid.com/), [BOOTH](https://booth.pm/), or create an original model with [VRoid Studio](https://vroid.com/studio). Download, avatar use, commercial use, and redistribution terms vary by asset. See [`ASSET_LICENSES.md`](ASSET_LICENSES.md) and [`docs/CHARACTER_BEHAVIOR.md`](docs/CHARACTER_BEHAVIOR.md) (Traditional Chinese).

## Connect Codex and MCP

Keep VoxAvatar running and register it once:

```powershell
codex mcp add voxavatar --url http://127.0.0.1:47831/mcp
```

Restart Codex or start a new task, then ask it to list installed actions, play an action such as `wave-hello`, control the window, report model and listener status, or (when enabled in Settings) show a short bubble caption.

The MCP tools are `list_animations`, `play_animation`, `control_window`, `get_status`, `show_message` (default off), and `set_character_state`. Existing sessions receive updated tool descriptions after actions are added or removed in Settings. See [`docs/INTEGRATIONS.md`](docs/INTEGRATIONS.md) for schemas, health checks, HTTP events, and URL protocol details.

## Avatar controls

- Mouse wheel: zoom.
- Left-drag on the avatar: move the window.
- Middle-drag: rotate the view.
- Right-click the avatar: open the shortcut menu (reset view, settings, language, about).
- Tray left-click: show or hide; tray right-click: open the menu (reset view, listening/speaking preview, settings, about).

## Project status and roadmap

The version on `main` is **`0.16.3`**. The GitHub repository has left its fork network while retaining upstream credit and the local `upstream` remote. GitHub Latest Release remains **`v0.16.0`** (accumulating; no installer cut this round). GUI smoke and signing remain unverified. Former `REVIEW.md` lives under [`ROADMAP.md`](ROADMAP.md) “Current health”. Upstream evaluation: [`docs/DECISIONS.md`](docs/DECISIONS.md) §1 (Traditional Chinese).

See [`ROADMAP.en.md`](ROADMAP.en.md) for version order, next work, and current health.

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
electron/        Electron main, preload-avatar / preload-settings, settings, MCP/HTTP, and Node tests
src/             React/Three.js renderer, action logic, and Vitest tests
native/windows/  WASAPI process-loopback C++ helper
scripts/         Build, media, docs, Dependabot, version, and checksum gates
public/assets/   UI icon and release manifests; no VRM/VRMA by default
docs/            Development, integration, character behavior, decisions, and release docs
.github/         CI, CodeQL, Dependabot, Release, and contribution templates
```

## Documentation

| Document | Purpose |
| --- | --- |
| [`ROADMAP.en.md`](ROADMAP.en.md) / [`CHANGELOG.md`](CHANGELOG.md) | Future work, current health, and completed history |
| [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) / [`CONTRIBUTING.en.md`](CONTRIBUTING.en.md) | Architecture, toolchain, validation, and contribution workflow |
| [`docs/INTEGRATIONS.md`](docs/INTEGRATIONS.md) | MCP, HTTP event API, and URL protocol |
| [`docs/CHARACTER_BEHAVIOR.md`](docs/CHARACTER_BEHAVIOR.md) / [`docs/VRM_VRMA_COMPATIBILITY.md`](docs/VRM_VRMA_COMPATIBILITY.md) | Motion import, character behavior, action-pack contract, and media compatibility (Traditional Chinese) |
| [`docs/RELEASING.md`](docs/RELEASING.md) | Release workflow and Windows validation (Traditional Chinese) |
| [`SECURITY.en.md`](SECURITY.en.md) / [`ASSET_LICENSES.md`](ASSET_LICENSES.md) / [`docs/DECISIONS.md`](docs/DECISIONS.md) | Security, media licensing, decisions, and upstream evaluation |

## Support and contributing

- Bugs and feature requests: use the [issue templates](https://github.com/SanHsien/voxavatar/issues/new/choose).
- Security vulnerabilities: follow [`SECURITY.en.md`](SECURITY.en.md) and use Private Vulnerability Reporting.
- Before submitting code: read [`CONTRIBUTING.en.md`](CONTRIBUTING.en.md) and run at least `npm run check`.

## Provenance and license

Source code is available under the [MIT License](LICENSE), retaining copyright and attribution from [`xikhar/persona`](https://github.com/xikhar/persona). Thanks to `xikhar` and the upstream contributors for the original foundation. Third-party VRM, VRMA, image, and environment assets do not automatically become MIT-licensed when imported or packaged. See [`ASSET_LICENSES.md`](ASSET_LICENSES.md) and [`docs/DECISIONS.md`](docs/DECISIONS.md) §1 for provenance, remotes, and licensing scope.
