"use strict";
/**
 * Filing Agent API Client
 *
 * Submits incorporation documents to state authorities and tracks filing status.
 * Handles expedited filing options and provides real-time status updates.
 *
 * @module services/agents/filingClient
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilingClient = void 0;
exports.createFilingClient = createFilingClient;
const axios_1 = __importDefault(require("axios"));
/**
 * Default retry configuration for filing requests
 */
const DEFAULT_RETRY_CONFIG = {
    maxAttempts: 3,
    initialDelayMs: 2000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
};
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
class FilingClient {
    /**
     * Creates a new FilingClient instance
     *
     * @param config - Client configuration including base URL, API key, and retry settings
     */
    constructor(config) {
        this.retryConfig = config.retryConfig || DEFAULT_RETRY_CONFIG;
        this.axiosInstance = axios_1.default.create({
            baseURL: config.baseUrl,
            timeout: config.timeout,
            headers: {
                'Content-Type': 'application/json',
                ...(config.apiKey && { 'X-API-Key': config.apiKey }),
            },
        });
        // Add request interceptor
        this.axiosInstance.interceptors.request.use((config) => {
            this.setLoading(true, 'Submitting documents to state...');
            return config;
        }, (error) => {
            this.setLoading(false);
            return Promise.reject(error);
        });
        // Add response interceptor
        this.axiosInstance.interceptors.response.use((response) => {
            this.setLoading(false);
            return response;
        }, (error) => {
            this.setLoading(false);
            return Promise.reject(error);
        });
    }
    /**
     * Sets a callback function for loading state updates
     *
     * @param callback - Function to call when loading state changes
     */
    setLoadingCallback(callback) {
        this.loadingCallback = callback;
    }
    /**
     * Sets a callback function for progress updates
     *
     * @param callback - Function to call with progress updates
     */
    setProgressCallback(callback) {
        this.progressCallback = callback;
    }
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
    async submitFiling(request) {
        return this.executeWithRetry(async () => {
            try {
                this.setProgress(10, 'Validating documents...');
                const response = await this.axiosInstance.post('/submit', request);
                if (!response.data.success) {
                    throw new Error(response.data.error?.message || 'Filing submission failed');
                }
                this.setProgress(100, 'Filing submitted successfully');
                return response.data.data;
            }
            catch (error) {
                throw this.handleError(error);
            }
        });
    }
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
    async getFilingStatus(filingId) {
        try {
            const response = await this.axiosInstance.get(`/status/${filingId}`);
            if (!response.data.success) {
                throw new Error(response.data.error?.message || 'Failed to retrieve filing status');
            }
            return response.data.data;
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
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
    async cancelFiling(filingId) {
        return this.executeWithRetry(async () => {
            try {
                const response = await this.axiosInstance.post(`/cancel/${filingId}`);
                if (!response.data.success) {
                    throw new Error(response.data.error?.message || 'Failed to cancel filing');
                }
                return response.data.data;
            }
            catch (error) {
                throw this.handleError(error);
            }
        });
    }
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
    async getEstimatedProcessingTime(state, expedited = false) {
        try {
            const response = await this.axiosInstance.get('/processing-time', {
                params: { state, expedited },
            });
            if (!response.data.success) {
                throw new Error(response.data.error?.message ||
                    'Failed to retrieve processing time estimate');
            }
            return response.data.data;
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
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
    async getFilingRequirements(state, companyType) {
        try {
            const response = await this.axiosInstance.get('/requirements', {
                params: { state, companyType },
            });
            if (!response.data.success) {
                throw new Error(response.data.error?.message || 'Failed to retrieve filing requirements');
            }
            return response.data.data;
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
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
    async validateFilingRequest(request) {
        try {
            const response = await this.axiosInstance.post('/validate', request);
            if (!response.data.success) {
                throw new Error(response.data.error?.message || 'Validation request failed');
            }
            return response.data.data || { valid: false, errors: ['Unknown error'] };
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    /**
     * Executes a function with exponential backoff retry logic
     *
     * @param fn - Async function to execute with retries
     * @returns Promise resolving to function result
     * @throws {Error} When max retry attempts exceeded or non-retryable error
     */
    async executeWithRetry(fn) {
        let lastError;
        let delay = this.retryConfig.initialDelayMs;
        for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
            try {
                return await fn();
            }
            catch (error) {
                lastError = error;
                if (!this.isRetryableError(error)) {
                    throw error;
                }
                if (attempt === this.retryConfig.maxAttempts) {
                    break;
                }
                this.setProgress(0, `Retrying (${attempt}/${this.retryConfig.maxAttempts})...`);
                await this.sleep(delay);
                delay = Math.min(delay * this.retryConfig.backoffMultiplier, this.retryConfig.maxDelayMs);
            }
        }
        throw new Error(`Filing submission failed after ${this.retryConfig.maxAttempts} attempts: ${lastError?.message}`);
    }
    /**
     * Determines if an error is retryable
     *
     * @param error - Error to check
     * @returns True if error is retryable
     */
    isRetryableError(error) {
        if (axios_1.default.isAxiosError(error)) {
            const axiosError = error;
            if (!axiosError.response) {
                return true;
            }
            const status = axiosError.response.status;
            return status >= 500 || status === 429 || status === 408;
        }
        return false;
    }
    /**
     * Handles and transforms errors into user-friendly messages
     *
     * @param error - Error to handle
     * @returns Transformed error
     */
    handleError(error) {
        if (axios_1.default.isAxiosError(error)) {
            const axiosError = error;
            if (!axiosError.response) {
                return new Error('Network error: Unable to connect to filing service.');
            }
            const status = axiosError.response.status;
            const apiError = axiosError.response.data?.error;
            if (status === 401 || status === 403) {
                return new Error('Authentication failed. Please check your API credentials.');
            }
            if (status === 400) {
                return new Error(apiError?.message ||
                    'Invalid filing request. Please check your documents and information.');
            }
            if (status === 422) {
                return new Error(apiError?.message ||
                    'Filing rejected by state authority. Please review requirements.');
            }
            if (status >= 500) {
                return new Error('Filing service temporarily unavailable. Your documents are safe. Please try again.');
            }
            return new Error(apiError?.message || 'An unexpected error occurred during filing submission.');
        }
        if (error instanceof Error) {
            return error;
        }
        return new Error('An unknown error occurred during filing submission.');
    }
    /**
     * Updates loading state via callback
     *
     * @param isLoading - Loading state
     * @param message - Optional message
     */
    setLoading(isLoading, message) {
        if (this.loadingCallback) {
            this.loadingCallback(isLoading, message);
        }
    }
    /**
     * Updates progress via callback
     *
     * @param progress - Progress percentage (0-100)
     * @param message - Optional message
     */
    setProgress(progress, message) {
        if (this.progressCallback) {
            this.progressCallback(progress, message);
        }
    }
    /**
     * Sleeps for specified duration
     *
     * @param ms - Milliseconds to sleep
     */
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
exports.FilingClient = FilingClient;
/**
 * Factory function to create a FilingClient with environment variables
 *
 * @returns Configured FilingClient instance
 * @throws {Error} If required environment variables are missing
 */
function createFilingClient() {
    const baseUrl = process.env.FILING_AGENT_API_URL;
    const apiKey = process.env.FILING_AGENT_API_KEY;
    const timeout = parseInt(process.env.API_TIMEOUT || '60000', 10);
    if (!baseUrl) {
        throw new Error('FILING_AGENT_API_URL environment variable is required');
    }
    return new FilingClient({
        baseUrl,
        apiKey,
        timeout,
        retryConfig: DEFAULT_RETRY_CONFIG,
    });
}
//# sourceMappingURL=filingClient.js.map