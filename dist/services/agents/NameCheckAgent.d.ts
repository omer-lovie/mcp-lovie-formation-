/**
 * Name Check Agent Client
 * Checks company name availability using Delaware Name Check API
 */
import { BaseAgentClient } from './BaseAgentClient';
import { AgentClientConfig, NameCheckRequestSimple, NameCheckResponseSimple, CompanyType, USState } from './types';
/**
 * NameCheckAgent - Checks company name availability with Delaware
 *
 * Uses the Delaware Name Check API at Railway:
 * https://fabulous-communication-production.up.railway.app
 *
 * @example
 * ```typescript
 * const client = new NameCheckAgent({
 *   baseUrl: 'https://fabulous-communication-production.up.railway.app',
 *   timeout: 300000 // 5 minutes for CAPTCHA solving
 * });
 *
 * const result = await client.checkAvailability({
 *   companyName: 'Acme Technologies',
 *   state: 'DE',
 *   companyType: 'LLC'
 * });
 *
 * if (result.available) {
 *   console.log('Name is available!');
 * } else {
 *   console.log('Unavailable:', result.reason);
 * }
 * ```
 */
export declare class NameCheckAgent extends BaseAgentClient {
    constructor(config: AgentClientConfig);
    /**
     * Check if a company name is available (high-level API)
     *
     * @param request - Name check request with company details
     * @returns Promise resolving to availability result
     *
     * @example
     * ```typescript
     * const result = await agent.checkAvailability({
     *   companyName: 'Acme Technologies',
     *   state: 'DE',
     *   companyType: 'LLC'
     * });
     * ```
     */
    checkAvailability(request: NameCheckRequestSimple): Promise<NameCheckResponseSimple>;
    /**
     * Extract base name by removing common entity endings
     */
    private extractBaseName;
    /**
     * Generate alternative name suggestions
     */
    private generateSuggestions;
    /**
     * Get alternative name suggestions for an unavailable name
     *
     * @param companyName - The unavailable company name
     * @param state - State code
     * @param companyType - Type of company
     * @returns Promise resolving to list of alternative suggestions
     */
    getSuggestions(companyName: string, state: USState, companyType: CompanyType): Promise<string[]>;
    /**
     * Validate company name format (client-side validation)
     *
     * @param companyName - Name to validate
     * @param state - State code
     * @param companyType - Type of company
     * @returns Validation result with any errors
     */
    validateNameFormat(companyName: string, state: USState, companyType: CompanyType): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Batch check multiple names (sequential to avoid rate limits)
     *
     * @param names - Array of company names to check
     * @param state - State code
     * @param companyType - Type of company
     * @returns Promise resolving to array of check results
     */
    batchCheck(names: string[], state: USState, companyType: CompanyType): Promise<NameCheckResponseSimple[]>;
}
/**
 * Factory function to create a NameCheckAgent with environment config
 *
 * Automatically selects API URL based on NODE_ENV:
 * - development: Uses NAME_CHECK_API_URL (local server)
 * - production: Uses NAME_CHECK_API_URL_SERVER (production server)
 */
export declare function createNameCheckAgent(): NameCheckAgent;
//# sourceMappingURL=NameCheckAgent.d.ts.map