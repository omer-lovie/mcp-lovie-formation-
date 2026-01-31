#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESOURCE_CONTENT = exports.FORMATION_RESOURCES = exports.getResourceContent = exports.getAllResources = exports.initializeTools = exports.handleToolCall = exports.getAllTools = exports.registerTool = exports.FormationSessionStore = exports.getSessionStore = exports.startHttpServer = exports.createHttpServer = exports.startStdioServer = exports.createMCPServer = void 0;
const server_1 = require("./server");
const http_server_1 = require("./http-server");
// Export server functions
var server_2 = require("./server");
Object.defineProperty(exports, "createMCPServer", { enumerable: true, get: function () { return server_2.createMCPServer; } });
Object.defineProperty(exports, "startStdioServer", { enumerable: true, get: function () { return server_2.startStdioServer; } });
var http_server_2 = require("./http-server");
Object.defineProperty(exports, "createHttpServer", { enumerable: true, get: function () { return http_server_2.createHttpServer; } });
Object.defineProperty(exports, "startHttpServer", { enumerable: true, get: function () { return http_server_2.startHttpServer; } });
// Export session store
var FormationSessionStore_1 = require("./state/FormationSessionStore");
Object.defineProperty(exports, "getSessionStore", { enumerable: true, get: function () { return FormationSessionStore_1.getSessionStore; } });
Object.defineProperty(exports, "FormationSessionStore", { enumerable: true, get: function () { return FormationSessionStore_1.FormationSessionStore; } });
// Export tool utilities
var index_1 = require("./tools/index");
Object.defineProperty(exports, "registerTool", { enumerable: true, get: function () { return index_1.registerTool; } });
Object.defineProperty(exports, "getAllTools", { enumerable: true, get: function () { return index_1.getAllTools; } });
Object.defineProperty(exports, "handleToolCall", { enumerable: true, get: function () { return index_1.handleToolCall; } });
Object.defineProperty(exports, "initializeTools", { enumerable: true, get: function () { return index_1.initializeTools; } });
// Export types
__exportStar(require("./state/types"), exports);
// Export errors
__exportStar(require("./errors"), exports);
// Export resources
var index_2 = require("./resources/index");
Object.defineProperty(exports, "getAllResources", { enumerable: true, get: function () { return index_2.getAllResources; } });
Object.defineProperty(exports, "getResourceContent", { enumerable: true, get: function () { return index_2.getResourceContent; } });
Object.defineProperty(exports, "FORMATION_RESOURCES", { enumerable: true, get: function () { return index_2.FORMATION_RESOURCES; } });
Object.defineProperty(exports, "RESOURCE_CONTENT", { enumerable: true, get: function () { return index_2.RESOURCE_CONTENT; } });
// Parse command line arguments
const args = process.argv.slice(2);
const mode = args.includes('--http') ? 'http' : 'stdio';
const portArg = args.find(arg => arg.startsWith('--port='));
const port = portArg ? parseInt(portArg.split('=')[1], 10) : 3001;
// Main entry point when run directly
if (require.main === module) {
    if (mode === 'http') {
        (0, http_server_1.startHttpServer)(port).catch((error) => {
            console.error('Failed to start HTTP MCP server:', error);
            process.exit(1);
        });
    }
    else {
        (0, server_1.startStdioServer)().catch((error) => {
            console.error('Failed to start MCP server:', error);
            process.exit(1);
        });
    }
}
//# sourceMappingURL=index.js.map