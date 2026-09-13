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
[![Platform: Windows 10/11](https://img.shields.io/badge/Platform-Windows%2010%2F11-0078D4.svg?logo=windows11&logoColor=white)](#requirements)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**VoxAvatar** is a Windows-only, local-first VRM desktop companion. It measures the **playback level** of a selected application so the avatar can lip-sync and enter its Speaking motion. Codex and other compatible agents can also control actions, window state, character state, and message bubbles through a local MCP server.

It is **not another chatbot and does not run a language model**. VoxAvatar focuses on being the local visual-presence layer for an AI assistant.

## Download and first run

The source tree currently declares package version `1.0.6`; the authoritative downloadable version, signing status, and checksums are on the [Latest Release](https://github.com/SanHsien/voxavatar/releases/latest).

1. Download `VoxAvatar-*-windows-x64-setup.exe` from the Latest Release.
2. If that Release or installer is marked **NotSigned**, Windows SmartScreen may show an unknown-publisher warning. Verify the installer against `SHA256SUMS.txt` from the same Release.
3. Install and launch VoxAvatar; a bundled avatar appears on first run.
4. Under **Voice**, select the application that plays assistant audio.
5. Connect MCP only if you want agent control.

The installer includes four VRM characters whose source and redistribution terms were reviewed, plus 13 CC0 VRMA motions. You can also import `.vrm` / `.vrma` files you are allowed to use. See [ASSET_LICENSES.md](ASSET_LICENSES.md) for bundled-media provenance.

## What you can do

| Feature | What it does |
| --- | --- |
| Voice lip sync | Drives mouth movement and Speaking state from selected-app playback level; this is not speech recognition or phoneme sync |
| Desktop avatar | Transparent topmost window, drag, zoom, rotate, click-through, and tray controls |
| Actions | Bundled Idle / Speaking / custom motions, plus local VRMA import and preview |
| Character media | Four bundled VRMs plus local import of VRM / VRMA files you are allowed to use |
| Agent control | Local MCP can list/play actions, control the window, inspect status, change character state, and show short bubbles |
| Local-first behavior | No recording, transcription, or audio upload; character data, settings, and level decisions remain local |

## Connect Codex / MCP

Keep VoxAvatar running and register it once:

```powershell
codex mcp add voxavatar --url http://127.0.0.1:47831/mcp
```

Restart Codex or start a new task, then ask it to list installed actions, play an action, show or hide the window, inspect model/listener state, change character state, or show a short bubble after enabling that option in Settings.

The MCP tools are `list_animations`, `play_animation`, `control_window`, `get_status`, `show_message`, and `set_character_state`. See [docs/INTEGRATIONS.md](docs/INTEGRATIONS.md) for schemas, the HTTP event API, and the `voxavatar://` protocol.

## Privacy and security boundaries

- **No microphone capture**, recording, transcription, audio retention, or audio transmission.
- By default VoxAvatar measures only the selected application's playback output. If you explicitly switch to **system output**, it measures the current render-endpoint mix; Settings displays this broader privacy boundary.
- MCP and HTTP bind only to `127.0.0.1`; do not forward the port to a LAN or the Internet.
- MCP controls only VoxAvatar characters, windows, and status. It cannot execute arbitrary commands or read arbitrary files.
- Other processes under the same Windows account may still connect to the unauthenticated loopback MCP endpoint. See [SECURITY.en.md](SECURITY.en.md) for the full threat model.
- Local import of third-party media does not grant VoxAvatar redistribution rights for that media.

## Requirements

| Use | Requirement |
| --- | --- |
| Installed release | Windows 10 build 20348+ or Windows 11 x64, with a hardware-accelerated desktop session |
| Regular source development | Windows, Node.js 24, npm |
| Native listener changes or local packaging | Visual Studio Build Tools with the Desktop development with C++ workload |

Visual Studio Build Tools is not required for normal UI, settings, MCP, documentation, or TypeScript work. GitHub Actions performs the canonical Windows native build and installer validation.

## Avatar controls

- Mouse wheel: zoom.
- Left-drag: move the window.
- Middle-drag: rotate the view.
- Right-click the avatar: open the shortcut menu.
- Tray left-click: show or hide; tray right-click: open the full menu.

## Run from source

```powershell
git clone https://github.com/SanHsien/voxavatar.git
cd voxavatar
npm ci
npm run dev
```

Before submitting changes, run at least:

```powershell
npm run check
```

`npm run check` covers lint, Markdown checks, Node and renderer tests, the asset contract, dependency audit, and a production build. For C++ listener or Windows installer work, follow [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) and [docs/RELEASING.md](docs/RELEASING.md) for the additional native and release gates.

## Documentation

- [docs/INTEGRATIONS.md](docs/INTEGRATIONS.md): MCP, HTTP event API, and URL protocol
- [docs/CHARACTER_BEHAVIOR.md](docs/CHARACTER_BEHAVIOR.md): character states, actions, and lip-sync behavior
- [docs/VRM_VRMA_COMPATIBILITY.md](docs/VRM_VRMA_COMPATIBILITY.md): media compatibility
- [ASSET_LICENSES.md](ASSET_LICENSES.md): bundled-media sources and licensing
- [SECURITY.en.md](SECURITY.en.md): complete security and privacy model
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md): development, tests, and architecture
- [docs/RELEASING.md](docs/RELEASING.md): Windows release and validation workflow
- [ROADMAP.en.md](ROADMAP.en.md): future work and current health
- [CHANGELOG.md](CHANGELOG.md): release history

## Project origin

VoxAvatar is derived from [`xikhar/persona`](https://github.com/xikhar/persona) and retains upstream copyright, the MIT License, and attribution. `SanHsien/voxavatar` independently maintains the current **Windows-only** product, including WASAPI application-output listening, MCP control, character states, comic bubbles, VRM / VRMA management, and Windows release workflows.

See [docs/DECISIONS.md](docs/DECISIONS.md) §1 for detailed provenance, upstream tradeoffs, and technical decisions.

## License

Source code is available under the [MIT License](LICENSE). Third-party VRM, VRMA, image, and other assets remain subject to their original licenses and do not automatically become MIT-licensed when imported or bundled.
