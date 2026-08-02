"use strict";

const { randomUUID } = require("node:crypto");
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const {
  StreamableHTTPServerTransport,
} = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const {
  isInitializeRequest,
} = require("@modelcontextprotocol/sdk/types.js");
const z = require("zod/v4");
const { version } = require("../package.json");
const {
  ANIMATION_NAME_PATTERN,
  describeAnimations,
} = require("./library-catalog.cjs");
const {
  formatControlWindow,
  formatGetStatus,
  formatListAnimations,
  formatPlayAnimation,
  formatSetCharacterState,
  formatShowMessage,
  serializeToolResult,
} = require("./mcp-schemas.cjs");

const MCP_PATH = "/mcp";
const WINDOW_ACTIONS = ["show", "hide", "toggle"];
const MESSAGE_MOODS = ["neutral", "cheerful", "thinking", "warning"];
const CHARACTER_STATES = [
  "idle",
  "listening",
  "speaking",
  "working",
  "reviewing",
  "success",
  "failed",
];
const MAX_MCP_SESSIONS = 32;
const MCP_SESSION_IDLE_TTL_MS = 30 * 60 * 1000;
const MCP_SESSION_SWEEP_MS = 60_000;
const SERVER_INSTRUCTIONS =
  "VoxAvatar controls the installed local desktop character. Use play_animation when the user asks for a visual reaction or it clearly supports their request. Call list_animations when you need the current action catalog. Use control_window to show, hide, or toggle VoxAvatar. Use set_character_state for presentation states such as working, success, or failed (never invent chat content). Use show_message only for short user-facing captions when Settings allows agent messages. VoxAvatar never speaks or plays audio. get_status and list_animations are read-only.";

function animationToolDescription(animations) {
  return [
    "Play one randomly selected clip from an installed character action. This shows VoxAvatar and temporarily takes priority over voice-driven body motion.",
    "Playable actions:",
    describeAnimations(animations),
  ].join("\n");
}

function animationInputSchema(animations) {
  return z
    .string()
    .regex(
      ANIMATION_NAME_PATTERN,
      "Animation names use lowercase letters, numbers, and single hyphens.",
    )
    .describe(
      `The installed character action to play.\n${describeAnimations(animations)}`,
    );
}

function createVoxAvatarMcpServer({
  onAnimation,
  onWindowAction,
  onShowMessage = null,
  onCharacterState = null,
  getStatus,
  getAnimations = () => [],
  getSessionId = () => null,
}) {
  const animations = getAnimations();
  const server = new McpServer(
    {
      name: "VoxAvatar",
      version,
    },
    {
      instructions: SERVER_INSTRUCTIONS,
    },
  );

  const animationTool = server.registerTool(
    "play_animation",
    {
      title: "Play VoxAvatar animation",
      description: animationToolDescription(animations),
      inputSchema: {
        animation: animationInputSchema(animations),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ animation }) => {
      const installed = getAnimations().some(
        (candidate) => candidate.animation_name === animation,
      );
      if (!installed) {
        return {
          ...serializeToolResult(
            formatPlayAnimation({
              animation,
              played: false,
              error: "animation_not_playable",
            }),
          ),
          isError: true,
        };
      }
      const played = await onAnimation(animation);
      if (played === false) {
        return {
          ...serializeToolResult(
            formatPlayAnimation({
              animation,
              played: false,
              error: "model_or_clips_missing",
            }),
          ),
          isError: true,
        };
      }
      return serializeToolResult(
        formatPlayAnimation({ animation, played: true }),
      );
    },
  );

  server.registerTool(
    "list_animations",
    {
      title: "List VoxAvatar animations",
      description:
        "Read the current playable VoxAvatar action names, descriptions, and trigger scenarios. The result reflects Settings changes immediately.",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () =>
      serializeToolResult(formatListAnimations(getAnimations())),
  );

  server.registerTool(
    "control_window",
    {
      title: "Control VoxAvatar window",
      description:
        "Show, hide, or toggle the local VoxAvatar window. Hiding the window does not quit VoxAvatar.",
      inputSchema: {
        action: z.enum(WINDOW_ACTIONS).describe("The window action to perform."),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ action }) => {
      const visible = await onWindowAction(action);
      return serializeToolResult(formatControlWindow({ action, visible }));
    },
  );

  server.registerTool(
    "get_status",
    {
      title: "Get VoxAvatar status",
      description:
        "Read VoxAvatar's window visibility, voice state, listener status, and whether agent messages are enabled or currently visible. Never returns message text or history.",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () =>
      serializeToolResult(formatGetStatus(await getStatus())),
  );

  if (typeof onShowMessage === "function") {
    server.registerTool(
      "show_message",
      {
        title: "Show VoxAvatar message bubble",
        description:
          "Display a short caption, emoji, or kaomoji beside the avatar. Only use when the user asked for a brief status note. Do not send long text, secrets, Markdown, links, images, or token streams. Requires Settings opt-in.",
        inputSchema: {
          text: z
            .string()
            .min(1)
            .max(480)
            .describe(
              "Short plain-text caption (max 80 Unicode graphemes after sanitize; keep under ~480 UTF-16 units).",
            ),
          duration_ms: z
            .number()
            .int()
            .min(1000)
            .max(15_000)
            .optional()
            .describe("Optional display duration in milliseconds (1000–15000)."),
          mood: z
            .enum(MESSAGE_MOODS)
            .optional()
            .describe("Optional presentation mood mapped to a fixed style."),
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: false,
        },
      },
      async ({ text, duration_ms, mood }) => {
        const result = await onShowMessage(
          { text, duration_ms, mood },
          { sessionId: getSessionId() },
        );
        const payload = formatShowMessage(result ?? { displayed: false });
        if (!result?.displayed) {
          return { ...serializeToolResult(payload), isError: true };
        }
        return serializeToolResult(payload);
      },
    );
  }

  if (typeof onCharacterState === "function") {
    server.registerTool(
      "set_character_state",
      {
        title: "Set VoxAvatar character state",
        description:
          "Set a presentation state for the desktop character (idle, listening, speaking, working, reviewing, success, failed). Does not invent chat content. Optional ttl_ms bounds how long the state stays active; session disconnect clears it.",
        inputSchema: {
          state: z
            .enum(CHARACTER_STATES)
            .describe("Presentation state to apply."),
          ttl_ms: z
            .number()
            .int()
            .min(0)
            .max(600_000)
            .optional()
            .describe(
              "Optional TTL in milliseconds (0–600000). Omit or 0 to use the state's default TTL; positive values bound lifetime.",
            ),
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: false,
        },
      },
      async ({ state, ttl_ms }) => {
        const result = await onCharacterState(
          { state, ttl_ms },
          { sessionId: getSessionId() },
        );
        const payload = formatSetCharacterState(
          result ?? { applied: false },
        );
        if (!result?.applied) {
          return { ...serializeToolResult(payload), isError: true };
        }
        return serializeToolResult(payload);
      },
    );
  }

  server.refreshAnimationCatalog = () => {
    const currentAnimations = getAnimations();
    animationTool.update({
      description: animationToolDescription(currentAnimations),
      paramsSchema: {
        animation: animationInputSchema(currentAnimations),
      },
    });
  };

  return server;
}

function createVoxAvatarMcpHandler(
  controller,
  {
    maxSessions = MAX_MCP_SESSIONS,
    sessionIdleTtlMs = MCP_SESSION_IDLE_TTL_MS,
    sweepIntervalMs = MCP_SESSION_SWEEP_MS,
    now = () => Date.now(),
  } = {},
) {
  const sessions = new Map();
  let sweepTimer = null;

  async function closeSession(sessionId) {
    const session = sessions.get(sessionId);
    if (!session) return;
    sessions.delete(sessionId);
    controller.onSessionClosed?.(sessionId);
    try {
      await session.server.close();
    } catch {
      // best-effort cleanup
    }
  }

  function touchSession(sessionId) {
    const session = sessions.get(sessionId);
    if (!session) return;
    session.lastActiveAt = now();
  }

  async function enforceSessionCap() {
    while (sessions.size >= maxSessions) {
      let oldestId = null;
      let oldestAt = Number.POSITIVE_INFINITY;
      for (const [sessionId, session] of sessions) {
        if (session.lastActiveAt < oldestAt) {
          oldestAt = session.lastActiveAt;
          oldestId = sessionId;
        }
      }
      if (oldestId == null) break;
      await closeSession(oldestId);
    }
  }

  async function sweepIdleSessions() {
    const cutoff = now() - sessionIdleTtlMs;
    const expired = [];
    for (const [sessionId, session] of sessions) {
      if (session.lastActiveAt <= cutoff) expired.push(sessionId);
    }
    for (const sessionId of expired) {
      await closeSession(sessionId);
    }
  }

  function ensureSweep() {
    if (sweepTimer || sweepIntervalMs <= 0) return;
    sweepTimer = setInterval(() => {
      void sweepIdleSessions();
    }, sweepIntervalMs);
    sweepTimer.unref?.();
  }

  const handler = async (request, response, parsedBody) => {
    ensureSweep();
    const header = request.headers["mcp-session-id"];
    const sessionId = Array.isArray(header) ? header[0] : header;
    let session = sessionId ? sessions.get(sessionId) : null;
    try {
      if (
        !session &&
        !sessionId &&
        request.method === "POST" &&
        isInitializeRequest(parsedBody)
      ) {
        await enforceSessionCap();
        let transport;
        const sessionRef = { id: null };
        const server = createVoxAvatarMcpServer({
          ...controller,
          getSessionId: () => sessionRef.id,
        });
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: randomUUID,
          enableJsonResponse: true,
          onsessioninitialized: (initializedSessionId) => {
            sessionRef.id = initializedSessionId;
            session = {
              server,
              transport,
              lastActiveAt: now(),
            };
            sessions.set(initializedSessionId, session);
          },
        });
        transport.onclose = () => {
          const closedSessionId = transport.sessionId;
          if (closedSessionId) {
            sessions.delete(closedSessionId);
            controller.onSessionClosed?.(closedSessionId);
          }
        };
        await server.connect(transport);
        await transport.handleRequest(request, response, parsedBody);
        if (transport.sessionId) touchSession(transport.sessionId);
        return;
      }

      if (!session) {
        response.writeHead(sessionId ? 404 : 400, {
          "content-type": "application/json",
        });
        response.end(
          JSON.stringify({
            jsonrpc: "2.0",
            error: {
              code: -32000,
              message: sessionId
                ? "MCP session not found"
                : "MCP session ID is required",
            },
            id: null,
          }),
        );
        return;
      }

      touchSession(sessionId);
      await session.transport.handleRequest(request, response, parsedBody);
      touchSession(sessionId);
    } catch (error) {
      if (!response.headersSent) {
        response.writeHead(500, { "content-type": "application/json" });
        response.end(
          JSON.stringify({
            jsonrpc: "2.0",
            error: { code: -32603, message: "Internal server error" },
            id: null,
          }),
        );
      }
      throw error;
    }
  };

  handler.notifyToolsChanged = () => {
    for (const { server } of sessions.values()) {
      server.refreshAnimationCatalog();
    }
  };

  handler.sessionCount = () => sessions.size;

  handler.sweepIdleSessions = sweepIdleSessions;

  handler.close = async () => {
    if (sweepTimer) {
      clearInterval(sweepTimer);
      sweepTimer = null;
    }
    const activeSessions = [...sessions.entries()];
    sessions.clear();
    await Promise.allSettled(
      activeSessions.map(([, { server }]) => server.close()),
    );
  };

  return handler;
}

module.exports = {
  MCP_PATH,
  MAX_MCP_SESSIONS,
  MCP_SESSION_IDLE_TTL_MS,
  MCP_SESSION_SWEEP_MS,
  SERVER_INSTRUCTIONS,
  WINDOW_ACTIONS,
  createVoxAvatarMcpHandler,
  createVoxAvatarMcpServer,
};
