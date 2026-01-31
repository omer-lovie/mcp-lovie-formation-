import { FormationSessionStore } from '../state/FormationSessionStore';
export interface ToolDefinition {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: Record<string, unknown>;
        required: string[];
    };
}
export type ToolHandler = (args: Record<string, unknown>, store: FormationSessionStore) => Promise<unknown>;
export declare function registerTool(tool: ToolDefinition, handler: ToolHandler): void;
export declare function getAllTools(): ToolDefinition[];
export declare function handleToolCall(name: string, args: Record<string, unknown>, store: FormationSessionStore): Promise<unknown>;
export declare function initializeTools(): void;
//# sourceMappingURL=index.d.ts.map