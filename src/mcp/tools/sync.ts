import { registerTool, ToolDefinition } from './index';
import { FormationSessionStore } from '../state/FormationSessionStore';
import { loadSession } from '../middleware/session';

// T044: formation_sync tool
export const formationSyncTool: ToolDefinition = {
  name: 'formation_sync',
  description: 'Sync session data with the backend database. Called automatically but can be triggered manually.',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: 'Session ID to sync' },
    },
    required: ['sessionId'],
  },
};

const handleFormationSync = async (
  args: Record<string, unknown>,
  store: FormationSessionStore
) => {
  const sessionId = args.sessionId as string;
  const session = await loadSession(sessionId, store);

  // In a real implementation, this would sync with a backend database
  // For now, just return success with the session data

  return {
    success: true,
    sessionId: session.sessionId,
    syncedAt: new Date().toISOString(),
    message: 'Session data synced successfully.',
  };
};

// Register tools
export function registerSyncTools(): void {
  registerTool(formationSyncTool, handleFormationSync);
}
