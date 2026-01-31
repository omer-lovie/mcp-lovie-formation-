"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTool = registerTool;
exports.getAllTools = getAllTools;
exports.handleToolCall = handleToolCall;
exports.initializeTools = initializeTools;
// Tool registry
const toolHandlers = new Map();
const toolDefinitions = new Map();
// Register a tool
function registerTool(tool, handler) {
    toolDefinitions.set(tool.name, tool);
    toolHandlers.set(tool.name, handler);
}
// Get all registered tools
function getAllTools() {
    return Array.from(toolDefinitions.values());
}
// Handle a tool call - no auth required, collect info upfront
async function handleToolCall(name, args, store) {
    const handler = toolHandlers.get(name);
    if (!handler) {
        throw new Error(`Unknown tool: ${name}`);
    }
    return handler(args, store);
}
// Import tool registration functions
const session_1 = require("./session");
const company_1 = require("./company");
const stakeholders_1 = require("./stakeholders");
const certificate_1 = require("./certificate");
const sync_1 = require("./sync");
const info_1 = require("./info");
const submission_1 = require("./submission");
const payment_1 = require("./payment");
// Import and register all tools
function initializeTools() {
    (0, session_1.registerSessionTools)();
    (0, company_1.registerCompanyTools)();
    (0, stakeholders_1.registerStakeholderTools)();
    (0, certificate_1.registerCertificateTools)();
    (0, sync_1.registerSyncTools)();
    (0, info_1.registerInfoTools)();
    (0, payment_1.registerPaymentTools)();
    (0, submission_1.registerSubmissionTools)();
}
// Initialize tools on module load
initializeTools();
//# sourceMappingURL=index.js.map