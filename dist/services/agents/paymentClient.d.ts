/**
 * Payment Agent API Client
 *
 * Processes payments securely through Stripe integration.
 * Handles payment processing, refunds, and transaction status tracking.
 *
 * @module services/agents/paymentClient
 */
import { PaymentRequest, PaymentResponse, CostBreakdown, ClientConfig, LoadingCallback } from './types';
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
export declare class PaymentClient {
    private readonly axiosInstance;
    private readonly retryConfig;
    private loadingCallback?;
    /**
     * Creates a new PaymentClient instance
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
    processPayment(request: PaymentRequest): Promise<PaymentResponse>;
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
    getPaymentStatus(paymentId: string): Promise<PaymentResponse>;
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
    refundPayment(paymentId: string, amount?: number, reason?: string): Promise<PaymentResponse>;
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
    calculateCost(state: string, companyType: string, expedited?: boolean): Promise<CostBreakdown>;
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
    validatePaymentMethod(paymentMethod: PaymentRequest['paymentMethod']): Promise<{
        valid: boolean;
        errors?: string[];
    }>;
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
    createPaymentIntent(amount: number, currency: string, metadata?: Record<string, string>): Promise<{
        clientSecret: string;
        paymentIntentId: string;
    }>;
    /**
     * Sanitizes payment request to remove sensitive data before transmission
     *
     * @param request - Payment request to sanitize
     * @returns Sanitized payment request
     */
    private sanitizePaymentRequest;
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
     * Sleeps for specified duration
     *
     * @param ms - Milliseconds to sleep
     */
    private sleep;
}
/**
 * Factory function to create a PaymentClient with environment variables
 *
 * @returns Configured PaymentClient instance
 * @throws {Error} If required environment variables are missing
 */
export declare function createPaymentClient(): PaymentClient;
//# sourceMappingURL=paymentClient.d.ts.map