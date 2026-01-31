"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMCPServer = createMCPServer;
exports.startStdioServer = startStdioServer;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const index_1 = require("./tools/index");
const FormationSessionStore_1 = require("./state/FormationSessionStore");
const index_2 = require("./resources/index");
function createMCPServer() {
    const server = new index_js_1.Server({
        name: 'lovie-formation',
        version: '1.0.0',
    }, {
        capabilities: {
            tools: {},
            resources: {},
        },
    });
    // Initialize session store
    const store = (0, FormationSessionStore_1.getSessionStore)();
    // List available tools
    server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
        const tools = (0, index_1.getAllTools)();
        return { tools };
    });
    // List available resources
    server.setRequestHandler(types_js_1.ListResourcesRequestSchema, async () => {
        const resources = (0, index_2.getAllResources)();
        return { resources };
    });
    // Read resource content
    server.setRequestHandler(types_js_1.ReadResourceRequestSchema, async (request) => {
        const { uri } = request.params;
        const content = (0, index_2.getResourceContent)(uri);
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
    server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        try {
            const result = await (0, index_1.handleToolCall)(name, args || {}, store);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        }
        catch (error) {
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
async function startStdioServer() {
    const server = createMCPServer();
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        await server.close();
        process.exit(0);
    });
    process.on('SIGTERM', async () => {
        await server.close();
        process.exit(0);
    });
}
//# sourceMappingURL=server.js.map