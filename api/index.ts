import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (_req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.json({
    name: 'Lovie Formation MCP Server',
    version: '1.0.0',
    description: 'MCP server for company formation - Form your US company via Claude',
    endpoints: {
      sse: '/api/sse',
      messages: '/api/messages',
      health: '/api/health',
      tools: '/api/tools',
      resources: '/api/resources',
    },
    mcp: {
      version: '2024-11-05',
      capabilities: ['tools', 'resources'],
    },
  });
}
