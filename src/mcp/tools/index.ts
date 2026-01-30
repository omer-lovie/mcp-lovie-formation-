import { FormationSessionStore } from '../state/FormationSessionStore';

// Tool definition interface
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
  };
}

// Tool handler function type
export type ToolHandler = (
  args: Record<string, unknown>,
  store: FormationSessionStore
) => Promise<unknown>;

// Tool registry
const toolHandlers = new Map<string, ToolHandler>();
const toolDefinitions = new Map<string, ToolDefinition>();

// Register a tool
export function registerTool(tool: ToolDefinition, handler: ToolHandler): void {
  toolDefinitions.set(tool.name, tool);
  toolHandlers.set(tool.name, handler);
}

// Get all registered tools
export function getAllTools(): ToolDefinition[] {
  return Array.from(toolDefinitions.values());
}

// Handle a tool call - no auth required, collect info upfront
export async function handleToolCall(
  name: string,
  args: Record<string, unknown>,
  store: FormationSessionStore
): Promise<unknown> {
  const handler = toolHandlers.get(name);
  if (!handler) {
    throw new Error(`Unknown tool: ${name}`);
  }

  return handler(args, store);
}

// Import tool registration functions
import { registerSessionTools } from './session';
import { registerCompanyTools } from './company';
import { registerStakeholderTools } from './stakeholders';
import { registerCertificateTools } from './certificate';
import { registerSyncTools } from './sync';
import { registerInfoTools } from './info';
import { registerSubmissionTools } from './submission';
import { registerPaymentTools } from './payment';

// Import and register all tools
export function initializeTools(): void {
  registerSessionTools();
  registerCompanyTools();
  registerStakeholderTools();
  registerCertificateTools();
  registerSyncTools();
  registerInfoTools();
  registerPaymentTools();
  registerSubmissionTools();
}

// Initialize tools on module load
initializeTools();
