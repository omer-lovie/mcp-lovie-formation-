/**
 * Name Check Agent - Validates company name availability
 * FR-021: CLI MUST communicate with Name Check Agent via API
 * FR-015: System MUST notify user within 5 seconds if name is available
 */
import { State, NameCheckResult, AgentResult } from '../types';
export interface NameCheckRequest {
    name: string;
    state: State;
}
/**
 * Name Check Agent for real-time name validation
 */
export declare class NameCheckAgent {
    private apiEndpoint;
    private timeout;
    constructor(apiEndpoint?: string);
    /**
     * Check if company name is available in specified state
     * @param request Name and state to check
     * @returns Result with availability and alternatives
     */
    checkAvailability(request: NameCheckRequest): Promise<AgentResult<NameCheckResult>>;
    /**
     * Perform the actual name check (to be implemented with real API)
     */
    private performNameCheck;
    /**
     * Check multiple names in parallel
     * @param names Array of names to check
     * @param state State to check in
     * @returns Array of results
     */
    checkMultiple(names: string[], state: State): Promise<AgentResult<NameCheckResult>[]>;
    /**
     * Suggest alternative names based on unavailable name
     * @param baseName Original name that was unavailable
     * @param state State to check in
     * @returns Array of available alternatives
     */
    suggestAlternatives(baseName: string, state: State): Promise<string[]>;
    /**
     * Validate name format (before checking availability)
     * @param name Company name to validate
     * @param type Company type for suffix validation
     * @returns Validation result
     */
    validateNameFormat(name: string, type: string): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=NameCheckAgent.d.ts.map