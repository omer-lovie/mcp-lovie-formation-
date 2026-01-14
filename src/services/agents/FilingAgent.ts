/**
 * Filing Agent Client (FR-023)
 * Handles document submission to state authorities
 */

import { BaseAgentClient } from './BaseAgentClient';
import {
  AgentClientConfig,
  AgentClientOptions,
  FilingRequest,
  FilingResponse,
  FilingProgress,
  FilingStatus,
  FilingFees,
} from './types';

export class FilingAgent extends BaseAgentClient {
  constructor(config: AgentClientConfig) {
    super('FilingAgent', config);
  }

  /**
   * Submit filing to state authority (FR-023)
   */
  async submitFiling(
    request: FilingRequest,
    options?: AgentClientOptions
  ): Promise<FilingResponse> {
    // Filing submission can take time, use longer timeout
    const filingOptions: AgentClientOptions = {
      ...options,
      timeout: options?.timeout || 60000, // 60s timeout
      idempotencyKey:
        options?.idempotencyKey || `filing-${request.sessionId}-${Date.now()}`,
    };

    return this.post<FilingResponse>(
      '/api/v1/filings/submit',
      request,
      filingOptions
    );
  }

  /**
   * Get filing status and progress
   */
  async getFilingStatus(
    filingId: string,
    options?: AgentClientOptions
  ): Promise<FilingResponse> {
    return this.get<FilingResponse>(`/api/v1/filings/${filingId}`, options);
  }

  /**
   * Get detailed filing progress with updates
   */
  async getFilingProgress(
    filingId: string,
    options?: AgentClientOptions
  ): Promise<FilingProgress> {
    return this.get<FilingProgress>(
      `/api/v1/filings/${filingId}/progress`,
      options
    );
  }

  /**
   * Calculate filing fees before submission
   */
  async calculateFees(
    state: string,
    companyType: 'LLC' | 'C-Corp' | 'S-Corp',
    expedited: boolean = false,
    options?: AgentClientOptions
  ): Promise<FilingFees> {
    return this.post<FilingFees>(
      '/api/v1/filings/calculate-fees',
      {
        state,
        companyType,
        expedited,
      },
      {
        ...options,
        skipRetry: true, // Fee calculation should be fast, no retry needed
      }
    );
  }

  /**
   * Get estimated completion time for filing
   */
  async getEstimatedCompletionTime(
    state: string,
    expedited: boolean = false,
    options?: AgentClientOptions
  ): Promise<{ estimatedDays: number; estimatedDate: string }> {
    return this.get<{ estimatedDays: number; estimatedDate: string }>(
      `/api/v1/filings/estimated-time?state=${state}&expedited=${expedited}`,
      options
    );
  }

  /**
   * Validate filing data before submission
   */
  async validateFilingData(
    request: FilingRequest,
    options?: AgentClientOptions
  ): Promise<{ valid: boolean; errors?: string[]; warnings?: string[] }> {
    return this.post<{
      valid: boolean;
      errors?: string[];
      warnings?: string[];
    }>(
      '/api/v1/filings/validate',
      request,
      {
        ...options,
        skipRetry: true, // No retry for validation
      }
    );
  }

  /**
   * Get all filings for a session
   */
  async getSessionFilings(
    sessionId: string,
    options?: AgentClientOptions
  ): Promise<FilingResponse[]> {
    return this.get<FilingResponse[]>(
      `/api/v1/filings/session/${sessionId}`,
      options
    );
  }

  /**
   * Download filed document (stamped/certified copy)
   */
  async downloadFiledDocument(
    filingId: string,
    documentType: string,
    options?: AgentClientOptions
  ): Promise<Buffer> {
    const response = await this.client.get(
      `/api/v1/filings/${filingId}/documents/${documentType}`,
      {
        responseType: 'arraybuffer',
        signal: options?.signal,
        timeout: options?.timeout,
      }
    );

    return Buffer.from(response.data);
  }

  /**
   * Get tracking information for physical mail delivery (if applicable)
   */
  async getTrackingInfo(
    filingId: string,
    options?: AgentClientOptions
  ): Promise<{
    trackingNumber?: string;
    carrier?: string;
    status?: string;
    estimatedDelivery?: string;
  }> {
    return this.get<{
      trackingNumber?: string;
      carrier?: string;
      status?: string;
      estimatedDelivery?: string;
    }>(`/api/v1/filings/${filingId}/tracking`, options);
  }

  /**
   * Request certified copies of filed documents
   */
  async requestCertifiedCopies(
    filingId: string,
    quantity: number,
    deliveryAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    },
    options?: AgentClientOptions
  ): Promise<{
    requestId: string;
    cost: number;
    estimatedDelivery: string;
  }> {
    return this.post<{
      requestId: string;
      cost: number;
      estimatedDelivery: string;
    }>(
      `/api/v1/filings/${filingId}/certified-copies`,
      {
        quantity,
        deliveryAddress,
      },
      options
    );
  }

  /**
   * Request good standing certificate
   */
  async requestGoodStandingCertificate(
    filingId: string,
    options?: AgentClientOptions
  ): Promise<{
    requestId: string;
    cost: number;
    estimatedCompletion: string;
  }> {
    return this.post<{
      requestId: string;
      cost: number;
      estimatedCompletion: string;
    }>(`/api/v1/filings/${filingId}/good-standing`, {}, options);
  }

  /**
   * Cancel filing (only if still in pending status)
   */
  async cancelFiling(
    filingId: string,
    reason?: string,
    options?: AgentClientOptions
  ): Promise<void> {
    await this.post<void>(
      `/api/v1/filings/${filingId}/cancel`,
      { reason },
      options
    );
  }

  /**
   * Retry failed filing
   */
  async retryFiling(
    filingId: string,
    options?: AgentClientOptions
  ): Promise<FilingResponse> {
    return this.post<FilingResponse>(
      `/api/v1/filings/${filingId}/retry`,
      {},
      options
    );
  }

  /**
   * Get state-specific filing requirements
   */
  async getStateRequirements(
    state: string,
    companyType: 'LLC' | 'C-Corp' | 'S-Corp',
    options?: AgentClientOptions
  ): Promise<{
    requiredDocuments: string[];
    requiredFields: string[];
    specialRequirements?: string[];
    processingTime: string;
  }> {
    return this.get<{
      requiredDocuments: string[];
      requiredFields: string[];
      specialRequirements?: string[];
      processingTime: string;
    }>(
      `/api/v1/filings/requirements?state=${state}&type=${companyType}`,
      options
    );
  }

  /**
   * Check if filing is complete and approved
   */
  async isFilingComplete(
    filingId: string,
    options?: AgentClientOptions
  ): Promise<boolean> {
    const status = await this.getFilingStatus(filingId, options);

    return (
      status.status === FilingStatus.COMPLETED ||
      status.status === FilingStatus.APPROVED
    );
  }

  /**
   * Poll filing status until complete or failed
   */
  async waitForCompletion(
    filingId: string,
    options?: {
      maxWaitTimeMs?: number; // Default: 5 minutes
      pollIntervalMs?: number; // Default: 5 seconds
      onProgress?: (progress: FilingProgress) => void;
    }
  ): Promise<FilingResponse> {
    const maxWaitTime = options?.maxWaitTimeMs || 5 * 60 * 1000; // 5 minutes
    const pollInterval = options?.pollIntervalMs || 5000; // 5 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const status = await this.getFilingStatus(filingId);

      // Terminal states
      if (
        status.status === FilingStatus.COMPLETED ||
        status.status === FilingStatus.APPROVED ||
        status.status === FilingStatus.REJECTED ||
        status.status === FilingStatus.FAILED
      ) {
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
