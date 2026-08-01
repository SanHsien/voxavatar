# Security Policy

> 繁體中文：[`SECURITY.md`](SECURITY.md)

## Supported versions

Only the [latest GitHub Release](https://github.com/SanHsien/voxavatar/releases/latest) and current `main` are supported. Older beta releases do not receive separate security patches.

## Private reporting

Use [GitHub Private Vulnerability Reporting](https://github.com/SanHsien/voxavatar/security/advisories/new). Include the affected version, impact, reproduction steps, and sanitized diagnostics. Do not open a public issue or publish a proof of concept before a fix is available.

## Security model

- By default, voice monitoring only calculates the selected application's playback level in memory. The optional system-output mode listens to the current output-device mix via local loopback; it still does not capture the microphone, retain, transcribe, or transmit audio. System-output mode is explicit opt-in and shows a privacy-boundary warning in Settings.
- MCP and the HTTP bridge bind only to `127.0.0.1` and validate loopback hosts, origins, content type, request size, and input schemas. MCP sessions have an idle TTL and a hard capacity cap.
- Local MCP has no login authentication. Other processes under the same Windows account can control the avatar window and actions. Never forward the port to a LAN or the Internet.
- MCP exposes bounded animation, window, and status tools only; it cannot execute arbitrary commands or read arbitrary files.
- The Electron renderer uses sandboxing and context isolation without Node integration. Preload exposes an explicit IPC allowlist, and privileged handlers validate the sender URL. The avatar and Settings renderers still share that API; full privilege separation remains on [`ROADMAP.en.md`](ROADMAP.en.md).
- Custom process matchers are limited to a bounded safe subset that rejects obvious ReDoS patterns.
- Imported media is copied to per-user application data. The renderer can access only registered IDs through `voxavatar-asset:`.

Security-boundary changes require tests and a threat explanation. Use the issue template, not the vulnerability channel, for ordinary bugs.
