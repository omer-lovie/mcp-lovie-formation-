import type { VercelRequest, VercelResponse } from '@vercel/node';

// SSE endpoint for MCP - redirects to the stateless /api/mcp endpoint
// Note: Vercel serverless has limitations with long-lived SSE connections
// For full SSE support, consider using Vercel Edge Functions or a persistent server

export const config = {
  maxDuration: 60, // Max 60 seconds for SSE in Vercel
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send initial connection message
  const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Send endpoint info as first SSE message
  const endpointMessage = {
    jsonrpc: '2.0',
    method: 'endpoint',
    params: {
      uri: '/api/messages',
    },
  };

  res.write(`event: endpoint\ndata: ${JSON.stringify(endpointMessage)}\n\n`);

  // Send server info
  const serverInfo = {
    jsonrpc: '2.0',
    id: 0,
    result: {
      protocolVersion: '2024-11-05',
      serverInfo: {
        name: 'lovie-formation',
        version: '1.0.0',
      },
      capabilities: {
        tools: {},
        resources: {},
      },
    },
  };

  res.write(`event: message\ndata: ${JSON.stringify(serverInfo)}\n\n`);

  // Keep connection alive with periodic pings
  const pingInterval = setInterval(() => {
    try {
      res.write(`: ping ${Date.now()}\n\n`);
    } catch {
      clearInterval(pingInterval);
    }
  }, 15000);

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(pingInterval);
    console.log(`SSE connection ${connectionId} closed`);
  });

  // For Vercel, we can't keep the connection open forever
  // Set a timeout to close after maxDuration
  setTimeout(() => {
    clearInterval(pingInterval);
    res.write(`event: close\ndata: {"reason": "timeout"}\n\n`);
    res.end();
  }, 55000); // Close before Vercel's 60s timeout
}
