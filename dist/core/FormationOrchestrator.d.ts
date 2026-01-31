/**
 * Formation Orchestrator - Coordinates the entire company formation flow
 * Implements FR-013 through FR-033
 */
import { EventEmitter } from 'events';
import { FormationData, FormationStep, CompanyDetails, Shareholder, RegisteredAgent, PaymentInfo, State, NameCheckResult, FilingResult } from './types';
/**
 * Events emitted by the orchestrator
 */
export declare enum OrchestratorEvent {
    STEP_CHANGED = "step_changed",
    STATUS_CHANGED = "status_changed",
    NAME_CHECK_COMPLETE = "name_check_complete",
    PAYMENT_COMPLETE = "payment_complete",
    DOCUMENTS_GENERATED = "documents_generated",
    FILING_COMPLETE = "filing_complete",
    ERROR = "error",
    PROGRESS_UPDATE = "progress_update"
}
/**
 * Main orchestrator for company formation flow
 */
export declare class FormationOrchestrator extends EventEmitter {
    private stateMachine;
    private nameCheckAgent;
    private documentFillerAgent;
    private filingAgent;
    private formationData;
    constructor(sessionId?: string);
    /**
     * Generate unique session ID
     */
    private generateSessionId;
    /**
     * Get current formation data
     */
    getFormationData(): FormationData;
    /**
     * Get current step
     */
    getCurrentStep(): FormationStep;
    /**
     * Get progress percentage
     */
    getProgress(): number;
    /**
     * Check company name availability (FR-014, FR-015)
     * Runs asynchronously to keep user engaged
     */
    checkNameAvailability(name: string, state: State): Promise<NameCheckResult>;
    /**
     * Set company name (FR-013)
     */
    setCompanyName(name: string, state: State): Promise<void>;
    /**
     * Set company details (FR-013)
     */
    setCompanyDetails(details: Partial<CompanyDetails>): void;
    /**
     * Add shareholder (FR-013)
     */
    addShareholder(shareholder: Omit<Shareholder, 'id'>): void;
    /**
     * Update shareholder
     */
    updateShareholder(id: string, updates: Partial<Shareholder>): void;
    /**
     * Remove shareholder
     */
    removeShareholder(id: string): void;
    /**
     * Set registered agent (FR-013)
     */
    setRegisteredAgent(agent: RegisteredAgent): void;
    /**
     * Get summary for review (FR-016)
     */
    getSummary(): {
        company: CompanyDetails;
        shareholders: Shareholder[];
        registeredAgent: RegisteredAgent;
        costs: {
            stateFilingFee: number;
            serviceFee: number;
            total: number;
        };
    };
    /**
     * Calculate filing costs (FR-019)
     */
    private calculateCosts;
    /**
     * Process payment (FR-018, FR-020)
     */
    processPayment(paymentInfo: Omit<PaymentInfo, 'breakdown'>): Promise<void>;
    /**
     * Submit formation (generates documents and files)
     * Runs agents in parallel for efficiency
     */
    submitFormation(): Promise<FilingResult>;
    /**
     * Get next steps after formation (FR-033)
     */
    getNextSteps(): string[];
    /**
     * Navigate to specific step (FR-017)
     */
    goToStep(step: FormationStep): void;
    /**
     * Move to next step
     */
    nextStep(): void;
    /**
     * Move to previous step
     */
    previousStep(): void;
    /**
     * Handle filing status updates
     */
    private handleFilingStatusUpdate;
    /**
     * Update timestamp
     */
    private updateTimestamp;
    /**
     * Generate shareholder ID
     */
    private generateShareholderId;
    /**
     * Export formation data for persistence (FR-030)
     */
    exportData(): FormationData;
    /**
     * Import formation data (for resume functionality)
     */
    importData(data: FormationData): void;
    /**
     * Clear sensitive data (FR-029)
     */
    clearSensitiveData(): void;
}
//# sourceMappingURL=FormationOrchestrator.d.ts.map