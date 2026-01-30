import express, { Request, Response } from 'express';
import cors from 'cors';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { getAllTools, handleToolCall } from './tools/index';
import { getSessionStore } from './state/FormationSessionStore';
import { getAllResources, getResourceContent } from './resources/index';

const DEFAULT_PORT = 3001;

// Store active transports for cleanup
const activeTransports = new Map<string, SSEServerTransport>();

function createMCPServerInstance(): Server {
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

export function createHttpServer(port: number = DEFAULT_PORT): express.Application {
  const app = express();

  // CORS configuration - allow all origins for MCP clients
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  }));

  app.use(express.json());

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      server: 'lovie-formation-mcp',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Server info endpoint
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'Lovie Formation MCP Server',
      version: '1.0.0',
      description: 'MCP server for company formation - Form your US company via Claude',
      endpoints: {
        sse: '/sse',
        messages: '/messages',
        health: '/health',
      },
      mcp: {
        version: '2024-11-05',
        capabilities: ['tools', 'resources'],
      },
    });
  });

  // SSE endpoint for MCP communication
  app.get('/sse', async (req: Request, res: Response) => {
    console.log('New SSE connection established');

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Create transport and server for this connection
    const transport = new SSEServerTransport('/messages', res);
    const server = createMCPServerInstance();

    // Generate a unique ID for this connection
    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    activeTransports.set(connectionId, transport);

    // Handle connection close
    req.on('close', () => {
      console.log(`SSE connection ${connectionId} closed`);
      activeTransports.delete(connectionId);
      server.close();
    });

    try {
      await server.connect(transport);
      console.log(`MCP server connected for ${connectionId}`);
    } catch (error) {
      console.error('Failed to connect MCP server:', error);
      activeTransports.delete(connectionId);
    }
  });

  // Messages endpoint for client-to-server communication
  app.post('/messages', async (req: Request, res: Response) => {
    // Find the active transport (in a simple setup, we just use the most recent one)
    // For production, you'd want to use session IDs to match transports
    const transports = Array.from(activeTransports.values());

    if (transports.length === 0) {
      res.status(503).json({
        error: 'No active SSE connection',
        message: 'Please establish an SSE connection first via GET /sse',
      });
      return;
    }

    const transport = transports[transports.length - 1];

    try {
      await transport.handlePostMessage(req, res);
    } catch (error) {
      console.error('Error handling message:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // List available tools (non-MCP endpoint for debugging)
  app.get('/tools', (_req: Request, res: Response) => {
    const tools = getAllTools();
    res.json({ tools });
  });

  // List available resources (non-MCP endpoint for debugging)
  app.get('/resources', (_req: Request, res: Response) => {
    const resources = getAllResources();
    res.json({ resources });
  });

  return app;
}

export async function startHttpServer(port: number = DEFAULT_PORT): Promise<void> {
  const app = createHttpServer(port);

  const server = app.listen(port, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║         Lovie Formation MCP Server (HTTP Mode)             ║
╠════════════════════════════════════════════════════════════╣
║  Server running at: http://localhost:${port.toString().padEnd(24, ' ')}║
║                                                            ║
║  Endpoints:                                                ║
║    GET  /        - Server info                             ║
║    GET  /health  - Health check                            ║
║    GET  /sse     - SSE endpoint for MCP                    ║
║    POST /messages - Message endpoint for MCP               ║
║    GET  /tools   - List available tools                    ║
║    GET  /resources - List available resources              ║
║                                                            ║
║  MCP Client Config:                                        ║
║  {                                                         ║
║    "mcpServers": {                                         ║
║      "lovie-formation": {                                  ║
║        "url": "http://localhost:${port}/sse"${' '.repeat(19 - port.toString().length)}║
║      }                                                     ║
║    }                                                       ║
║  }                                                         ║
╚════════════════════════════════════════════════════════════╝
`);
  });

  // Handle graceful shutdown
  const shutdown = () => {
    console.log('\nShutting down server...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
