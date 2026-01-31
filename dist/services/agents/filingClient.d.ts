/**
 * Filing Agent API Client
 *
 * Submits incorporation documents to state authorities and tracks filing status.
 * Handles expedited filing options and provides real-time status updates.
 *
 * @module services/agents/filingClient
 */
import { FilingRequest, FilingResponse, FilingStatusResponse, ClientConfig, LoadingCallback, ProgressCallback } from './types';
/**
 * Filing Agent API Client
 *
 * Provides methods to submit incorporation documents to state authorities
 * and track filing status with automatic retries and progress tracking.
 *
 * @example
 * ```typescript
 * const client = new FilingClient({
 *   baseUrl: process.env.FILING_AGENT_API_URL,
 *   apiKey: process.env.FILING_AGENT_API_KEY,
 *   timeout: 60000,
 *   retryConfig: DEFAULT_RETRY_CONFIG
 * });
 *
 * const result = await client.submitFiling({
 *   sessionId: 'session-123',
 *   companyDetails: {...},
 *   documents: [...],
 *   expedited: true
 * });
 * ```
 */
export declare class FilingClient {
    private readonly axiosInstance;
    private readonly retryConfig;
    private loadingCallback?;
    private progressCallback?;
    /**
     * Creates a new FilingClient instance
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
     * Sets a callback function for progress updates
     *
     * @param callback - Function to call with progress updates
     */
    setProgressCallback(callback: ProgressCallback): void;
    /**
     * Submits incorporation documents to state authorities
     *
     * @param request - Filing request with company details and documents
     * @returns Promise resolving to filing confirmation with tracking info
     * @throws {Error} When filing submission fails or retry attempts exhausted
     *
     * @example
     * ```typescript
     * const result = await client.submitFiling({
     *   sessionId: 'session-123',
     *   companyDetails: {
     *     name: 'Acme LLC',
     *     state: 'DE',
     *     type: 'LLC',
     *     shareholders: [...],
     *     registeredAgent: {...}
     *   },
     *   documents: [
     *     { documentId: 'doc-1', documentType: 'articles', ... }
     *   ],
     *   expedited: true
     * });
     *
     * console.log('Filing ID:', result.filingId);
     * console.log('Confirmation:', result.confirmationNumber);
     * console.log('Track at:', result.trackingUrl);
     * ```
     */
    submitFiling(request: FilingRequest): Promise<FilingResponse>;
    /**
     * Checks the status of a filing submission
     *
     * @param filingId - Filing ID to check status for
     * @returns Promise resolving to current filing status with history
     *
     * @example
     * ```typescript
     * const status = await client.getFilingStatus('filing-456');
     *
     * console.log('Status:', status.status);
     * console.log('Last updated:', status.lastUpdated);
     *
     * if (status.status === 'accepted') {
     *   console.log('Accepted on:', status.acceptedDate);
     *   console.log('Documents:', status.documents);
     * }
     *
     * // View status history
     * status.statusHistory?.forEach(update => {
     *   console.log(`${update.timestamp}: ${update.status} - ${update.message}`);
     * });
     * ```
     */
    getFilingStatus(filingId: string): Promise<FilingStatusResponse>;
    /**
     * Cancels a pending filing submission
     *
     * @param filingId - Filing ID to cancel
     * @returns Promise resolving to cancellation confirmation
     *
     * @example
     * ```typescript
     * const result = await client.cancelFiling('filing-456');
     *
     * if (result.success) {
     *   console.log('Filing cancelled successfully');
     * }
     * ```
     */
    cancelFiling(filingId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Gets estimated processing time for a filing in a specific state
     *
     * @param state - State code
     * @param expedited - Whether expedited processing is requested
     * @returns Promise resolving to estimated processing days
     *
     * @example
     * ```typescript
     * const standard = await client.getEstimatedProcessingTime('DE', false);
     * const expedited = await client.getEstimatedProcessingTime('DE', true);
     *
     * console.log(`Standard: ${standard.days} days`);
     * console.log(`Expedited: ${expedited.days} days`);
     * console.log(`Additional cost: $${expedited.additionalFee}`);
     * ```
     */
    getEstimatedProcessingTime(state: string, expedited?: boolean): Promise<{
        days: number;
        additionalFee?: number;
    }>;
    /**
     * Gets state filing requirements and fees
     *
     * @param state - State code
     * @param companyType - Type of company
     * @returns Promise resolving to filing requirements and fee breakdown
     *
     * @example
     * ```typescript
     * const requirements = await client.getFilingRequirements('DE', 'LLC');
     *
     * console.log('Required documents:', requirements.requiredDocuments);
     * console.log('State fee:', requirements.fees.stateFee);
     * console.log('Expedited fee:', requirements.fees.expeditedFee);
     * console.log('Special requirements:', requirements.specialRequirements);
     * ```
     */
    getFilingRequirements(state: string, companyType: string): Promise<{
        requiredDocuments: string[];
        fees: {
            stateFee: number;
            expeditedFee?: number;
        };
        specialRequirements?: string[];
    }>;
    /**
     * Validates filing request before submission
     *
     * @param request - Filing request to validate
     * @returns Promise resolving to validation result
     *
     * @example
     * ```typescript
     * const validation = await client.validateFilingRequest({
     *   sessionId: 'session-123',
     *   companyDetails: {...},
     *   documents: [...]
     * });
     *
     * if (!validation.valid) {
     *   console.error('Validation errors:', validation.errors);
     *   console.log('Missing documents:', validation.missingDocuments);
     * }
     * ```
     */
    validateFilingRequest(request: FilingRequest): Promise<{
        valid: boolean;
        errors?: string[];
        missingDocuments?: string[];
    }>;
    /**
     * Executes a function with exponential backoff retry logic
     *
     * @param fn - Async function to execute with retries
     * @returns Promise resolving to function result
     * @throws {Error} When max retry attempts exceeded or non-retryable error
     */
    private executeWithRetry;
    /**
     * Determines if an error is retryable
     *
     * @param error - Error to check
     * @returns True if error is retryable
     */
    private isRetryableError;
    /**
     * Handles and transforms errors into user-friendly messages
     *
     * @param error - Error to handle
     * @returns Transformed error
     */
    private handleError;
    /**
     * Updates loading state via callback
     *
     * @param isLoading - Loading state
     * @param message - Optional message
     */
    private setLoading;
    /**
     * Updates progress via callback
     *
     * @param progress - Progress percentage (0-100)
     * @param message - Optional message
     */
    private setProgress;
    /**
     * Sleeps for specified duration
     *
     * @param ms - Milliseconds to sleep
     */
    private sleep;
}
/**
 * Factory function to create a FilingClient with environment variables
 *
 * @returns Configured FilingClient instance
 * @throws {Error} If required environment variables are missing
 */
export declare function createFilingClient(): FilingClient;
//# sourceMappingURL=filingClient.d.ts.map