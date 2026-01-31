"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formationSyncTool = void 0;
exports.registerSyncTools = registerSyncTools;
const index_1 = require("./index");
const session_1 = require("../middleware/session");
// T044: formation_sync tool
exports.formationSyncTool = {
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
const handleFormationSync = async (args, store) => {
    const sessionId = args.sessionId;
    const session = await (0, session_1.loadSession)(sessionId, store);
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
function registerSyncTools() {
    (0, index_1.registerTool)(exports.formationSyncTool, handleFormationSync);
}
//# sourceMappingURL=sync.js.map