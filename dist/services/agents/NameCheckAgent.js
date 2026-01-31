"use strict";
/**
 * Name Check Agent Client
 * Checks company name availability using Delaware Name Check API
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NameCheckAgent = void 0;
exports.createNameCheckAgent = createNameCheckAgent;
const BaseAgentClient_1 = require("./BaseAgentClient");
const types_1 = require("./types");
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
class NameCheckAgent extends BaseAgentClient_1.BaseAgentClient {
    constructor(config) {
        super('NameCheckAgent', config);
    }
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
    async checkAvailability(request) {
        // Extract base name (remove entity endings if present)
        const baseName = this.extractBaseName(request.companyName, request.companyType);
        // Get Delaware entity type code
        const delawareType = types_1.COMPANY_TYPE_TO_DELAWARE[request.companyType];
        const entityInfo = types_1.DELAWARE_ENTITY_TYPES[delawareType];
        // Prepare Delaware API request
        const delawareRequest = {
            baseName: baseName,
            entityType: delawareType,
            entityEnding: entityInfo.defaultEnding
        };
        try {
            // Make API request to Delaware Name Check API
            const response = await this.post('/api/v1/check', delawareRequest);
            // Transform Delaware API response to simple format
            return {
                available: response.status === 'available',
                companyName: response.companyName,
                state: request.state,
                suggestions: response.status === 'taken' ? this.generateSuggestions(baseName) : undefined,
                similarNames: undefined,
                reason: response.rejectionReasons?.join('; ') || undefined,
                checkedAt: response.checkedAt
            };
        }
        catch (error) {
            // Handle specific error cases
            if (error instanceof Error) {
                if (error.message.includes('timeout')) {
                    throw new Error('Name check timed out. The Delaware system may be slow. Please try again.');
                }
                if (error.message.includes('CAPTCHA')) {
                    throw new Error('Unable to verify name availability due to CAPTCHA issues. Please try again.');
                }
            }
            throw new Error('Unable to check name availability. Please try again or contact support.');
        }
    }
    /**
     * Extract base name by removing common entity endings
     */
    extractBaseName(companyName, companyType) {
        const name = companyName.trim();
        // Common entity endings to remove
        const endings = [
            // LLC variations
            'LLC', 'L.L.C.', 'Limited Liability Company',
            // Corporation variations
            'Inc.', 'Inc', 'Incorporated', 'Corp.', 'Corp', 'Corporation',
            'Company', 'Co.', 'Co', 'Limited', 'Ltd.', 'Ltd',
            // Partnership variations
            'LP', 'L.P.', 'Limited Partnership',
            'LLP', 'L.L.P.', 'Limited Liability Partnership',
            'GP', 'General Partnership', 'Partnership',
            // Trust variations
            'Trust', 'Statutory Trust'
        ];
        // Remove ending if found (case insensitive)
        let baseName = name;
        for (const ending of endings) {
            const regex = new RegExp(`\\s+${ending}\\s*$`, 'i');
            if (regex.test(baseName)) {
                baseName = baseName.replace(regex, '').trim();
                break;
            }
        }
        return baseName;
    }
    /**
     * Generate alternative name suggestions
     */
    generateSuggestions(baseName) {
        const suggestions = [];
        // Add variations
        suggestions.push(`${baseName} Technologies`);
        suggestions.push(`${baseName} Solutions`);
        suggestions.push(`${baseName} Ventures`);
        suggestions.push(`The ${baseName} Company`);
        suggestions.push(`${baseName} Group`);
        return suggestions.slice(0, 5);
    }
    /**
     * Get alternative name suggestions for an unavailable name
     *
     * @param companyName - The unavailable company name
     * @param state - State code
     * @param companyType - Type of company
     * @returns Promise resolving to list of alternative suggestions
     */
    async getSuggestions(companyName, state, companyType) {
        const baseName = this.extractBaseName(companyName, companyType);
        return this.generateSuggestions(baseName);
    }
    /**
     * Validate company name format (client-side validation)
     *
     * @param companyName - Name to validate
     * @param state - State code
     * @param companyType - Type of company
     * @returns Validation result with any errors
     */
    validateNameFormat(companyName, state, companyType) {
        const errors = [];
        // Check minimum length
        if (companyName.length < 3) {
            errors.push('Company name must be at least 3 characters');
        }
        // Check maximum length (Delaware allows up to 245 characters)
        if (companyName.length > 245) {
            errors.push('Company name cannot exceed 245 characters');
        }
        // Check for invalid characters
        const invalidChars = /[<>@#$%^&*()+=\[\]{}|\\;:"'<>,?/~`]/;
        if (invalidChars.test(companyName)) {
            errors.push('Company name contains invalid characters');
        }
        // Check for required entity ending (basic check)
        const delawareType = types_1.COMPANY_TYPE_TO_DELAWARE[companyType];
        const entityInfo = types_1.DELAWARE_ENTITY_TYPES[delawareType];
        if (entityInfo.requiresEnding) {
            const hasEnding = new RegExp(`(${entityInfo.validEndings.join('|')})\\s*$`, 'i').test(companyName);
            if (!hasEnding) {
                errors.push(`Company name should include an entity ending like "${entityInfo.defaultEnding}"`);
            }
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    /**
     * Batch check multiple names (sequential to avoid rate limits)
     *
     * @param names - Array of company names to check
     * @param state - State code
     * @param companyType - Type of company
     * @returns Promise resolving to array of check results
     */
    async batchCheck(names, state, companyType) {
        const results = [];
        for (const name of names) {
            try {
                const result = await this.checkAvailability({
                    companyName: name,
                    state,
                    companyType
                });
                results.push(result);
                // Add delay between requests to be respectful
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            catch (error) {
                // Continue with other names even if one fails
                results.push({
                    available: false,
                    companyName: name,
                    state,
                    reason: 'Error checking availability',
                    checkedAt: new Date().toISOString()
                });
            }
        }
        return results;
    }
}
exports.NameCheckAgent = NameCheckAgent;
/**
 * Factory function to create a NameCheckAgent with environment config
 *
 * Automatically selects API URL based on NODE_ENV:
 * - development: Uses NAME_CHECK_API_URL (local server)
 * - production: Uses NAME_CHECK_API_URL_SERVER (production server)
 */
function createNameCheckAgent() {
    const isProduction = process.env.NODE_ENV === 'production';
    const baseUrl = isProduction
        ? process.env.NAME_CHECK_API_URL_SERVER
        : process.env.NAME_CHECK_API_URL;
    if (!baseUrl) {
        const requiredVar = isProduction ? 'NAME_CHECK_API_URL_SERVER' : 'NAME_CHECK_API_URL';
        throw new Error(`${requiredVar} environment variable is required for ${isProduction ? 'production' : 'development'}`);
    }
    const config = {
        baseUrl,
        apiKey: process.env.NAME_CHECK_API_KEY,
        timeout: parseInt(process.env.NAME_CHECK_TIMEOUT || '300000'), // 5 minutes default
        retryConfig: {
            maxAttempts: 3,
            initialDelayMs: 1000,
            maxDelayMs: 10000,
            backoffMultiplier: 2,
            retryableStatusCodes: [408, 429, 500, 502, 503, 504],
            retryableErrorCodes: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ENETUNREACH']
        }
    };
    return new NameCheckAgent(config);
}
//# sourceMappingURL=NameCheckAgent.js.map