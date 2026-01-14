import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { getAllTools, handleToolCall } from './tools/index';
import { getSessionStore } from './state/FormationSessionStore';
import { getAllResources, getResourceContent } from './resources/index';

export function createMCPServer(): Server {
  const server = new Server(
    {
      name: 'lovie-formation',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  // Initialize session store
  const store = getSessionStore();

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = getAllTools();
    return { tools };
  });

  // List available resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const resources = getAllResources();
    return { resources };
  });

  // Read resource content
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    const content = getResourceContent(uri);

    if (!content) {
      throw new Error(`Resource not found: ${uri}`);
    }

    return {
      contents: [
        {
          uri,
          mimeType: 'text/markdown',
          text: content,
        },
      ],
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      const result = await handleToolCall(name, args || {}, store);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: true,
              code: 'TOOL_ERROR',
              message: errorMessage,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

export async function startStdioServer(): Promise<void> {
  const server = createMCPServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await server.close();
    process.exit(0);
  });
}
