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
export declare enum FilingStatus {
    PENDING = "pending",
    SUBMITTED = "submitted",
    PROCESSING = "processing",
    APPROVED = "approved",
    REJECTED = "rejected",
    COMPLETED = "completed"
}
export interface FilingStatusUpdate {
    status: FilingStatus;
    message: string;
    timestamp: Date;
}
/**
 * Filing Agent for submitting documents to state authorities
 */
export declare class FilingAgent {
    private apiEndpoint;
    private statusUpdateCallbacks;
    constructor(apiEndpoint?: string);
    /**
     * Submit documents to state for filing
     * @param request Filing request with formation data and documents
     * @returns Filing result with confirmation details
     */
    submitFiling(request: FilingRequest): Promise<AgentResult<FilingResult>>;
    /**
     * Perform actual filing submission
     */
    private performFiling;
    /**
     * Generate filing number (state-specific format)
     */
    private generateFilingNumber;
    /**
     * Validate filing request
     */
    private validateFilingRequest;
    /**
     * Subscribe to status updates
     * @param callback Function to call with status updates
     */
    onStatusUpdate(callback: (update: FilingStatusUpdate) => void): void;
    /**
     * Emit status update to all subscribers
     */
    private emitStatusUpdate;
    /**
     * Check filing status (for async filing)
     * @param filingNumber Filing confirmation number
     * @returns Current status of filing
     */
    checkFilingStatus(filingNumber: string): Promise<{
        status: FilingStatus;
        details: string;
        updatedAt: Date;
    }>;
    /**
     * Get estimated processing time for state
     */
    getEstimatedProcessingTime(state: State, expedited?: boolean): string;
    /**
     * Cancel or withdraw filing (if supported by state)
     */
    cancelFiling(filingNumber: string): Promise<AgentResult<void>>;
}
//# sourceMappingURL=FilingAgent.d.ts.map