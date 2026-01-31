/**
 * API client for communicating with backend agents
 */
import { NameCheckResult, Company, FilingResult } from '../types';
export declare class ApiClient {
    private client;
    private readonly baseURL;
    private readonly timeout;
    constructor();
    /**
     * Setup request/response interceptors
     */
    private setupInterceptors;
    /**
     * Check if error is retryable
     */
    private isRetryableError;
    /**
     * Check company name availability
     */
    checkNameAvailability(name: string, state: string): Promise<NameCheckResult>;
    /**
     * Generate incorporation documents
     */
    generateDocuments(company: Company): Promise<{
        documentUrl: string;
        documentId: string;
    }>;
    /**
     * Process payment
     */
    processPayment(sessionId: string, paymentToken: string): Promise<{
        transactionId: string;
        success: boolean;
    }>;
    /**
     * Submit filing to state
     */
    submitFiling(company: Company, documentId: string): Promise<FilingResult>;
    /**
     * Get filing status
     */
    getFilingStatus(filingNumber: string): Promise<FilingResult>;
    /**
     * Send session data to backend
     */
    syncSession(sessionId: string, sessionData: any): Promise<boolean>;
    /**
     * Check API health
     */
    checkHealth(): Promise<boolean>;
}
//# sourceMappingURL=apiClient.d.ts.map