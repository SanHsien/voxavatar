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
  assert.match(animationResult.content[0].text, /wave-hello action/);
  assert.match(animationsResult.content[0].text, /A friendly wave/);
  assert.match(windowResult.content[0].text, /now visible/);
  assert.deepEqual(JSON.parse(statusResult.content[0].text), {
    windowVisible: true,
    voiceState,
    listener,
  });
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
    arguments: { animation: "download_from_the_internet" },
  });

  assert.equal(result.isError, true);
  assert.deepEqual(animations, []);
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
  assert.match(result.content[0].text, /model and at least one clip/);
});
