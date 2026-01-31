"use strict";
/**
 * Filing Agent Client (FR-023)
 * Handles document submission to state authorities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilingAgent = void 0;
const BaseAgentClient_1 = require("./BaseAgentClient");
const types_1 = require("./types");
class FilingAgent extends BaseAgentClient_1.BaseAgentClient {
    constructor(config) {
        super('FilingAgent', config);
    }
    /**
     * Submit filing to state authority (FR-023)
     */
    async submitFiling(request, options) {
        // Filing submission can take time, use longer timeout
        const filingOptions = {
            ...options,
            timeout: options?.timeout || 60000, // 60s timeout
            idempotencyKey: options?.idempotencyKey || `filing-${request.sessionId}-${Date.now()}`,
        };
        return this.post('/api/v1/filings/submit', request, filingOptions);
    }
    /**
     * Get filing status and progress
     */
    async getFilingStatus(filingId, options) {
        return this.get(`/api/v1/filings/${filingId}`, options);
    }
    /**
     * Get detailed filing progress with updates
     */
    async getFilingProgress(filingId, options) {
        return this.get(`/api/v1/filings/${filingId}/progress`, options);
    }
    /**
     * Calculate filing fees before submission
     */
    async calculateFees(state, companyType, expedited = false, options) {
        return this.post('/api/v1/filings/calculate-fees', {
            state,
            companyType,
            expedited,
        }, {
            ...options,
            skipRetry: true, // Fee calculation should be fast, no retry needed
        });
    }
    /**
     * Get estimated completion time for filing
     */
    async getEstimatedCompletionTime(state, expedited = false, options) {
        return this.get(`/api/v1/filings/estimated-time?state=${state}&expedited=${expedited}`, options);
    }
    /**
     * Validate filing data before submission
     */
    async validateFilingData(request, options) {
        return this.post('/api/v1/filings/validate', request, {
            ...options,
            skipRetry: true, // No retry for validation
        });
    }
    /**
     * Get all filings for a session
     */
    async getSessionFilings(sessionId, options) {
        return this.get(`/api/v1/filings/session/${sessionId}`, options);
    }
    /**
     * Download filed document (stamped/certified copy)
     */
    async downloadFiledDocument(filingId, documentType, options) {
        const response = await this.client.get(`/api/v1/filings/${filingId}/documents/${documentType}`, {
            responseType: 'arraybuffer',
            signal: options?.signal,
            timeout: options?.timeout,
        });
        return Buffer.from(response.data);
    }
    /**
     * Get tracking information for physical mail delivery (if applicable)
     */
    async getTrackingInfo(filingId, options) {
        return this.get(`/api/v1/filings/${filingId}/tracking`, options);
    }
    /**
     * Request certified copies of filed documents
     */
    async requestCertifiedCopies(filingId, quantity, deliveryAddress, options) {
        return this.post(`/api/v1/filings/${filingId}/certified-copies`, {
            quantity,
            deliveryAddress,
        }, options);
    }
    /**
     * Request good standing certificate
     */
    async requestGoodStandingCertificate(filingId, options) {
        return this.post(`/api/v1/filings/${filingId}/good-standing`, {}, options);
    }
    /**
     * Cancel filing (only if still in pending status)
     */
    async cancelFiling(filingId, reason, options) {
        await this.post(`/api/v1/filings/${filingId}/cancel`, { reason }, options);
    }
    /**
     * Retry failed filing
     */
    async retryFiling(filingId, options) {
        return this.post(`/api/v1/filings/${filingId}/retry`, {}, options);
    }
    /**
     * Get state-specific filing requirements
     */
    async getStateRequirements(state, companyType, options) {
        return this.get(`/api/v1/filings/requirements?state=${state}&type=${companyType}`, options);
    }
    /**
     * Check if filing is complete and approved
     */
    async isFilingComplete(filingId, options) {
        const status = await this.getFilingStatus(filingId, options);
        return (status.status === types_1.FilingStatus.COMPLETED ||
            status.status === types_1.FilingStatus.APPROVED);
    }
    /**
     * Poll filing status until complete or failed
     */
    async waitForCompletion(filingId, options) {
        const maxWaitTime = options?.maxWaitTimeMs || 5 * 60 * 1000; // 5 minutes
        const pollInterval = options?.pollIntervalMs || 5000; // 5 seconds
        const startTime = Date.now();
        while (Date.now() - startTime < maxWaitTime) {
            const status = await this.getFilingStatus(filingId);
            // Terminal states
            if (status.status === types_1.FilingStatus.COMPLETED ||
                status.status === types_1.FilingStatus.APPROVED ||
                status.status === types_1.FilingStatus.REJECTED ||
                status.status === types_1.FilingStatus.FAILED) {
                return status;
            }
            // Report progress if callback provided
            if (options?.onProgress) {
                const progress = await this.getFilingProgress(filingId);
                options.onProgress(progress);
            }
            // Wait before next poll
            await this.sleep(pollInterval);
        }
        throw new Error(`Filing ${filingId} did not complete within timeout`);
    }
}
exports.FilingAgent = FilingAgent;
//# sourceMappingURL=FilingAgent.js.map