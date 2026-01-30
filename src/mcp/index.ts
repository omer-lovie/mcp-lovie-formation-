#!/usr/bin/env node

import { startStdioServer } from './server';
import { startHttpServer } from './http-server';

// Export server functions
export { createMCPServer, startStdioServer } from './server';
export { createHttpServer, startHttpServer } from './http-server';

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

// Parse command line arguments
const args = process.argv.slice(2);
const mode = args.includes('--http') ? 'http' : 'stdio';
const portArg = args.find(arg => arg.startsWith('--port='));
const port = portArg ? parseInt(portArg.split('=')[1], 10) : 3001;

// Main entry point when run directly
if (require.main === module) {
  if (mode === 'http') {
    startHttpServer(port).catch((error) => {
      console.error('Failed to start HTTP MCP server:', error);
      process.exit(1);
    });
  } else {
    startStdioServer().catch((error) => {
      console.error('Failed to start MCP server:', error);
      process.exit(1);
    });
  }
}
