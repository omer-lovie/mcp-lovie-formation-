"use strict";
/**
 * Formation Orchestrator - Coordinates the entire company formation flow
 * Implements FR-013 through FR-033
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormationOrchestrator = exports.OrchestratorEvent = void 0;
const events_1 = require("events");
const types_1 = require("./types");
const StateMachine_1 = require("./StateMachine");
const NameCheckAgent_1 = require("./agents/NameCheckAgent");
const DocumentFillerAgent_1 = require("./agents/DocumentFillerAgent");
const FilingAgent_1 = require("./agents/FilingAgent");
/**
 * Events emitted by the orchestrator
 */
var OrchestratorEvent;
(function (OrchestratorEvent) {
    OrchestratorEvent["STEP_CHANGED"] = "step_changed";
    OrchestratorEvent["STATUS_CHANGED"] = "status_changed";
    OrchestratorEvent["NAME_CHECK_COMPLETE"] = "name_check_complete";
    OrchestratorEvent["PAYMENT_COMPLETE"] = "payment_complete";
    OrchestratorEvent["DOCUMENTS_GENERATED"] = "documents_generated";
    OrchestratorEvent["FILING_COMPLETE"] = "filing_complete";
    OrchestratorEvent["ERROR"] = "error";
    OrchestratorEvent["PROGRESS_UPDATE"] = "progress_update";
})(OrchestratorEvent || (exports.OrchestratorEvent = OrchestratorEvent = {}));
/**
 * Main orchestrator for company formation flow
 */
class FormationOrchestrator extends events_1.EventEmitter {
    constructor(sessionId) {
        super();
        // Initialize formation data
        this.formationData = {
            sessionId: sessionId || this.generateSessionId(),
            currentStep: types_1.FormationStep.NAME,
            status: types_1.FormationStatus.INITIATED,
            createdAt: new Date(),
            updatedAt: new Date(),
            shareholders: []
        };
        // Initialize state machine
        this.stateMachine = new StateMachine_1.FormationStateMachine(this.formationData);
        // Initialize agents
        this.nameCheckAgent = new NameCheckAgent_1.NameCheckAgent();
        this.documentFillerAgent = new DocumentFillerAgent_1.DocumentFillerAgent();
        this.filingAgent = new FilingAgent_1.FilingAgent();
        // Subscribe to filing status updates
        this.filingAgent.onStatusUpdate(this.handleFilingStatusUpdate.bind(this));
    }
    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return `formation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Get current formation data
     */
    getFormationData() {
        return { ...this.formationData };
    }
    /**
     * Get current step
     */
    getCurrentStep() {
        return this.stateMachine.getCurrentStep();
    }
    /**
     * Get progress percentage
     */
    getProgress() {
        return this.stateMachine.getProgress();
    }
    /**
     * Check company name availability (FR-014, FR-015)
     * Runs asynchronously to keep user engaged
     */
    async checkNameAvailability(name, state) {
        try {
            // Validate name format first
            const validation = this.nameCheckAgent.validateNameFormat(name, this.formationData.companyDetails?.type || 'llc');
            if (!validation.valid) {
                throw new Error(validation.errors.join(', '));
            }
            // Check availability with agent (async, non-blocking)
            const result = await this.nameCheckAgent.checkAvailability({
                name,
                state
            });
            if (!result.success || !result.data) {
                throw new Error(result.error || 'Name check failed');
            }
            this.emit(OrchestratorEvent.NAME_CHECK_COMPLETE, result.data);
            return result.data;
        }
        catch (error) {
            this.emit(OrchestratorEvent.ERROR, {
                step: types_1.FormationStep.NAME,
                error: error instanceof Error ? error.message : 'Name check failed'
            });
            throw error;
        }
    }
    /**
     * Set company name (FR-013)
     */
    async setCompanyName(name, state) {
        // Check name availability
        const nameCheck = await this.checkNameAvailability(name, state);
        if (!nameCheck.available) {
            throw new Error(nameCheck.reason || 'Company name is not available');
        }
        // Initialize company details if not exists
        if (!this.formationData.companyDetails) {
            this.formationData.companyDetails = {
                name,
                state,
                type: types_1.CompanyType.LLC // Default, will be set later
            };
        }
        else {
            this.formationData.companyDetails.name = name;
            this.formationData.companyDetails.state = state;
        }
        this.updateTimestamp();
    }
    /**
     * Set company details (FR-013)
     */
    setCompanyDetails(details) {
        this.formationData.companyDetails = {
            ...this.formationData.companyDetails,
            ...details
        };
        this.updateTimestamp();
    }
    /**
     * Add shareholder (FR-013)
     */
    addShareholder(shareholder) {
        const shareholderWithId = {
            ...shareholder,
            id: this.generateShareholderId()
        };
        this.formationData.shareholders.push(shareholderWithId);
        this.updateTimestamp();
    }
    /**
     * Update shareholder
     */
    updateShareholder(id, updates) {
        const index = this.formationData.shareholders.findIndex(sh => sh.id === id);
        if (index === -1) {
            throw new Error('Shareholder not found');
        }
        this.formationData.shareholders[index] = {
            ...this.formationData.shareholders[index],
            ...updates
        };
        this.updateTimestamp();
    }
    /**
     * Remove shareholder
     */
    removeShareholder(id) {
        this.formationData.shareholders = this.formationData.shareholders.filter(sh => sh.id !== id);
        this.updateTimestamp();
    }
    /**
     * Set registered agent (FR-013)
     */
    setRegisteredAgent(agent) {
        this.formationData.registeredAgent = agent;
        this.updateTimestamp();
    }
    /**
     * Get summary for review (FR-016)
     */
    getSummary() {
        if (!this.formationData.companyDetails) {
            throw new Error('Company details not set');
        }
        if (!this.formationData.registeredAgent) {
            throw new Error('Registered agent not set');
        }
        const costs = this.calculateCosts();
        return {
            company: this.formationData.companyDetails,
            shareholders: this.formationData.shareholders,
            registeredAgent: this.formationData.registeredAgent,
            costs
        };
    }
    /**
     * Calculate filing costs (FR-019)
     */
    calculateCosts() {
        const state = this.formationData.companyDetails?.state;
        const type = this.formationData.companyDetails?.type;
        // State filing fees (2024 rates)
        const stateFilingFees = {
            [types_1.State.DE]: 90,
            [types_1.State.CA]: 70,
            [types_1.State.TX]: 300,
            [types_1.State.NY]: 200,
            [types_1.State.FL]: 125
        };
        const stateFilingFee = state ? stateFilingFees[state] : 0;
        const serviceFee = 99; // Lovie service fee
        return {
            stateFilingFee,
            serviceFee,
            total: stateFilingFee + serviceFee
        };
    }
    /**
     * Process payment (FR-018, FR-020)
     */
    async processPayment(paymentInfo) {
        try {
            const costs = this.calculateCosts();
            // Validate payment amount
            if (paymentInfo.amount !== costs.total) {
                throw new Error(`Payment amount mismatch. Expected ${costs.total}`);
            }
            // TODO: Integrate with actual payment processor (Stripe)
            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 2000));
            const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            this.formationData.payment = {
                ...paymentInfo,
                breakdown: costs,
                transactionId,
                processedAt: new Date()
            };
            this.stateMachine.updateStatus(types_1.FormationStatus.PAYMENT_COMPLETE);
            this.emit(OrchestratorEvent.PAYMENT_COMPLETE, this.formationData.payment);
            this.updateTimestamp();
        }
        catch (error) {
            this.emit(OrchestratorEvent.ERROR, {
                step: types_1.FormationStep.PAYMENT,
                error: error instanceof Error ? error.message : 'Payment processing failed'
            });
            throw error;
        }
    }
    /**
     * Submit formation (generates documents and files)
     * Runs agents in parallel for efficiency
     */
    async submitFormation() {
        try {
            // Verify payment completed
            if (!this.formationData.payment?.transactionId) {
                throw new Error('Payment must be completed before filing');
            }
            // Validate data completeness
            const validation = this.documentFillerAgent.validateDataCompleteness(this.formationData);
            if (!validation.valid) {
                throw new Error(`Missing required data: ${validation.missingFields.join(', ')}`);
            }
            this.stateMachine.updateStatus(types_1.FormationStatus.FILING_IN_PROGRESS);
            // Generate documents (async)
            this.emit(OrchestratorEvent.PROGRESS_UPDATE, {
                message: 'Generating incorporation documents...'
            });
            const docResult = await this.documentFillerAgent.generateDocuments({
                formationData: this.formationData
            });
            if (!docResult.success || !docResult.data) {
                throw new Error(docResult.error || 'Document generation failed');
            }
            this.emit(OrchestratorEvent.DOCUMENTS_GENERATED, docResult.data);
            // Submit filing (async with status updates)
            this.emit(OrchestratorEvent.PROGRESS_UPDATE, {
                message: 'Submitting documents to state...'
            });
            const filingResult = await this.filingAgent.submitFiling({
                formationData: this.formationData,
                documentUrls: docResult.data.documents.map(d => d.url)
            });
            if (!filingResult.success || !filingResult.data) {
                throw new Error(filingResult.error || 'Filing submission failed');
            }
            this.formationData.filing = filingResult.data;
            this.stateMachine.updateStatus(types_1.FormationStatus.COMPLETED);
            this.emit(OrchestratorEvent.FILING_COMPLETE, filingResult.data);
            this.updateTimestamp();
            return filingResult.data;
        }
        catch (error) {
            this.stateMachine.updateStatus(types_1.FormationStatus.FAILED);
            this.emit(OrchestratorEvent.ERROR, {
                step: types_1.FormationStep.FILING,
                error: error instanceof Error ? error.message : 'Formation filing failed'
            });
            throw error;
        }
    }
    /**
     * Get next steps after formation (FR-033)
     */
    getNextSteps() {
        const steps = [
            '1. Apply for EIN (Employer Identification Number) from the IRS',
            '2. Set up registered agent service if not already done',
            '3. Open a business bank account',
            '4. File for necessary business licenses and permits',
            '5. Set up accounting and bookkeeping systems'
        ];
        const state = this.formationData.companyDetails?.state;
        if (state === types_1.State.NY) {
            steps.push('6. Complete publication requirement (NY specific)');
        }
        const type = this.formationData.companyDetails?.type;
        if (type === types_1.CompanyType.S_CORP) {
            steps.push('7. File Form 2553 with IRS within 2 months and 15 days');
        }
        return steps;
    }
    /**
     * Navigate to specific step (FR-017)
     */
    goToStep(step) {
        if (!this.stateMachine.canTransitionTo(step)) {
            throw new Error(`Cannot transition to step: ${step}`);
        }
        this.stateMachine.transitionTo(step);
        this.emit(OrchestratorEvent.STEP_CHANGED, step);
    }
    /**
     * Move to next step
     */
    nextStep() {
        if (!this.stateMachine.canProceed()) {
            throw new Error('Current step is not complete');
        }
        this.stateMachine.next();
        this.emit(OrchestratorEvent.STEP_CHANGED, this.stateMachine.getCurrentStep());
    }
    /**
     * Move to previous step
     */
    previousStep() {
        this.stateMachine.previous();
        this.emit(OrchestratorEvent.STEP_CHANGED, this.stateMachine.getCurrentStep());
    }
    /**
     * Handle filing status updates
     */
    handleFilingStatusUpdate(update) {
        this.emit(OrchestratorEvent.PROGRESS_UPDATE, {
            message: update.message,
            status: update.status
        });
    }
    /**
     * Update timestamp
     */
    updateTimestamp() {
        this.formationData.updatedAt = new Date();
    }
    /**
     * Generate shareholder ID
     */
    generateShareholderId() {
        return `sh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Export formation data for persistence (FR-030)
     */
    exportData() {
        return { ...this.formationData };
    }
    /**
     * Import formation data (for resume functionality)
     */
    importData(data) {
        this.formationData = data;
        this.stateMachine = new StateMachine_1.FormationStateMachine(this.formationData);
    }
    /**
     * Clear sensitive data (FR-029)
     */
    clearSensitiveData() {
        // Clear payment info
        if (this.formationData.payment) {
            delete this.formationData.payment;
        }
        // Clear SSNs
        this.formationData.shareholders.forEach(sh => {
            delete sh.ssn;
            delete sh.ein;
        });
    }
}
exports.FormationOrchestrator = FormationOrchestrator;
//# sourceMappingURL=FormationOrchestrator.js.map