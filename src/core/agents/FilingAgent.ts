/**
 * Filing Agent - Submits documents to state authorities
 * FR-023: CLI MUST communicate with Filing Agent to submit documents
 * FR-024: System MUST display real-time status updates from each agent
 */

import { FormationData, FilingResult, AgentResult, State } from '../types';

export interface FilingRequest {
  formationData: FormationData;
  documentUrls: string[];
  expedited?: boolean;
}

export enum FilingStatus {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  PROCESSING = 'processing',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed'
}

export interface FilingStatusUpdate {
  status: FilingStatus;
  message: string;
  timestamp: Date;
}

/**
 * Filing Agent for submitting documents to state authorities
 */
export class FilingAgent {
  private apiEndpoint: string;
  private statusUpdateCallbacks: ((update: FilingStatusUpdate) => void)[] = [];

  constructor(apiEndpoint: string = process.env.FILING_AGENT_API_URL || '') {
    this.apiEndpoint = apiEndpoint;
  }

  /**
   * Submit documents to state for filing
   * @param request Filing request with formation data and documents
   * @returns Filing result with confirmation details
   */
  async submitFiling(
    request: FilingRequest
  ): Promise<AgentResult<FilingResult>> {
    const startTime = Date.now();

    try {
      // Validate before submission
      const validation = this.validateFilingRequest(request);
      if (!validation.valid) {
        throw new Error(`Invalid filing request: ${validation.errors.join(', ')}`);
      }

      const result = await this.performFiling(request);
      const duration = Date.now() - startTime;

      return {
        success: result.success,
        data: result,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Filing submission failed',
        duration
      };
    }
  }

  /**
   * Perform actual filing submission
   */
  private async performFiling(
    request: FilingRequest
  ): Promise<FilingResult> {
    // Emit status updates during filing process
    this.emitStatusUpdate({
      status: FilingStatus.PENDING,
      message: 'Preparing documents for submission...',
      timestamp: new Date()
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    this.emitStatusUpdate({
      status: FilingStatus.SUBMITTED,
      message: 'Documents submitted to state...',
      timestamp: new Date()
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    this.emitStatusUpdate({
      status: FilingStatus.PROCESSING,
      message: 'State is processing your filing...',
      timestamp: new Date()
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    // TODO: Replace with actual API call to filing service
    // This is placeholder logic for development
    const { formationData } = request;
    const filingNumber = this.generateFilingNumber(
      formationData.companyDetails?.state || State.DE
    );

    this.emitStatusUpdate({
      status: FilingStatus.APPROVED,
      message: 'Filing approved by state!',
      timestamp: new Date()
    });

    const result: FilingResult = {
      success: true,
      filingNumber,
      filingDate: new Date(),
      confirmationUrl: `https://corp.delaware.gov/filing/${filingNumber}`,
      documentUrls: request.documentUrls
    };

    this.emitStatusUpdate({
      status: FilingStatus.COMPLETED,
      message: `Filing completed! Confirmation number: ${filingNumber}`,
      timestamp: new Date()
    });

    return result;
  }

  /**
   * Generate filing number (state-specific format)
   */
  private generateFilingNumber(state: State): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);

    switch (state) {
      case State.DE:
        return `DE${timestamp}${random}`;
      case State.CA:
        return `CA${timestamp}${random}`;
      default:
        return `${state}${timestamp}${random}`;
    }
  }

  /**
   * Validate filing request
   */
  private validateFilingRequest(request: FilingRequest): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!request.formationData.companyDetails) {
      errors.push('Company details required');
    }

    if (!request.formationData.payment?.transactionId) {
      errors.push('Payment must be completed before filing');
    }

    if (request.documentUrls.length === 0) {
      errors.push('At least one document required for filing');
    }

    if (!request.formationData.registeredAgent) {
      errors.push('Registered agent required for filing');
    }

    if (request.formationData.shareholders.length === 0) {
      errors.push('At least one shareholder/member required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Subscribe to status updates
   * @param callback Function to call with status updates
   */
  onStatusUpdate(callback: (update: FilingStatusUpdate) => void): void {
    this.statusUpdateCallbacks.push(callback);
  }

  /**
   * Emit status update to all subscribers
   */
  private emitStatusUpdate(update: FilingStatusUpdate): void {
    this.statusUpdateCallbacks.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error('Error in status update callback:', error);
      }
    });
  }

  /**
   * Check filing status (for async filing)
   * @param filingNumber Filing confirmation number
   * @returns Current status of filing
   */
  async checkFilingStatus(filingNumber: string): Promise<{
    status: FilingStatus;
    details: string;
    updatedAt: Date;
  }> {
    // TODO: Implement actual status check with state API
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      status: FilingStatus.COMPLETED,
      details: 'Your company has been successfully formed',
      updatedAt: new Date()
    };
  }

  /**
   * Get estimated processing time for state
   */
  getEstimatedProcessingTime(state: State, expedited: boolean = false): string {
    const standardTimes: Record<State, string> = {
      [State.DE]: '3-5 business days',
      [State.CA]: '7-10 business days',
      [State.TX]: '5-7 business days',
      [State.NY]: '10-14 business days',
      [State.FL]: '5-7 business days'
    };

    const expeditedTimes: Record<State, string> = {
      [State.DE]: '24 hours',
      [State.CA]: '2-3 business days',
      [State.TX]: '1-2 business days',
      [State.NY]: '3-5 business days',
      [State.FL]: '1-2 business days'
    };

    return expedited ? expeditedTimes[state] : standardTimes[state];
  }

  /**
   * Cancel or withdraw filing (if supported by state)
   */
  async cancelFiling(filingNumber: string): Promise<AgentResult<void>> {
    try {
      // TODO: Implement actual cancellation with state API
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Cancellation failed'
      };
    }
  }
}
