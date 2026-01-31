/**
 * Filing Agent Client (FR-023)
 * Handles document submission to state authorities
 */
import { BaseAgentClient } from './BaseAgentClient';
import { AgentClientConfig, AgentClientOptions, FilingRequest, FilingResponse, FilingProgress, FilingFees } from './types';
export declare class FilingAgent extends BaseAgentClient {
    constructor(config: AgentClientConfig);
    /**
     * Submit filing to state authority (FR-023)
     */
    submitFiling(request: FilingRequest, options?: AgentClientOptions): Promise<FilingResponse>;
    /**
     * Get filing status and progress
     */
    getFilingStatus(filingId: string, options?: AgentClientOptions): Promise<FilingResponse>;
    /**
     * Get detailed filing progress with updates
     */
    getFilingProgress(filingId: string, options?: AgentClientOptions): Promise<FilingProgress>;
    /**
     * Calculate filing fees before submission
     */
    calculateFees(state: string, companyType: 'LLC' | 'C-Corp' | 'S-Corp', expedited?: boolean, options?: AgentClientOptions): Promise<FilingFees>;
    /**
     * Get estimated completion time for filing
     */
    getEstimatedCompletionTime(state: string, expedited?: boolean, options?: AgentClientOptions): Promise<{
        estimatedDays: number;
        estimatedDate: string;
    }>;
    /**
     * Validate filing data before submission
     */
    validateFilingData(request: FilingRequest, options?: AgentClientOptions): Promise<{
        valid: boolean;
        errors?: string[];
        warnings?: string[];
    }>;
    /**
     * Get all filings for a session
     */
    getSessionFilings(sessionId: string, options?: AgentClientOptions): Promise<FilingResponse[]>;
    /**
     * Download filed document (stamped/certified copy)
     */
    downloadFiledDocument(filingId: string, documentType: string, options?: AgentClientOptions): Promise<Buffer>;
    /**
     * Get tracking information for physical mail delivery (if applicable)
     */
    getTrackingInfo(filingId: string, options?: AgentClientOptions): Promise<{
        trackingNumber?: string;
        carrier?: string;
        status?: string;
        estimatedDelivery?: string;
    }>;
    /**
     * Request certified copies of filed documents
     */
    requestCertifiedCopies(filingId: string, quantity: number, deliveryAddress: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
    }, options?: AgentClientOptions): Promise<{
        requestId: string;
        cost: number;
        estimatedDelivery: string;
    }>;
    /**
     * Request good standing certificate
     */
    requestGoodStandingCertificate(filingId: string, options?: AgentClientOptions): Promise<{
        requestId: string;
        cost: number;
        estimatedCompletion: string;
    }>;
    /**
     * Cancel filing (only if still in pending status)
     */
    cancelFiling(filingId: string, reason?: string, options?: AgentClientOptions): Promise<void>;
    /**
     * Retry failed filing
     */
    retryFiling(filingId: string, options?: AgentClientOptions): Promise<FilingResponse>;
    /**
     * Get state-specific filing requirements
     */
    getStateRequirements(state: string, companyType: 'LLC' | 'C-Corp' | 'S-Corp', options?: AgentClientOptions): Promise<{
        requiredDocuments: string[];
        requiredFields: string[];
        specialRequirements?: string[];
        processingTime: string;
    }>;
    /**
     * Check if filing is complete and approved
     */
    isFilingComplete(filingId: string, options?: AgentClientOptions): Promise<boolean>;
    /**
     * Poll filing status until complete or failed
     */
    waitForCompletion(filingId: string, options?: {
        maxWaitTimeMs?: number;
        pollIntervalMs?: number;
        onProgress?: (progress: FilingProgress) => void;
    }): Promise<FilingResponse>;
}
//# sourceMappingURL=FilingAgent.d.ts.map