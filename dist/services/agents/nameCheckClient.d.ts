/**
 * Name Check Agent API Client
 *
 * Handles real-time company name availability checks with state databases.
 * Implements retry logic with exponential backoff for reliability.
 *
 * @module services/agents/nameCheckClient
 */
import { NameCheckRequest, NameCheckResponse, ClientConfig, LoadingCallback, CompanyType, DelawareEntityType } from './types';
/**
 * Name Check Agent API Client
 *
 * Provides methods to check company name availability in real-time
 * with automatic retry logic and error handling.
 *
 * @example
 * ```typescript
 * const client = new NameCheckClient({
 *   baseUrl: process.env.NAME_CHECK_API_URL,
 *   apiKey: process.env.NAME_CHECK_API_KEY,
 *   timeout: 30000,
 *   retryConfig: DEFAULT_RETRY_CONFIG
 * });
 *
 * const result = await client.checkAvailability({
 *   companyName: 'Acme Corporation',
 *   state: 'DE',
 *   companyType: 'LLC'
 * });
 * ```
 */
export declare class NameCheckClient {
    private readonly axiosInstance;
    private readonly retryConfig;
    private loadingCallback?;
    /**
     * Creates a new NameCheckClient instance
     *
     * @param config - Client configuration including base URL, API key, and retry settings
     */
    constructor(config: ClientConfig);
    /**
     * Sets a callback function for loading state updates
     *
     * @param callback - Function to call when loading state changes
     */
    setLoadingCallback(callback: LoadingCallback): void;
    /**
     * Checks if a company name is available in Delaware
     *
     * @param request - Name check request with baseName, entityType, and entityEnding
     * @returns Promise resolving to name availability response
     * @throws {Error} When all retry attempts fail or non-retryable error occurs
     *
     * @example
     * ```typescript
     * const result = await client.checkAvailability({
     *   baseName: 'Delaware Tech Solutions',
     *   entityType: 'Y',
     *   entityEnding: 'LLC'
     * });
     *
     * if (result.status === 'available') {
     *   console.log('Name is available!');
     * } else {
     *   console.log('Name taken. Reasons:', result.rejectionReasons);
     * }
     * ```
     */
    checkAvailability(request: NameCheckRequest): Promise<NameCheckResponse>;
    /**
     * Helper method to check availability with a simple company name string
     *
     * @param baseName - The desired company name (without entity ending)
     * @param companyType - Company type (LLC, C-Corp, LP, etc.)
     * @returns Promise resolving to name availability response
     *
     * @example
     * ```typescript
     * const result = await client.checkNameByType('Delaware Tech Solutions', 'LLC');
     * if (result.status === 'available') {
     *   console.log('Available!');
     * }
     * ```
     */
    checkNameByType(baseName: string, companyType: CompanyType): Promise<NameCheckResponse>;
    /**
     * Helper method to check availability with explicit entity type code
     *
     * @param baseName - The desired company name (without entity ending)
     * @param entityType - Delaware entity type code (C, Y, L, P, G, T)
     * @param entityEnding - Optional custom ending (uses default if not provided)
     * @returns Promise resolving to name availability response
     *
     * @example
     * ```typescript
     * const result = await client.checkNameWithCode('Delaware Tech', 'Y', 'LLC');
     * ```
     */
    checkNameWithCode(baseName: string, entityType: DelawareEntityType, entityEnding?: string): Promise<NameCheckResponse>;
    /**
     * Executes a function with exponential backoff retry logic
     *
     * @param fn - Async function to execute with retries
     * @returns Promise resolving to function result
     * @throws {Error} When max retry attempts exceeded or non-retryable error
     */
    private executeWithRetry;
    /**
     * Determines if an error is retryable based on error type and status code
     *
     * @param error - Error to check
     * @returns True if error is retryable, false otherwise
     */
    private isRetryableError;
    /**
     * Handles and transforms errors into user-friendly messages
     *
     * @param error - Error to handle
     * @returns Transformed error with user-friendly message
     */
    private handleError;
    /**
     * Updates loading state via callback if set
     *
     * @param isLoading - Loading state
     * @param message - Optional loading message
     */
    private setLoading;
    /**
     * Sleeps for specified duration
     *
     * @param ms - Milliseconds to sleep
     */
    private sleep;
}
/**
 * Factory function to create a NameCheckClient with environment variables
 *
 * Automatically selects the appropriate API URL based on NODE_ENV:
 * - development: Uses NAME_CHECK_API_URL (local server)
 * - production: Uses NAME_CHECK_API_URL_SERVER (production server)
 *
 * @returns Configured NameCheckClient instance
 * @throws {Error} If required environment variables are missing
 *
 * @example
 * ```typescript
 * const client = createNameCheckClient();
 * const result = await client.checkAvailability({...});
 * ```
 */
export declare function createNameCheckClient(): NameCheckClient;
//# sourceMappingURL=nameCheckClient.d.ts.map