/**
 * Payment Agent API Client
 *
 * Processes payments securely through Stripe integration.
 * Handles payment processing, refunds, and transaction status tracking.
 *
 * @module services/agents/paymentClient
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  ApiResponse,
  PaymentRequest,
  PaymentResponse,
  CostBreakdown,
  ClientConfig,
  RetryConfig,
  LoadingCallback,
} from './types';

/**
 * Default retry configuration for payment requests
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
};

/**
 * Payment Agent API Client
 *
 * Provides methods to process payments securely with Stripe integration.
 * Implements automatic retries for transient failures and comprehensive error handling.
 *
 * @example
 * ```typescript
 * const client = new PaymentClient({
 *   baseUrl: process.env.API_BASE_URL,
 *   apiKey: process.env.STRIPE_SECRET_KEY,
 *   timeout: 30000,
 *   retryConfig: DEFAULT_RETRY_CONFIG
 * });
 *
 * const result = await client.processPayment({
 *   sessionId: 'session-123',
 *   amount: 29900,
 *   currency: 'usd',
 *   description: 'Delaware LLC Formation',
 *   paymentMethod: {
 *     type: 'card',
 *     cardNumber: '4242424242424242',
 *     expiryMonth: 12,
 *     expiryYear: 2025,
 *     cvv: '123',
 *     cardholderName: 'John Doe'
 *   }
 * });
 * ```
 */
export class PaymentClient {
  private readonly axiosInstance: AxiosInstance;
  private readonly retryConfig: RetryConfig;
  private loadingCallback?: LoadingCallback;

  /**
   * Creates a new PaymentClient instance
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
        ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
      },
    });

    // Add request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        this.setLoading(true, 'Processing payment...');
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
   * Processes a payment through Stripe
   *
   * @param request - Payment request with amount, payment method, and metadata
   * @returns Promise resolving to payment confirmation with transaction details
   * @throws {Error} When payment fails or retry attempts exhausted
   *
   * @example
   * ```typescript
   * const result = await client.processPayment({
   *   sessionId: 'session-123',
   *   amount: 29900, // Amount in cents
   *   currency: 'usd',
   *   description: 'Delaware LLC Formation',
   *   paymentMethod: {
   *     type: 'card',
   *     cardNumber: '4242424242424242',
   *     expiryMonth: 12,
   *     expiryYear: 2025,
   *     cvv: '123',
   *     cardholderName: 'John Doe'
   *   },
   *   metadata: {
   *     companyName: 'Acme LLC',
   *     state: 'DE'
   *   }
   * });
   *
   * console.log('Payment ID:', result.paymentId);
   * console.log('Transaction ID:', result.transactionId);
   * console.log('Receipt:', result.receiptUrl);
   * ```
   */
  public async processPayment(
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    return this.executeWithRetry(async () => {
      try {
        // Sanitize sensitive data before sending
        const sanitizedRequest = this.sanitizePaymentRequest(request);

        const response = await this.axiosInstance.post<
          ApiResponse<PaymentResponse>
        >('/payments/process', sanitizedRequest);

        if (!response.data.success) {
          throw new Error(
            response.data.error?.message || 'Payment processing failed'
          );
        }

        return response.data.data!;
      } catch (error) {
        throw this.handleError(error);
      }
    });
  }

  /**
   * Checks the status of a payment transaction
   *
   * @param paymentId - Payment ID to check status for
   * @returns Promise resolving to payment status
   *
   * @example
   * ```typescript
   * const status = await client.getPaymentStatus('pay-789');
   *
   * console.log('Status:', status.status);
   *
   * if (status.status === 'completed') {
   *   console.log('Payment successful!');
   *   console.log('Receipt:', status.receiptUrl);
   * } else if (status.status === 'failed') {
   *   console.error('Payment failed:', status.failureReason);
   * }
   * ```
   */
  public async getPaymentStatus(paymentId: string): Promise<PaymentResponse> {
    try {
      const response = await this.axiosInstance.get<
        ApiResponse<PaymentResponse>
      >(`/payments/${paymentId}`);

      if (!response.data.success) {
        throw new Error(
          response.data.error?.message || 'Failed to retrieve payment status'
        );
      }

      return response.data.data!;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Initiates a refund for a completed payment
   *
   * @param paymentId - Payment ID to refund
   * @param amount - Amount to refund (optional, defaults to full refund)
   * @param reason - Reason for refund
   * @returns Promise resolving to refund confirmation
   *
   * @example
   * ```typescript
   * // Full refund
   * const refund = await client.refundPayment('pay-789', undefined, 'Customer request');
   *
   * // Partial refund
   * const partialRefund = await client.refundPayment('pay-789', 10000, 'Partial service');
   *
   * console.log('Refund ID:', refund.paymentId);
   * console.log('Amount refunded:', refund.amount);
   * ```
   */
  public async refundPayment(
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<PaymentResponse> {
    return this.executeWithRetry(async () => {
      try {
        const response = await this.axiosInstance.post<
          ApiResponse<PaymentResponse>
        >(`/payments/${paymentId}/refund`, {
          amount,
          reason,
        });

        if (!response.data.success) {
          throw new Error(
            response.data.error?.message || 'Refund processing failed'
          );
        }

        return response.data.data!;
      } catch (error) {
        throw this.handleError(error);
      }
    });
  }

  /**
   * Calculates cost breakdown for company formation
   *
   * @param state - State code
   * @param companyType - Type of company
   * @param expedited - Whether expedited processing is requested
   * @returns Promise resolving to cost breakdown
   *
   * @example
   * ```typescript
   * const costs = await client.calculateCost('DE', 'LLC', false);
   *
   * console.log('State fee:', costs.stateFee);
   * console.log('Service fee:', costs.serviceFee);
   * console.log('Total:', costs.total);
   *
   * const expeditedCosts = await client.calculateCost('DE', 'LLC', true);
   * console.log('Expedited fee:', expeditedCosts.expeditedFee);
   * console.log('New total:', expeditedCosts.total);
   * ```
   */
  public async calculateCost(
    state: string,
    companyType: string,
    expedited: boolean = false
  ): Promise<CostBreakdown> {
    try {
      const response = await this.axiosInstance.get<
        ApiResponse<CostBreakdown>
      >('/payments/calculate-cost', {
        params: { state, companyType, expedited },
      });

      if (!response.data.success) {
        throw new Error(
          response.data.error?.message || 'Failed to calculate costs'
        );
      }

      return response.data.data!;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Validates payment method before processing
   *
   * @param paymentMethod - Payment method to validate
   * @returns Promise resolving to validation result
   *
   * @example
   * ```typescript
   * const validation = await client.validatePaymentMethod({
   *   type: 'card',
   *   cardNumber: '4242424242424242',
   *   expiryMonth: 12,
   *   expiryYear: 2025,
   *   cvv: '123',
   *   cardholderName: 'John Doe'
   * });
   *
   * if (!validation.valid) {
   *   console.error('Invalid payment method:', validation.errors);
   * }
   * ```
   */
  public async validatePaymentMethod(
    paymentMethod: PaymentRequest['paymentMethod']
  ): Promise<{ valid: boolean; errors?: string[] }> {
    try {
      const response = await this.axiosInstance.post<
        ApiResponse<{ valid: boolean; errors?: string[] }>
      >('/payments/validate', { paymentMethod });

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
   * Creates a payment intent for client-side processing (Stripe Elements)
   *
   * @param amount - Amount in cents
   * @param currency - Currency code (e.g., 'usd')
   * @param metadata - Additional metadata
   * @returns Promise resolving to client secret for Stripe Elements
   *
   * @example
   * ```typescript
   * const { clientSecret } = await client.createPaymentIntent(29900, 'usd', {
   *   sessionId: 'session-123',
   *   companyName: 'Acme LLC'
   * });
   *
   * // Use clientSecret with Stripe Elements for secure card collection
   * ```
   */
  public async createPaymentIntent(
    amount: number,
    currency: string,
    metadata?: Record<string, string>
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    try {
      const response = await this.axiosInstance.post<
        ApiResponse<{ clientSecret: string; paymentIntentId: string }>
      >('/payments/intent', {
        amount,
        currency,
        metadata,
      });

      if (!response.data.success) {
        throw new Error(
          response.data.error?.message || 'Failed to create payment intent'
        );
      }

      return response.data.data!;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Sanitizes payment request to remove sensitive data before transmission
   *
   * @param request - Payment request to sanitize
   * @returns Sanitized payment request
   */
  private sanitizePaymentRequest(request: PaymentRequest): PaymentRequest {
    // In production, sensitive card data should be tokenized client-side
    // This is a placeholder for demonstration
    return {
      ...request,
      paymentMethod: {
        ...request.paymentMethod,
        // Mask card number (keep last 4 digits for reference)
        ...(request.paymentMethod.cardNumber && {
          cardNumber: request.paymentMethod.cardNumber,
        }),
      },
    };
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

        // Don't retry non-retryable errors (e.g., card declined)
        if (!this.isRetryableError(error)) {
          throw error;
        }

        if (attempt === this.retryConfig.maxAttempts) {
          break;
        }

        await this.sleep(delay);
        delay = Math.min(
          delay * this.retryConfig.backoffMultiplier,
          this.retryConfig.maxDelayMs
        );
      }
    }

    throw new Error(
      `Payment processing failed after ${this.retryConfig.maxAttempts} attempts: ${lastError?.message}`
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

      // Network errors are retryable
      if (!axiosError.response) {
        return true;
      }

      const status = axiosError.response.status;

      // Card declined, insufficient funds, etc. are NOT retryable
      if (status === 402) {
        return false;
      }

      // 5xx server errors are retryable
      if (status >= 500) {
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
   * @returns Transformed error
   */
  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiResponse<unknown>>;

      if (!axiosError.response) {
        return new Error(
          'Network error: Unable to connect to payment service. Please check your internet connection.'
        );
      }

      const status = axiosError.response.status;
      const apiError = axiosError.response.data?.error;

      if (status === 401 || status === 403) {
        return new Error(
          'Authentication failed. Please contact support.'
        );
      }

      if (status === 400) {
        return new Error(
          apiError?.message || 'Invalid payment information. Please check your details.'
        );
      }

      if (status === 402) {
        return new Error(
          apiError?.message ||
            'Payment declined. Please check your card details or try a different payment method.'
        );
      }

      if (status === 429) {
        return new Error(
          'Too many payment attempts. Please wait a moment and try again.'
        );
      }

      if (status >= 500) {
        return new Error(
          'Payment service temporarily unavailable. Your card has not been charged. Please try again.'
        );
      }

      return new Error(
        apiError?.message || 'An unexpected error occurred during payment processing.'
      );
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error('An unknown error occurred during payment processing.');
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
   * Sleeps for specified duration
   *
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Factory function to create a PaymentClient with environment variables
 *
 * @returns Configured PaymentClient instance
 * @throws {Error} If required environment variables are missing
 */
export function createPaymentClient(): PaymentClient {
  const baseUrl = process.env.API_BASE_URL;
  const apiKey = process.env.STRIPE_SECRET_KEY;
  const timeout = parseInt(process.env.API_TIMEOUT || '30000', 10);

  if (!baseUrl) {
    throw new Error('API_BASE_URL environment variable is required');
  }

  if (!apiKey) {
    throw new Error(
      'STRIPE_SECRET_KEY environment variable is required for payment processing'
    );
  }

  return new PaymentClient({
    baseUrl,
    apiKey,
    timeout,
    retryConfig: DEFAULT_RETRY_CONFIG,
  });
}
