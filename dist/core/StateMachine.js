"use strict";
/**
 * State machine for managing formation flow transitions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormationStateMachine = void 0;
const types_1 = require("./types");
/**
 * Valid state transitions in the formation flow
 */
const VALID_TRANSITIONS = {
    [types_1.FormationStep.NAME]: [types_1.FormationStep.COMPANY_DETAILS],
    [types_1.FormationStep.COMPANY_DETAILS]: [types_1.FormationStep.NAME, types_1.FormationStep.SHAREHOLDERS],
    [types_1.FormationStep.SHAREHOLDERS]: [types_1.FormationStep.COMPANY_DETAILS, types_1.FormationStep.REGISTERED_AGENT],
    [types_1.FormationStep.REGISTERED_AGENT]: [types_1.FormationStep.SHAREHOLDERS, types_1.FormationStep.REVIEW],
    [types_1.FormationStep.REVIEW]: [
        types_1.FormationStep.NAME,
        types_1.FormationStep.COMPANY_DETAILS,
        types_1.FormationStep.SHAREHOLDERS,
        types_1.FormationStep.REGISTERED_AGENT,
        types_1.FormationStep.PAYMENT
    ],
    [types_1.FormationStep.PAYMENT]: [types_1.FormationStep.REVIEW, types_1.FormationStep.FILING],
    [types_1.FormationStep.FILING]: [types_1.FormationStep.CONFIRMATION],
    [types_1.FormationStep.CONFIRMATION]: []
};
/**
 * Status transitions based on step completion
 */
const STEP_TO_STATUS = {
    [types_1.FormationStep.NAME]: types_1.FormationStatus.IN_PROGRESS,
    [types_1.FormationStep.COMPANY_DETAILS]: types_1.FormationStatus.IN_PROGRESS,
    [types_1.FormationStep.SHAREHOLDERS]: types_1.FormationStatus.IN_PROGRESS,
    [types_1.FormationStep.REGISTERED_AGENT]: types_1.FormationStatus.IN_PROGRESS,
    [types_1.FormationStep.REVIEW]: types_1.FormationStatus.IN_PROGRESS,
    [types_1.FormationStep.PAYMENT]: types_1.FormationStatus.PAYMENT_PENDING,
    [types_1.FormationStep.FILING]: types_1.FormationStatus.FILING_IN_PROGRESS,
    [types_1.FormationStep.CONFIRMATION]: types_1.FormationStatus.COMPLETED
};
/**
 * State machine for formation flow
 */
class FormationStateMachine {
    constructor(data) {
        this.data = data;
    }
    /**
     * Get current step
     */
    getCurrentStep() {
        return this.data.currentStep;
    }
    /**
     * Get current status
     */
    getCurrentStatus() {
        return this.data.status;
    }
    /**
     * Check if transition to target step is valid
     */
    canTransitionTo(targetStep) {
        const validNextSteps = VALID_TRANSITIONS[this.data.currentStep];
        return validNextSteps.includes(targetStep);
    }
    /**
     * Transition to next step
     */
    transitionTo(targetStep) {
        if (!this.canTransitionTo(targetStep)) {
            throw new Error(`Invalid transition from ${this.data.currentStep} to ${targetStep}`);
        }
        this.data.currentStep = targetStep;
        this.data.status = STEP_TO_STATUS[targetStep];
        this.data.updatedAt = new Date();
    }
    /**
     * Move to next step in sequence
     */
    next() {
        const validNextSteps = VALID_TRANSITIONS[this.data.currentStep];
        if (validNextSteps.length === 0) {
            throw new Error('No valid next step from current state');
        }
        // Take first valid next step (forward progression)
        const nextStep = validNextSteps[validNextSteps.length - 1];
        this.transitionTo(nextStep);
    }
    /**
     * Move to previous step (for editing)
     */
    previous() {
        const currentIndex = Object.values(types_1.FormationStep).indexOf(this.data.currentStep);
        if (currentIndex <= 0) {
            throw new Error('Cannot go back from first step');
        }
        const previousStep = Object.values(types_1.FormationStep)[currentIndex - 1];
        if (!this.canTransitionTo(previousStep)) {
            throw new Error(`Cannot transition back to ${previousStep}`);
        }
        this.transitionTo(previousStep);
    }
    /**
     * Check if step is completed
     */
    isStepComplete(step) {
        switch (step) {
            case types_1.FormationStep.NAME:
                return !!this.data.companyDetails?.name;
            case types_1.FormationStep.COMPANY_DETAILS:
                return !!(this.data.companyDetails?.name &&
                    this.data.companyDetails?.state &&
                    this.data.companyDetails?.type);
            case types_1.FormationStep.SHAREHOLDERS:
                return this.data.shareholders.length > 0;
            case types_1.FormationStep.REGISTERED_AGENT:
                return !!this.data.registeredAgent;
            case types_1.FormationStep.REVIEW:
                return this.isStepComplete(types_1.FormationStep.REGISTERED_AGENT);
            case types_1.FormationStep.PAYMENT:
                return !!this.data.payment?.transactionId;
            case types_1.FormationStep.FILING:
                return !!this.data.filing?.success;
            case types_1.FormationStep.CONFIRMATION:
                return this.data.status === types_1.FormationStatus.COMPLETED;
            default:
                return false;
        }
    }
    /**
     * Check if can proceed to next step
     */
    canProceed() {
        return this.isStepComplete(this.data.currentStep);
    }
    /**
     * Get progress percentage
     */
    getProgress() {
        const steps = Object.values(types_1.FormationStep);
        const currentIndex = steps.indexOf(this.data.currentStep);
        return Math.round(((currentIndex + 1) / steps.length) * 100);
    }
    /**
     * Get steps summary
     */
    getStepsSummary() {
        const steps = Object.values(types_1.FormationStep);
        return steps.map(step => ({
            step,
            completed: this.isStepComplete(step),
            current: step === this.data.currentStep
        }));
    }
    /**
     * Update formation status
     */
    updateStatus(status) {
        this.data.status = status;
        this.data.updatedAt = new Date();
    }
    /**
     * Get formation data
     */
    getData() {
        return { ...this.data };
    }
}
exports.FormationStateMachine = FormationStateMachine;
//# sourceMappingURL=StateMachine.js.map