# Contributing to VoxAvatar

> 繁體中文：[`CONTRIBUTING.md`](CONTRIBUTING.md)

Contributions to Windows UX, VRM/VRMA compatibility, tests, documentation, accessibility, and local integrations are welcome. Follow [`CODE_OF_CONDUCT.en.md`](CODE_OF_CONDUCT.en.md) when participating.

## Before starting

- Search existing [issues](https://github.com/SanHsien/voxavatar/issues) and pull requests.
- Open an issue before substantial product, architecture, security, or integration work. Small fixes may go directly to a PR.
- Report vulnerabilities privately as described in [`SECURITY.en.md`](SECURITY.en.md).

## Development setup

You need Windows, Node.js 24+, npm, and Visual Studio Build Tools with the Desktop development with C++ workload.

```powershell
git clone https://github.com/SanHsien/voxavatar.git
cd voxavatar
git remote add upstream https://github.com/xikhar/persona.git
npm ci
npm run native:build
npm run dev
```

## Non-negotiable boundaries

- Do not capture the microphone or retain, transmit, or transcribe audio.
- Keep the renderer sandboxed with context isolation; keep preload APIs narrow.
- Keep MCP and the bridge loopback-only, without arbitrary command or file access.
- Do not add Linux or macOS listeners or distribution targets.
- Do not commit VRM or VRMA media without verified redistribution rights.
- Preserve the upstream MIT license and `xikhar` attribution.

## Validation before submission

```powershell
npm run check
npm run native:build
npm run native:test
```

For native, installer, or protocol changes, also run `npm run dist:windows` and record Windows manual validation. Asset changes must update `public/assets/library.json`, `public/assets/manifest.json`, and [`ASSET_LICENSES.md`](ASSET_LICENSES.md), then pass `npm run assets:release`.

## Pull requests

Keep one concern per PR and explain the motivation, user-visible result, automated and manual verification, and security/licensing/Windows impact.

Dependency PRs are risk-classified. Only CI-exercised development tools and GitHub Actions minor/patch updates may pass guarded auto-merge; runtime, packaging, rendering, and major updates require human review.
