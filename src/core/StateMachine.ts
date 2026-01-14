/**
 * State machine for managing formation flow transitions
 */

import { FormationStep, FormationStatus, FormationData } from './types';

/**
 * Valid state transitions in the formation flow
 */
const VALID_TRANSITIONS: Record<FormationStep, FormationStep[]> = {
  [FormationStep.NAME]: [FormationStep.COMPANY_DETAILS],
  [FormationStep.COMPANY_DETAILS]: [FormationStep.NAME, FormationStep.SHAREHOLDERS],
  [FormationStep.SHAREHOLDERS]: [FormationStep.COMPANY_DETAILS, FormationStep.REGISTERED_AGENT],
  [FormationStep.REGISTERED_AGENT]: [FormationStep.SHAREHOLDERS, FormationStep.REVIEW],
  [FormationStep.REVIEW]: [
    FormationStep.NAME,
    FormationStep.COMPANY_DETAILS,
    FormationStep.SHAREHOLDERS,
    FormationStep.REGISTERED_AGENT,
    FormationStep.PAYMENT
  ],
  [FormationStep.PAYMENT]: [FormationStep.REVIEW, FormationStep.FILING],
  [FormationStep.FILING]: [FormationStep.CONFIRMATION],
  [FormationStep.CONFIRMATION]: []
};

/**
 * Status transitions based on step completion
 */
const STEP_TO_STATUS: Record<FormationStep, FormationStatus> = {
  [FormationStep.NAME]: FormationStatus.IN_PROGRESS,
  [FormationStep.COMPANY_DETAILS]: FormationStatus.IN_PROGRESS,
  [FormationStep.SHAREHOLDERS]: FormationStatus.IN_PROGRESS,
  [FormationStep.REGISTERED_AGENT]: FormationStatus.IN_PROGRESS,
  [FormationStep.REVIEW]: FormationStatus.IN_PROGRESS,
  [FormationStep.PAYMENT]: FormationStatus.PAYMENT_PENDING,
  [FormationStep.FILING]: FormationStatus.FILING_IN_PROGRESS,
  [FormationStep.CONFIRMATION]: FormationStatus.COMPLETED
};

/**
 * State machine for formation flow
 */
export class FormationStateMachine {
  private data: FormationData;

  constructor(data: FormationData) {
    this.data = data;
  }

  /**
   * Get current step
   */
  getCurrentStep(): FormationStep {
    return this.data.currentStep;
  }

  /**
   * Get current status
   */
  getCurrentStatus(): FormationStatus {
    return this.data.status;
  }

  /**
   * Check if transition to target step is valid
   */
  canTransitionTo(targetStep: FormationStep): boolean {
    const validNextSteps = VALID_TRANSITIONS[this.data.currentStep];
    return validNextSteps.includes(targetStep);
  }

  /**
   * Transition to next step
   */
  transitionTo(targetStep: FormationStep): void {
    if (!this.canTransitionTo(targetStep)) {
      throw new Error(
        `Invalid transition from ${this.data.currentStep} to ${targetStep}`
      );
    }

    this.data.currentStep = targetStep;
    this.data.status = STEP_TO_STATUS[targetStep];
    this.data.updatedAt = new Date();
  }

  /**
   * Move to next step in sequence
   */
  next(): void {
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
  previous(): void {
    const currentIndex = Object.values(FormationStep).indexOf(this.data.currentStep);
    if (currentIndex <= 0) {
      throw new Error('Cannot go back from first step');
    }

    const previousStep = Object.values(FormationStep)[currentIndex - 1];
    if (!this.canTransitionTo(previousStep)) {
      throw new Error(`Cannot transition back to ${previousStep}`);
    }

    this.transitionTo(previousStep);
  }

  /**
   * Check if step is completed
   */
  isStepComplete(step: FormationStep): boolean {
    switch (step) {
      case FormationStep.NAME:
        return !!this.data.companyDetails?.name;
      case FormationStep.COMPANY_DETAILS:
        return !!(
          this.data.companyDetails?.name &&
          this.data.companyDetails?.state &&
          this.data.companyDetails?.type
        );
      case FormationStep.SHAREHOLDERS:
        return this.data.shareholders.length > 0;
      case FormationStep.REGISTERED_AGENT:
        return !!this.data.registeredAgent;
      case FormationStep.REVIEW:
        return this.isStepComplete(FormationStep.REGISTERED_AGENT);
      case FormationStep.PAYMENT:
        return !!this.data.payment?.transactionId;
      case FormationStep.FILING:
        return !!this.data.filing?.success;
      case FormationStep.CONFIRMATION:
        return this.data.status === FormationStatus.COMPLETED;
      default:
        return false;
    }
  }

  /**
   * Check if can proceed to next step
   */
  canProceed(): boolean {
    return this.isStepComplete(this.data.currentStep);
  }

  /**
   * Get progress percentage
   */
  getProgress(): number {
    const steps = Object.values(FormationStep);
    const currentIndex = steps.indexOf(this.data.currentStep);
    return Math.round(((currentIndex + 1) / steps.length) * 100);
  }

  /**
   * Get steps summary
   */
  getStepsSummary(): Array<{
    step: FormationStep;
    completed: boolean;
    current: boolean;
  }> {
    const steps = Object.values(FormationStep);
    return steps.map(step => ({
      step,
      completed: this.isStepComplete(step),
      current: step === this.data.currentStep
    }));
  }

  /**
   * Update formation status
   */
  updateStatus(status: FormationStatus): void {
    this.data.status = status;
    this.data.updatedAt = new Date();
  }

  /**
   * Get formation data
   */
  getData(): FormationData {
    return { ...this.data };
  }
}
