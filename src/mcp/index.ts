#!/usr/bin/env node

import { startStdioServer } from './server';

// Export server functions
export { createMCPServer, startStdioServer } from './server';

// Export session store
export { getSessionStore, FormationSessionStore } from './state/FormationSessionStore';

// Export tool utilities
export { registerTool, getAllTools, handleToolCall, initializeTools } from './tools/index';

// Export types
export * from './state/types';

// Export errors
export * from './errors';

// Export resources
export { getAllResources, getResourceContent, FORMATION_RESOURCES, RESOURCE_CONTENT } from './resources/index';

// Main entry point when run directly
if (require.main === module) {
  startStdioServer().catch((error) => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  });
}
