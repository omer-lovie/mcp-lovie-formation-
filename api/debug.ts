import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // Test 1: Basic response
    const tests: { name: string; status: string; error?: string }[] = [];
    tests.push({ name: 'basic', status: 'ok' });

    // Test 2: Import tools
    try {
      const { getAllTools } = await import('../src/mcp/tools/index');
      const tools = getAllTools();
      tests.push({ name: 'tools_import', status: 'ok', error: `${tools.length} tools loaded` });
    } catch (e) {
      tests.push({ name: 'tools_import', status: 'error', error: e instanceof Error ? e.message : String(e) });
    }

    // Test 3: Import session store
    try {
      const { getSessionStore } = await import('../src/mcp/state/FormationSessionStore');
      const store = getSessionStore();
      tests.push({ name: 'session_store', status: 'ok' });
    } catch (e) {
      tests.push({ name: 'session_store', status: 'error', error: e instanceof Error ? e.message : String(e) });
    }

    return res.json({ tests });
  } catch (error) {
    return res.status(500).json({
      error: 'Unexpected error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
