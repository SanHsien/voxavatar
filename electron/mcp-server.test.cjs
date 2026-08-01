"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const {
  StreamableHTTPClientTransport,
} = require("@modelcontextprotocol/sdk/client/streamableHttp.js");
const {
  ToolListChangedNotificationSchema,
} = require("@modelcontextprotocol/sdk/types.js");
const { createBridgeServer } = require("./bridge-server.cjs");
const {
  SERVER_INSTRUCTIONS,
  WINDOW_ACTIONS,
  createVoxAvatarMcpHandler,
} = require("./mcp-server.cjs");
const {
  STATUS_SCHEMA_VERSION,
  TOOLS_SCHEMA_VERSION,
} = require("./mcp-schemas.cjs");

async function connectMcpClient(context, bridgeUrl, name = "voxavatar-test") {
  const client = new Client({ name, version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(bridgeUrl));
  context.after(async () => {
    await client.close().catch(() => {});
  });
  await client.connect(transport);
  return client;
}

function parseToolPayload(result) {
  return JSON.parse(result.content[0].text);
}

test("VoxAvatar MCP exposes and executes the local character tools", async (context) => {
  const playedAnimations = [];
  const configuredAnimations = [
    {
      animation_name: "wave-hello",
      animation_description: "A friendly wave.",
      animation_trigger_scenario: "Use when greeting the user.",
    },
  ];
  const windowActions = [];
  let windowVisible = false;
  const voiceState = {
    activity: "listening",
    microphoneMuted: false,
    outputMuted: false,
    phase: "active",
  };
  const listener = {
    available: true,
    capturing: false,
    monitoring: true,
    source: null,
  };
  const mcpHandler = createVoxAvatarMcpHandler({
    onAnimation: (animation) => playedAnimations.push(animation),
    onWindowAction: (action) => {
      windowActions.push(action);
      if (action === "show") windowVisible = true;
      else if (action === "hide") windowVisible = false;
      else windowVisible = !windowVisible;
      return windowVisible;
    },
    getStatus: () => ({ windowVisible, voiceState, listener }),
    getAnimations: () => configuredAnimations,
  });
  const bridge = createBridgeServer({
    port: 0,
    onEvent: () => {},
    mcpHandler,
  });
  const address = await bridge.listen();
  const client = new Client({ name: "voxavatar-test", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(
    new URL(`http://127.0.0.1:${address.port}/mcp`),
  );
  context.after(async () => {
    await client.close();
    await bridge.close();
  });

  await client.connect(transport);
  const tools = await client.listTools();

  assert.deepEqual(
    tools.tools.map((tool) => tool.name),
    [
      "play_animation",
      "list_animations",
      "control_window",
      "get_status",
    ],
  );
  assert.equal(client.getInstructions(), SERVER_INSTRUCTIONS);
  const animationInput = tools.tools.find(
    (tool) => tool.name === "play_animation",
  ).inputSchema.properties.animation;
  assert.equal(animationInput.type, "string");
  assert.equal(animationInput.enum, undefined);
  assert.match(animationInput.description, /wave-hello/);
  assert.deepEqual(
    tools.tools
      .find((tool) => tool.name === "control_window")
      .inputSchema.properties.action.enum,
    WINDOW_ACTIONS,
  );

  const animationResult = await client.callTool({
    name: "play_animation",
    arguments: { animation: "wave-hello" },
  });
  const windowResult = await client.callTool({
    name: "control_window",
    arguments: { action: "show" },
  });
  const statusResult = await client.callTool({
    name: "get_status",
    arguments: {},
  });
  const animationsResult = await client.callTool({
    name: "list_animations",
    arguments: {},
  });

  assert.deepEqual(playedAnimations, ["wave-hello"]);
  assert.deepEqual(windowActions, ["show"]);

  const animationPayload = parseToolPayload(animationResult);
  assert.equal(animationPayload.schema_version, TOOLS_SCHEMA_VERSION);
  assert.equal(animationPayload.played, true);
  assert.match(animationPayload.message, /wave-hello action/);

  const animationsPayload = parseToolPayload(animationsResult);
  assert.equal(animationsPayload.schema_version, TOOLS_SCHEMA_VERSION);
  assert.equal(animationsPayload.count, 1);
  assert.match(
    animationsPayload.animations[0].animation_description,
    /A friendly wave/,
  );

  const windowPayload = parseToolPayload(windowResult);
  assert.equal(windowPayload.schema_version, TOOLS_SCHEMA_VERSION);
  assert.equal(windowPayload.visible, true);
  assert.match(windowPayload.message, /now visible/);

  const statusPayload = parseToolPayload(statusResult);
  assert.equal(statusPayload.status_schema_version, STATUS_SCHEMA_VERSION);
  assert.deepEqual(
    {
      windowVisible: statusPayload.windowVisible,
      voiceState: statusPayload.voiceState,
      listener: statusPayload.listener,
    },
    { windowVisible: true, voiceState, listener },
  );
});

test("VoxAvatar MCP exposes custom animation metadata in its tool contract", async (context) => {
  const animations = [
    {
      animation_name: "wave-hello",
      animation_description: "A small friendly wave.",
      animation_trigger_scenario: "Use when greeting the user.",
    },
  ];
  const bridge = createBridgeServer({
    port: 0,
    onEvent: () => {},
    mcpHandler: createVoxAvatarMcpHandler({
      onAnimation: () => {},
      onWindowAction: () => false,
      getStatus: () => ({}),
      getAnimations: () => animations,
    }),
  });
  const address = await bridge.listen();
  const client = new Client({ name: "voxavatar-test", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(
    new URL(`http://127.0.0.1:${address.port}/mcp`),
  );
  context.after(async () => {
    await client.close();
    await bridge.close();
  });

  await client.connect(transport);
  const tool = (await client.listTools()).tools.find(
    (candidate) => candidate.name === "play_animation",
  );

  assert.equal(tool.inputSchema.properties.animation.enum, undefined);
  assert.match(
    tool.inputSchema.properties.animation.description,
    /wave-hello/,
  );
  assert.match(tool.description, /A small friendly wave/);
  assert.match(tool.description, /Use when greeting the user/);
});

test("VoxAvatar MCP refreshes animation actions inside an active client session", async (context) => {
  const playedAnimations = [];
  const configuredAnimations = [
    {
      animation_name: "wave-hello",
      animation_description: "A small friendly wave.",
      animation_trigger_scenario: "Use when greeting the user.",
    },
  ];
  const mcpHandler = createVoxAvatarMcpHandler({
    onAnimation: (animation) => playedAnimations.push(animation),
    onWindowAction: () => false,
    getStatus: () => ({}),
    getAnimations: () => configuredAnimations,
  });
  const bridge = createBridgeServer({
    port: 0,
    onEvent: () => {},
    mcpHandler,
  });
  const address = await bridge.listen();
  const client = new Client({ name: "voxavatar-test", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(
    new URL(`http://127.0.0.1:${address.port}/mcp`),
  );
  let resolveToolChange;
  const toolChanged = new Promise((resolve) => {
    resolveToolChange = resolve;
  });
  client.setNotificationHandler(
    ToolListChangedNotificationSchema,
    resolveToolChange,
  );
  context.after(async () => {
    await client.close();
    await mcpHandler.close();
    await bridge.close();
  });

  await client.connect(transport);
  await client.listTools();
  await new Promise((resolve) => setTimeout(resolve, 50));

  configuredAnimations.push({
    animation_name: "finger-gun",
    animation_description: "A playful finger-gun gesture.",
    animation_trigger_scenario: "Use after a clever success.",
  });
  const immediateResult = await client.callTool({
    name: "play_animation",
    arguments: { animation: "finger-gun" },
  });
  assert.equal(immediateResult.isError, undefined);
  assert.deepEqual(playedAnimations, ["finger-gun"]);

  mcpHandler.notifyToolsChanged();

  await Promise.race([
    toolChanged,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Tool list change was not delivered.")),
        1500,
      ),
    ),
  ]);

  const refreshedTool = (await client.listTools()).tools.find(
    (tool) => tool.name === "play_animation",
  );
  assert.match(refreshedTool.description, /finger-gun/);
  assert.match(
    refreshedTool.inputSchema.properties.animation.description,
    /finger-gun/,
  );
});

test("VoxAvatar MCP rejects unknown animation names before invoking the app", async (context) => {
  const animations = [];
  const bridge = createBridgeServer({
    port: 0,
    onEvent: () => {},
    mcpHandler: createVoxAvatarMcpHandler({
      onAnimation: (animation) => animations.push(animation),
      onWindowAction: () => false,
      getStatus: () => ({
        windowVisible: false,
        voiceState: null,
        listener: null,
      }),
    }),
  });
  const address = await bridge.listen();
  const client = new Client({ name: "voxavatar-test", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(
    new URL(`http://127.0.0.1:${address.port}/mcp`),
  );
  context.after(async () => {
    await client.close();
    await bridge.close();
  });

  await client.connect(transport);
  const result = await client.callTool({
    name: "play_animation",
    arguments: { animation: "not-installed" },
  });

  assert.equal(result.isError, true);
  assert.deepEqual(animations, []);
  const payload = parseToolPayload(result);
  assert.equal(payload.error, "animation_not_playable");
  assert.equal(payload.played, false);
});

test("VoxAvatar MCP reports an inactive animation command without a model", async (context) => {
  const bridge = createBridgeServer({
    port: 0,
    onEvent: () => {},
    mcpHandler: createVoxAvatarMcpHandler({
      onAnimation: () => false,
      onWindowAction: () => false,
      getStatus: () => ({}),
      getAnimations: () => [
        {
          animation_name: "user-motion",
          animation_description: "A user-installed motion.",
          animation_trigger_scenario: "Use only after a model is configured.",
        },
      ],
    }),
  });
  const address = await bridge.listen();
  const client = new Client({ name: "voxavatar-test", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(
    new URL(`http://127.0.0.1:${address.port}/mcp`),
  );
  context.after(async () => {
    await client.close();
    await bridge.close();
  });

  await client.connect(transport);
  const result = await client.callTool({
    name: "play_animation",
    arguments: { animation: "user-motion" },
  });

  assert.equal(result.isError, true);
  const payload = parseToolPayload(result);
  assert.equal(payload.error, "model_or_clips_missing");
  assert.match(payload.message, /model and at least one clip/);
});

test("VoxAvatar MCP enforces session capacity and idle TTL", async (context) => {
  let clock = 1_000;
  const mcpHandler = createVoxAvatarMcpHandler(
    {
      onAnimation: () => true,
      onWindowAction: () => true,
      getStatus: () => ({ ok: true }),
      getAnimations: () => [],
    },
    {
      maxSessions: 1,
      sessionIdleTtlMs: 100,
      sweepIntervalMs: 0,
      now: () => clock,
    },
  );
  const bridge = createBridgeServer({
    port: 0,
    onEvent: () => {},
    mcpHandler,
  });
  const address = await bridge.listen();
  context.after(async () => {
    await bridge.close();
  });

  const connectClient = async (name) => {
    const client = new Client({ name, version: "1.0.0" });
    const transport = new StreamableHTTPClientTransport(
      new URL(`http://127.0.0.1:${address.port}/mcp`),
    );
    await client.connect(transport);
    return client;
  };

  const first = await connectClient("cap-first");
  assert.equal(mcpHandler.sessionCount(), 1);
  clock += 10;
  const second = await connectClient("cap-second");
  assert.equal(mcpHandler.sessionCount(), 1);
  await second.close();
  await first.close().catch(() => {});

  const third = await connectClient("cap-third");
  assert.equal(mcpHandler.sessionCount(), 1);
  clock += 1_000;
  await mcpHandler.sweepIdleSessions();
  assert.equal(mcpHandler.sessionCount(), 0);
  await third.close().catch(() => {});
});

test("VoxAvatar MCP serves two concurrent clients with structured tool output", async (context) => {
  const configuredAnimations = [
    {
      animation_name: "wave-hello",
      animation_description: "A friendly wave.",
      animation_trigger_scenario: "Use when greeting the user.",
    },
  ];
  const mcpHandler = createVoxAvatarMcpHandler({
    onAnimation: () => true,
    onWindowAction: () => true,
    getStatus: () => ({
      windowVisible: true,
      modelConfigured: true,
      voiceState: null,
      listener: null,
    }),
    getAnimations: () => configuredAnimations,
  });
  const bridge = createBridgeServer({
    port: 0,
    onEvent: () => {},
    mcpHandler,
  });
  const address = await bridge.listen();
  const bridgeUrl = `http://127.0.0.1:${address.port}/mcp`;
  context.after(async () => {
    await mcpHandler.close();
    await bridge.close();
  });

  const clientA = await connectMcpClient(context, bridgeUrl, "multi-a");
  const clientB = await connectMcpClient(context, bridgeUrl, "multi-b");
  assert.equal(mcpHandler.sessionCount(), 2);

  for (const client of [clientA, clientB]) {
    const listPayload = parseToolPayload(
      await client.callTool({ name: "list_animations", arguments: {} }),
    );
    assert.equal(listPayload.schema_version, TOOLS_SCHEMA_VERSION);
    assert.equal(listPayload.count, 1);
    assert.equal(listPayload.animations[0].animation_name, "wave-hello");

    const statusPayload = parseToolPayload(
      await client.callTool({ name: "get_status", arguments: {} }),
    );
    assert.equal(statusPayload.status_schema_version, STATUS_SCHEMA_VERSION);
    assert.equal(statusPayload.windowVisible, true);
  }
});

test("VoxAvatar MCP notifies all active sessions when the animation catalog changes", async (context) => {
  const configuredAnimations = [
    {
      animation_name: "wave-hello",
      animation_description: "A small friendly wave.",
      animation_trigger_scenario: "Use when greeting the user.",
    },
  ];
  const mcpHandler = createVoxAvatarMcpHandler({
    onAnimation: () => true,
    onWindowAction: () => false,
    getStatus: () => ({}),
    getAnimations: () => configuredAnimations,
  });
  const bridge = createBridgeServer({
    port: 0,
    onEvent: () => {},
    mcpHandler,
  });
  const address = await bridge.listen();
  const bridgeUrl = `http://127.0.0.1:${address.port}/mcp`;
  context.after(async () => {
    await mcpHandler.close();
    await bridge.close();
  });

  const waitForToolChange = (client) =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Tool list change was not delivered.")),
        1500,
      );
      client.setNotificationHandler(
        ToolListChangedNotificationSchema,
        () => {
          clearTimeout(timer);
          resolve();
        },
      );
    });

  const clientA = await connectMcpClient(context, bridgeUrl, "catalog-a");
  const clientB = await connectMcpClient(context, bridgeUrl, "catalog-b");
  const changeA = waitForToolChange(clientA);
  const changeB = waitForToolChange(clientB);
  await clientA.listTools();
  await clientB.listTools();

  configuredAnimations.push({
    animation_name: "finger-gun",
    animation_description: "A playful finger-gun gesture.",
    animation_trigger_scenario: "Use after a clever success.",
  });
  mcpHandler.notifyToolsChanged();

  await Promise.all([changeA, changeB]);

  for (const client of [clientA, clientB]) {
    const listPayload = parseToolPayload(
      await client.callTool({ name: "list_animations", arguments: {} }),
    );
    assert.equal(listPayload.count, 2);
    assert.deepEqual(
      listPayload.animations.map((animation) => animation.animation_name),
      ["wave-hello", "finger-gun"],
    );

    const playTool = (await client.listTools()).tools.find(
      (tool) => tool.name === "play_animation",
    );
    assert.match(playTool.description, /finger-gun/);
  }
});

test("VoxAvatar MCP closes active sessions and allows a fresh client after handler close", async (context) => {
  const mcpHandler = createVoxAvatarMcpHandler({
    onAnimation: () => true,
    onWindowAction: () => false,
    getStatus: () => ({ windowVisible: false }),
    getAnimations: () => [],
  });
  const bridge = createBridgeServer({
    port: 0,
    onEvent: () => {},
    mcpHandler,
  });
  const address = await bridge.listen();
  const bridgeUrl = `http://127.0.0.1:${address.port}/mcp`;
  context.after(async () => {
    await bridge.close();
  });

  const oldClient = new Client({ name: "old-session", version: "1.0.0" });
  const oldTransport = new StreamableHTTPClientTransport(new URL(bridgeUrl));
  await oldClient.connect(oldTransport);
  await oldClient.callTool({ name: "get_status", arguments: {} });

  await mcpHandler.close();
  assert.equal(mcpHandler.sessionCount(), 0);

  await assert.rejects(
    () => oldClient.callTool({ name: "get_status", arguments: {} }),
    /session|404|not found|closed|fetch failed/i,
  );
  await oldClient.close().catch(() => {});

  const newClient = new Client({ name: "new-session", version: "1.0.0" });
  await newClient.connect(
    new StreamableHTTPClientTransport(new URL(bridgeUrl)),
  );
  const statusPayload = parseToolPayload(
    await newClient.callTool({ name: "get_status", arguments: {} }),
  );
  assert.equal(statusPayload.status_schema_version, STATUS_SCHEMA_VERSION);
  assert.equal(statusPayload.windowVisible, false);
  await newClient.close().catch(() => {});
});
