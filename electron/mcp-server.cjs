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

const MCP_PATH = "/mcp";
const WINDOW_ACTIONS = ["show", "hide", "toggle"];
const SERVER_INSTRUCTIONS =
  "VoxAvatar controls the installed local desktop character. Use play_animation when the user asks for a visual reaction or it clearly supports their request. Call list_animations when you need the current action catalog. Use control_window to show, hide, or toggle VoxAvatar. VoxAvatar never speaks or plays audio. get_status and list_animations are read-only.";

function textResult(text) {
  return {
    content: [{ type: "text", text }],
  };
}

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
  getStatus,
  getAnimations = () => [],
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
          ...textResult(
            `The ${animation} action is not currently playable. Call list_animations for the latest action catalog.`,
          ),
          isError: true,
        };
      }
      const played = await onAnimation(animation);
      if (played === false) {
        return {
          ...textResult(
            "VoxAvatar cannot play that action until a model and at least one clip are configured.",
          ),
          isError: true,
        };
      }
      return textResult(`VoxAvatar is playing the ${animation} action.`);
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
    async () => textResult(describeAnimations(getAnimations())),
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
      return textResult(`VoxAvatar's window is now ${visible ? "visible" : "hidden"}.`);
    },
  );

  server.registerTool(
    "get_status",
    {
      title: "Get VoxAvatar status",
      description:
        "Read VoxAvatar's window visibility, voice state, and local listener status.",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => textResult(JSON.stringify(await getStatus())),
  );

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

function createVoxAvatarMcpHandler(controller) {
  const sessions = new Map();

  const handler = async (request, response, parsedBody) => {
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
        let transport;
        const server = createVoxAvatarMcpServer(controller);
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: randomUUID,
          enableJsonResponse: true,
          onsessioninitialized: (initializedSessionId) => {
            session = { server, transport };
            sessions.set(initializedSessionId, session);
          },
        });
        transport.onclose = () => {
          const closedSessionId = transport.sessionId;
          if (closedSessionId) sessions.delete(closedSessionId);
        };
        await server.connect(transport);
        await transport.handleRequest(request, response, parsedBody);
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

      await session.transport.handleRequest(request, response, parsedBody);
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

  handler.close = async () => {
    const activeSessions = [...sessions.values()];
    sessions.clear();
    await Promise.allSettled(
      activeSessions.map(({ server }) => server.close()),
    );
  };

  return handler;
}

module.exports = {
  MCP_PATH,
  SERVER_INSTRUCTIONS,
  WINDOW_ACTIONS,
  createVoxAvatarMcpHandler,
  createVoxAvatarMcpServer,
};
