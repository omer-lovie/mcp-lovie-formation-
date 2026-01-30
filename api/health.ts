import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  return res.json({
    status: 'ok',
    server: 'lovie-formation-mcp',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
}
