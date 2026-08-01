<p align="center">
  <img src="./public/assets/avatar.png" alt="VoxAvatar" width="144" />
</p>

<h1 align="center">VoxAvatar</h1>

<p align="center">A local Windows VRM desktop companion with assistant-output lip sync, animations, and MCP visual controls.</p>

<p align="center">
  <a href="./README.md">繁體中文</a> ·
  <a href="https://github.com/SanHsien/voxavatar/releases/latest">Latest release</a> ·
  <a href="./docs/INTEGRATIONS.md">Integrations</a>
</p>

> VoxAvatar is derived from [`xikhar/persona`](https://github.com/xikhar/persona) and independently maintained at [`SanHsien/voxavatar`](https://github.com/SanHsien/voxavatar). This fork supports Windows only. See [`NOTICE.md`](NOTICE.md).

## What it does

- Measures the **playback output** of a selected Windows application to drive VRM lip sync and speaking motion.
- Provides a transparent topmost avatar with click-through, drag, zoom, rotate, and tray controls.
- Imports local `.vrm` and `.vrma` files, including folder import, VRMA quality reports, and custom actions.
- Exposes loopback-only MCP, an HTTP event API, and the `voxavatar://` protocol.
- Keeps characters, animations, and settings on the local computer. VoxAvatar does not run a language model.

VoxAvatar **does not capture the microphone, record, transcribe, retain, or transmit audio**.

## Requirements

| Item | Requirement |
| --- | --- |
| Operating system | Windows 10 build 20348+ or Windows 11 x64 |
| Display | Hardware-accelerated desktop session |
| Source development | Node.js 24+, npm, Visual Studio Build Tools with Desktop development with C++ |

## Quick start

1. Download the Windows installer from [GitHub Releases](https://github.com/SanHsien/voxavatar/releases/latest).
2. Launch VoxAvatar. Settings opens automatically when no model is configured.
3. Import a `.vrm` you are allowed to use under **Models**. No third-party character ships by default.
4. Add `.vrma` clips to Idle, Speaking, or custom actions. Lip sync still works without body-motion clips.
5. Under **Voice**, select the application that plays assistant audio.

Find lawful models and motions on [VRoid Hub](https://hub.vroid.com/), [BOOTH](https://booth.pm/), or create an original model with [VRoid Studio](https://vroid.com/studio). Terms for download, avatar use, commercial use, and redistribution vary by asset. See [`ASSET_LICENSES.md`](ASSET_LICENSES.md) and [`docs/IDLE_MOTIONS.md`](docs/IDLE_MOTIONS.md).

## Avatar controls

- Mouse wheel: zoom.
- Left-drag on the avatar: move the window.
- Middle-drag: rotate the view.
- Right-click: open the shortcut menu.
- Tray left-click: show or hide; tray right-click: open the menu.

## Connect Codex

Keep VoxAvatar running and register it once:

```powershell
codex mcp add voxavatar --url http://127.0.0.1:47831/mcp
```

Restart Codex or start a new task, then ask it to list actions, play an installed action, control the window, or report status. The tools are `list_animations`, `play_animation`, `control_window`, and `get_status`. See [`docs/INTEGRATIONS.md`](docs/INTEGRATIONS.md) for schemas and other integrations.

## Run from source

```powershell
git clone https://github.com/SanHsien/voxavatar.git
cd voxavatar
npm ci
npm run native:build
npm run dev
```

Validation and packaging:

```powershell
npm run check
npm run native:test
npm run dist:windows
```

`npm run check` runs lint, Markdown validation, Node and renderer tests, asset-contract checks, production audit, and a production build. Windows installers are written to `release/`.

## Documentation

- [`CONTRIBUTING.en.md`](CONTRIBUTING.en.md): contribution workflow and boundaries
- [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md): architecture, directories, and development
- [`docs/INTEGRATIONS.md`](docs/INTEGRATIONS.md): MCP, HTTP, and URL protocol
- [`docs/RELEASING.md`](docs/RELEASING.md): versioning and releases
- [`SECURITY.en.md`](SECURITY.en.md): security model and vulnerability reporting
- [`ASSET_LICENSES.md`](ASSET_LICENSES.md): media redistribution gate (Traditional Chinese)
- [`docs/DECISIONS.md`](docs/DECISIONS.md): fork decisions (Traditional Chinese)

Source code is available under the [MIT License](LICENSE). Third-party media does not automatically become MIT-licensed when imported or packaged.
