/**
 * Name Check Agent API Client
 *
 * Handles real-time company name availability checks with state databases.
 * Implements retry logic with exponential backoff for reliability.
 *
 * @module services/agents/nameCheckClient
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  ApiResponse,
  NameCheckRequest,
  NameCheckResponse,
  ClientConfig,
  RetryConfig,
  LoadingCallback,
  DELAWARE_ENTITY_TYPES,
  COMPANY_TYPE_TO_DELAWARE,
  CompanyType,
  DelawareEntityType,
} from './types';

/**
 * Default retry configuration for name check requests
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
};

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
export class NameCheckClient {
  private readonly axiosInstance: AxiosInstance;
  private readonly retryConfig: RetryConfig;
  private loadingCallback?: LoadingCallback;

  /**
   * Creates a new NameCheckClient instance
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

    // Add request interceptor for logging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        this.setLoading(true, 'Checking name availability...');
        return config;
      },
      (error) => {
        this.setLoading(false);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
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
  public async checkAvailability(
    request: NameCheckRequest
  ): Promise<NameCheckResponse> {
    return this.executeWithRetry(async () => {
      try {
        const response = await this.axiosInstance.post<NameCheckResponse>(
          '/api/v1/check',
          request
        );

        return response.data;
      } catch (error) {
        throw this.handleError(error);
      }
    });
  }

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
  public async checkNameByType(
    baseName: string,
    companyType: CompanyType
  ): Promise<NameCheckResponse> {
    const delawareType = COMPANY_TYPE_TO_DELAWARE[companyType];
    const entityInfo = DELAWARE_ENTITY_TYPES[delawareType];

    return this.checkAvailability({
      baseName,
      entityType: delawareType,
      entityEnding: entityInfo.defaultEnding,
    });
  }

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
  public async checkNameWithCode(
    baseName: string,
    entityType: DelawareEntityType,
    entityEnding?: string
  ): Promise<NameCheckResponse> {
    const ending = entityEnding || DELAWARE_ENTITY_TYPES[entityType].defaultEnding;

    return this.checkAvailability({
      baseName,
      entityType,
      entityEnding: ending,
    });
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

        // Don't retry non-retryable errors
        if (!this.isRetryableError(error)) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === this.retryConfig.maxAttempts) {
          break;
        }

        // Wait before retry with exponential backoff
        await this.sleep(delay);
        delay = Math.min(
          delay * this.retryConfig.backoffMultiplier,
          this.retryConfig.maxDelayMs
        );
      }
    }

    throw new Error(
      `Name check failed after ${this.retryConfig.maxAttempts} attempts: ${lastError?.message}`
    );
  }

  /**
   * Determines if an error is retryable based on error type and status code
   *
   * @param error - Error to check
   * @returns True if error is retryable, false otherwise
   */
  private isRetryableError(error: unknown): boolean {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      // Network errors are retryable
      if (!axiosError.response) {
        return true;
      }

      // 5xx server errors are retryable
      const status = axiosError.response.status;
      if (status >= 500 && status < 600) {
        return true;
      }

      // 429 (too many requests) is retryable
      if (status === 429) {
        return true;
      }

      // 408 (request timeout) is retryable
      if (status === 408) {
        return true;
      }
    }

    return false;
  }

  /**
   * Handles and transforms errors into user-friendly messages
   *
   * @param error - Error to handle
   * @returns Transformed error with user-friendly message
   */
  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiResponse<unknown>>;

      if (!axiosError.response) {
        return new Error(
          'Network error: Unable to connect to name check service. Please check your internet connection.'
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
          apiError?.message || 'Invalid request. Please check your input.'
        );
      }

      if (status >= 500) {
        return new Error(
          'Service temporarily unavailable. Please try again in a few moments.'
        );
      }

      return new Error(
        apiError?.message || 'An unexpected error occurred during name check.'
      );
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error('An unknown error occurred during name check.');
  }

  /**
   * Updates loading state via callback if set
   *
   * @param isLoading - Loading state
   * @param message - Optional loading message
   */
  private setLoading(isLoading: boolean, message?: string): void {
    if (this.loadingCallback) {
      this.loadingCallback(isLoading, message);
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
export function createNameCheckClient(): NameCheckClient {
  const isProduction = process.env.NODE_ENV === 'production';

  // Select API URL based on environment
  const baseUrl = isProduction
    ? process.env.NAME_CHECK_API_URL_SERVER
    : process.env.NAME_CHECK_API_URL;

  const apiKey = process.env.NAME_CHECK_API_KEY;
  const timeout = parseInt(process.env.NAME_CHECK_TIMEOUT || '30000', 10);

  if (!baseUrl) {
    const requiredVar = isProduction ? 'NAME_CHECK_API_URL_SERVER' : 'NAME_CHECK_API_URL';
    throw new Error(
      `${requiredVar} environment variable is required for ${isProduction ? 'production' : 'development'}`
    );
  }

  return new NameCheckClient({
    baseUrl,
    apiKey,
    timeout,
    retryConfig: DEFAULT_RETRY_CONFIG,
  });
}
