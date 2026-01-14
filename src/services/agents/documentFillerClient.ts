/**
 * Document Filler Agent API Client
 *
 * Generates incorporation documents (PDFs) based on company formation details.
 * Supports multiple document types and provides download URLs for generated files.
 *
 * @module services/agents/documentFillerClient
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  ApiResponse,
  DocumentFillerRequest,
  DocumentFillerResponse,
  GeneratedDocument,
  ClientConfig,
  RetryConfig,
  LoadingCallback,
  ProgressCallback,
} from './types';

/**
 * Default retry configuration for document generation requests
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 2000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

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
export class DocumentFillerClient {
  private readonly axiosInstance: AxiosInstance;
  private readonly retryConfig: RetryConfig;
  private loadingCallback?: LoadingCallback;
  private progressCallback?: ProgressCallback;

  /**
   * Creates a new DocumentFillerClient instance
   *
   * @param config - Client configuration including base URL, API key, and retry settings
   */
  constructor(config: ClientConfig) {
    this.retryConfig = config.retryConfig || DEFAULT_RETRY_CONFIG;

    this.axiosInstance = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'X-API-Key': config.apiKey }),
      },
    });

    // Add request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        this.setLoading(true, 'Generating documents...');
        return config;
      },
      (error) => {
        this.setLoading(false);
        return Promise.reject(error);
      }
    );

    // Add response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        this.setLoading(false);
        return response;
      },
      (error) => {
        this.setLoading(false);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Sets a callback function for loading state updates
   *
   * @param callback - Function to call when loading state changes
   */
  public setLoadingCallback(callback: LoadingCallback): void {
    this.loadingCallback = callback;
  }

  /**
   * Sets a callback function for progress updates
   *
   * @param callback - Function to call with progress updates
   */
  public setProgressCallback(callback: ProgressCallback): void {
    this.progressCallback = callback;
  }

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
  public async generateDocuments(
    request: DocumentFillerRequest
  ): Promise<DocumentFillerResponse> {
    return this.executeWithRetry(async () => {
      try {
        this.setProgress(10, 'Validating company information...');

        const response = await this.axiosInstance.post<
          ApiResponse<DocumentFillerResponse>
        >('/generate', request);

        if (!response.data.success) {
          throw new Error(
            response.data.error?.message || 'Document generation failed'
          );
        }

        this.setProgress(100, 'Documents generated successfully');

        return response.data.data!;
      } catch (error) {
        throw this.handleError(error);
      }
    });
  }

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
  public async getDocumentStatus(
    sessionId: string
  ): Promise<DocumentFillerResponse> {
    try {
      const response = await this.axiosInstance.get<
        ApiResponse<DocumentFillerResponse>
      >(`/status/${sessionId}`);

      if (!response.data.success) {
        throw new Error(
          response.data.error?.message || 'Failed to retrieve document status'
        );
      }

      return response.data.data!;
    } catch (error) {
      throw this.handleError(error);
    }
  }

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
  public async downloadDocument(documentId: string): Promise<Buffer> {
    return this.executeWithRetry(async () => {
      try {
        this.setLoading(true, 'Downloading document...');

        const response = await this.axiosInstance.get<ArrayBuffer>(
          `/download/${documentId}`,
          {
            responseType: 'arraybuffer',
          }
        );

        return Buffer.from(response.data);
      } catch (error) {
        throw this.handleError(error);
      } finally {
        this.setLoading(false);
      }
    });
  }

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
  public async getAvailableDocumentTypes(
    state: string,
    companyType: string
  ): Promise<string[]> {
    try {
      const response = await this.axiosInstance.get<
        ApiResponse<{ documentTypes: string[] }>
      >('/document-types', {
        params: { state, companyType },
      });

      if (!response.data.success) {
        throw new Error(
          response.data.error?.message || 'Failed to retrieve document types'
        );
      }

      return response.data.data?.documentTypes || [];
    } catch (error) {
      throw this.handleError(error);
    }
  }

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
  public async validateRequest(
    request: DocumentFillerRequest
  ): Promise<{ valid: boolean; errors?: string[] }> {
    try {
      const response = await this.axiosInstance.post<
        ApiResponse<{ valid: boolean; errors?: string[] }>
      >('/validate', request);

      if (!response.data.success) {
        throw new Error(
          response.data.error?.message || 'Validation request failed'
        );
      }

      return response.data.data || { valid: false, errors: ['Unknown error'] };
    } catch (error) {
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
  private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    let delay = this.retryConfig.initialDelayMs;

    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (!this.isRetryableError(error)) {
          throw error;
        }

        if (attempt === this.retryConfig.maxAttempts) {
          break;
        }

        this.setProgress(
          0,
          `Retrying (${attempt}/${this.retryConfig.maxAttempts})...`
        );

        await this.sleep(delay);
        delay = Math.min(
          delay * this.retryConfig.backoffMultiplier,
          this.retryConfig.maxDelayMs
        );
      }
    }

    throw new Error(
      `Document generation failed after ${this.retryConfig.maxAttempts} attempts: ${lastError?.message}`
    );
  }

  /**
   * Determines if an error is retryable
   *
   * @param error - Error to check
   * @returns True if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

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
  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiResponse<unknown>>;

      if (!axiosError.response) {
        return new Error(
          'Network error: Unable to connect to document generation service.'
        );
      }

      const status = axiosError.response.status;
      const apiError = axiosError.response.data?.error;

      if (status === 401 || status === 403) {
        return new Error(
          'Authentication failed. Please check your API credentials.'
        );
      }

      if (status === 400) {
        return new Error(
          apiError?.message ||
            'Invalid company details. Please check your information.'
        );
      }

      if (status >= 500) {
        return new Error(
          'Document generation service temporarily unavailable. Please try again.'
        );
      }

      return new Error(
        apiError?.message ||
          'An unexpected error occurred during document generation.'
      );
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error('An unknown error occurred during document generation.');
  }

  /**
   * Updates loading state via callback
   *
   * @param isLoading - Loading state
   * @param message - Optional message
   */
  private setLoading(isLoading: boolean, message?: string): void {
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
  private setProgress(progress: number, message?: string): void {
    if (this.progressCallback) {
      this.progressCallback(progress, message);
    }
  }

  /**
   * Sleeps for specified duration
   *
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Factory function to create a DocumentFillerClient with environment variables
 *
 * @returns Configured DocumentFillerClient instance
 * @throws {Error} If required environment variables are missing
 */
export function createDocumentFillerClient(): DocumentFillerClient {
  const baseUrl = process.env.DOCUMENT_FILLER_API_URL;
  const apiKey = process.env.DOCUMENT_FILLER_API_KEY;
  const timeout = parseInt(process.env.API_TIMEOUT || '60000', 10);

  if (!baseUrl) {
    throw new Error(
      'DOCUMENT_FILLER_API_URL environment variable is required'
    );
  }

  return new DocumentFillerClient({
    baseUrl,
    apiKey,
    timeout,
    retryConfig: DEFAULT_RETRY_CONFIG,
  });
}
