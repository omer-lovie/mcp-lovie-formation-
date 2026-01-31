/**
 * Document Filler Agent API Client
 *
 * Generates incorporation documents (PDFs) based on company formation details.
 * Supports multiple document types and provides download URLs for generated files.
 *
 * @module services/agents/documentFillerClient
 */
import { DocumentFillerRequest, DocumentFillerResponse, ClientConfig, LoadingCallback, ProgressCallback } from './types';
/**
 * Document Filler Agent API Client
 *
 * Provides methods to generate legal documents for company formation.
 * Supports progress tracking and automatic retries for reliable document generation.
 *
 * @example
 * ```typescript
 * const client = new DocumentFillerClient({
 *   baseUrl: process.env.DOCUMENT_FILLER_API_URL,
 *   apiKey: process.env.DOCUMENT_FILLER_API_KEY,
 *   timeout: 60000,
 *   retryConfig: DEFAULT_RETRY_CONFIG
 * });
 *
 * const result = await client.generateDocuments({
 *   sessionId: 'session-123',
 *   companyDetails: {...},
 *   documentTypes: ['certificate', 'articles', 'bylaws']
 * });
 * ```
 */
export declare class DocumentFillerClient {
    private readonly axiosInstance;
    private readonly retryConfig;
    private loadingCallback?;
    private progressCallback?;
    /**
     * Creates a new DocumentFillerClient instance
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
     * Generates incorporation documents based on company details
     *
     * @param request - Document generation request with company details and document types
     * @returns Promise resolving to generated documents with download URLs
     * @throws {Error} When document generation fails or retry attempts exhausted
     *
     * @example
     * ```typescript
     * const result = await client.generateDocuments({
     *   sessionId: 'session-123',
     *   companyDetails: {
     *     name: 'Acme LLC',
     *     state: 'DE',
     *     type: 'LLC',
     *     shareholders: [...],
     *     registeredAgent: {...}
     *   },
     *   documentTypes: ['articles', 'operating-agreement']
     * });
     *
     * result.documents.forEach(doc => {
     *   console.log(`Download: ${doc.fileName} from ${doc.downloadUrl}`);
     * });
     * ```
     */
    generateDocuments(request: DocumentFillerRequest): Promise<DocumentFillerResponse>;
    /**
     * Checks the status of a document generation job
     *
     * @param sessionId - Session ID for the document generation job
     * @returns Promise resolving to current status and generated documents
     *
     * @example
     * ```typescript
     * const status = await client.getDocumentStatus('session-123');
     *
     * if (status.status === 'completed') {
     *   console.log('Documents ready:', status.documents);
     * } else if (status.status === 'processing') {
     *   console.log('Still generating...');
     * }
     * ```
     */
    getDocumentStatus(sessionId: string): Promise<DocumentFillerResponse>;
    /**
     * Downloads a specific generated document
     *
     * @param documentId - Document ID to download
     * @returns Promise resolving to document content as buffer
     *
     * @example
     * ```typescript
     * const buffer = await client.downloadDocument('doc-456');
     * fs.writeFileSync('articles.pdf', buffer);
     * ```
     */
    downloadDocument(documentId: string): Promise<Buffer>;
    /**
     * Lists available document types for a given state and company type
     *
     * @param state - State code
     * @param companyType - Type of company
     * @returns Promise resolving to array of available document types
     *
     * @example
     * ```typescript
     * const types = await client.getAvailableDocumentTypes('DE', 'LLC');
     * console.log('Available documents:', types);
     * // ['articles-of-organization', 'operating-agreement', 'ein-application']
     * ```
     */
    getAvailableDocumentTypes(state: string, companyType: string): Promise<string[]>;
    /**
     * Validates company details before document generation
     *
     * @param request - Document generation request to validate
     * @returns Promise resolving to validation result
     *
     * @example
     * ```typescript
     * const validation = await client.validateRequest({
     *   sessionId: 'session-123',
     *   companyDetails: {...},
     *   documentTypes: ['articles']
     * });
     *
     * if (!validation.valid) {
     *   console.error('Validation errors:', validation.errors);
     * }
     * ```
     */
    validateRequest(request: DocumentFillerRequest): Promise<{
        valid: boolean;
        errors?: string[];
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
 * Factory function to create a DocumentFillerClient with environment variables
 *
 * @returns Configured DocumentFillerClient instance
 * @throws {Error} If required environment variables are missing
 */
export declare function createDocumentFillerClient(): DocumentFillerClient;
//# sourceMappingURL=documentFillerClient.d.ts.map