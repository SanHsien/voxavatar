"use strict";

const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const {
  createBridgeServer,
  hasJsonContentType,
  hostAllowed,
  normalizeEvent,
  originAllowed,
} = require("./bridge-server.cjs");

test("accepts only the JSON media type, with optional parameters", () => {
  assert.equal(hasJsonContentType({ headers: { "content-type": "application/json" } }), true);
  assert.equal(
    hasJsonContentType({ headers: { "content-type": "Application/JSON; charset=utf-8" } }),
    true,
  );
  assert.equal(hasJsonContentType({ headers: { "content-type": "text/plain" } }), false);
  assert.equal(hasJsonContentType({ headers: {} }), false);
});

function requestServer(address, { path, method = "GET", headers = {}, body = "" }) {
  return new Promise((resolve, reject) => {
    const request = http.request(
      {
        hostname: "127.0.0.1",
        port: address.port,
        path,
        method,
        headers,
      },
      (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () =>
          resolve({
            body: Buffer.concat(chunks).toString("utf8"),
            headers: response.headers,
            status: response.statusCode,
          }),
        );
      },
    );
    request.on("error", reject);
    request.end(body);
  });
}

test("normalizes voice events and configured animation commands", () => {
  const state = {
    activity: "speaking",
    microphoneMuted: false,
    outputMuted: false,
    phase: "active",
  };
  assert.deepEqual(normalizeEvent({ type: "state", state }), { type: "state", state });
  assert.deepEqual(normalizeEvent({ type: "audio-level", level: 4 }), {
    type: "audio-level",
    level: 1,
  });
  assert.deepEqual(
    normalizeEvent({ type: "animation", animation_name: "wave-hello" }),
    {
      type: "animation-command",
      animationName: "wave-hello",
    },
  );
  assert.equal(
    normalizeEvent({ type: "animation", animation_name: "Wave Hello" }),
    null,
  );
  assert.equal(
    normalizeEvent({ type: "animation", animation_name: "unknown/name" }),
    null,
  );
  assert.equal(
    normalizeEvent({ type: "animation", animation: "LEGACY_VALUE" }),
    null,
  );
  assert.equal(normalizeEvent({ type: "state", state: { phase: "wat" } }), null);
});

test("only accepts supported app and local webview origins", () => {
  assert.equal(originAllowed("http://127.0.0.1:5175"), true);
  assert.equal(originAllowed("http://localhost:5175"), true);
  assert.equal(originAllowed("codex-app://codex"), true);
  assert.equal(originAllowed("null"), false);
  assert.equal(originAllowed("https://example.com"), false);
  assert.equal(originAllowed("codex://settings"), false);
  assert.equal(originAllowed(undefined), true);
});

test("only accepts loopback Host headers", () => {
  assert.equal(hostAllowed("127.0.0.1:47831"), true);
  assert.equal(hostAllowed("localhost:47831"), true);
  assert.equal(hostAllowed("[::1]:47831"), true);
  assert.equal(hostAllowed("rejected.example"), false);
  assert.equal(hostAllowed("127.0.0.1.example"), false);
  assert.equal(hostAllowed(undefined), false);
});

test("bridge rejects a non-loopback Host header", async (context) => {
  const bridge = createBridgeServer({ port: 0, onEvent: () => {} });
  const address = await bridge.listen();
  context.after(() => bridge.close());

  const response = await requestServer(address, {
    path: "/health",
    headers: { host: "rejected.example" },
  });

  assert.equal(response.status, 403);
});

test("bridge accepts a valid native adapter state event", async (context) => {
  const events = [];
  const bridge = createBridgeServer({ port: 0, onEvent: (event) => events.push(event) });
  const address = await bridge.listen();
  context.after(() => bridge.close());

  const body = JSON.stringify({
    type: "state",
    state: {
      activity: "listening",
      microphoneMuted: false,
      outputMuted: false,
      phase: "active",
    },
  });
  const response = await requestServer(address, {
    path: "/events",
    method: "POST",
    headers: {
      "content-type": "application/json",
      "content-length": Buffer.byteLength(body),
    },
    body,
  });

  assert.equal(response.status, 202);
  assert.equal(events.length, 1);
  assert.equal(events[0].state.phase, "active");
});

test("bridge rejects non-JSON event bodies", async (context) => {
  const events = [];
  const bridge = createBridgeServer({
    port: 0,
    onEvent: (event) => events.push(event),
  });
  const address = await bridge.listen();
  context.after(() => bridge.close());

  const response = await requestServer(address, {
    path: "/events",
    method: "POST",
    headers: { "content-type": "text/plain" },
    body: '{"type":"audio-level","level":0.5}',
  });

  assert.equal(response.status, 415);
  assert.deepEqual(events, []);
});

test("bridge delegates configured animation names to the active library", async (context) => {
  const events = [];
  const bridge = createBridgeServer({
    port: 0,
    onEvent: (event) => {
      events.push(event);
      return event.animationName === "installed-motion";
    },
  });
  const address = await bridge.listen();
  context.after(() => bridge.close());

  const acceptedBody = JSON.stringify({
    type: "animation",
    animation_name: "installed-motion",
  });
  const rejectedBody = JSON.stringify({
    type: "animation",
    animation_name: "uninstalled-motion",
  });
  const accepted = await requestServer(address, {
    path: "/events",
    method: "POST",
    headers: { "content-type": "application/json" },
    body: acceptedBody,
  });
  const rejected = await requestServer(address, {
    path: "/events",
    method: "POST",
    headers: { "content-type": "application/json" },
    body: rejectedBody,
  });

  assert.equal(accepted.status, 202);
  assert.equal(rejected.status, 422);
  assert.deepEqual(events, [
    { type: "animation-command", animationName: "installed-motion" },
    { type: "animation-command", animationName: "uninstalled-motion" },
  ]);
});

test("bridge routes only valid local JSON requests to MCP", async (context) => {
  const bodies = [];
  const bridge = createBridgeServer({
    port: 0,
    onEvent: () => {},
    mcpHandler: (request, response, body) => {
      bodies.push({ body, method: request.method });
      response.writeHead(200, { "content-type": "application/json" });
      response.end('{"ok":true}');
    },
  });
  const address = await bridge.listen();
  context.after(() => bridge.close());

  const accepted = await requestServer(address, {
    path: "/mcp",
    method: "POST",
    headers: { "content-type": "application/json" },
    body: '{"jsonrpc":"2.0"}',
  });
  const acceptedGet = await requestServer(address, {
    path: "/mcp",
  });
  const acceptedDelete = await requestServer(address, {
    path: "/mcp",
    method: "DELETE",
  });
  const blockedOrigin = await requestServer(address, {
    path: "/mcp",
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://example.com",
    },
    body: "{}",
  });
  const unsupportedMethod = await requestServer(address, {
    path: "/mcp",
    method: "PUT",
  });
  const invalidJson = await requestServer(address, {
    path: "/mcp",
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{",
  });
  const wrongContentType = await requestServer(address, {
    path: "/mcp",
    method: "POST",
    headers: { "content-type": "text/plain" },
    body: '{"jsonrpc":"2.0"}',
  });
  const oversized = await requestServer(address, {
    path: "/mcp",
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ value: "x".repeat(64 * 1024) }),
  });

  assert.equal(accepted.status, 200);
  assert.equal(acceptedGet.status, 200);
  assert.equal(acceptedDelete.status, 200);
  assert.equal(blockedOrigin.status, 403);
  assert.equal(unsupportedMethod.status, 405);
  assert.equal(unsupportedMethod.headers.allow, "POST, GET, DELETE");
  assert.equal(invalidJson.status, 400);
  assert.equal(JSON.parse(invalidJson.body).error.code, -32700);
  assert.equal(oversized.status, 413);
  assert.equal(wrongContentType.status, 415);
  assert.deepEqual(bodies, [
    { body: { jsonrpc: "2.0" }, method: "POST" },
    { body: undefined, method: "GET" },
    { body: undefined, method: "DELETE" },
  ]);
});
