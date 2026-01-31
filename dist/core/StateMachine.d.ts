/**
 * State machine for managing formation flow transitions
 */
import { FormationStep, FormationStatus, FormationData } from './types';
/**
 * State machine for formation flow
 */
export declare class FormationStateMachine {
    private data;
    constructor(data: FormationData);
    /**
     * Get current step
     */
    getCurrentStep(): FormationStep;
    /**
     * Get current status
     */
    getCurrentStatus(): FormationStatus;
    /**
     * Check if transition to target step is valid
     */
    canTransitionTo(targetStep: FormationStep): boolean;
    /**
     * Transition to next step
     */
    transitionTo(targetStep: FormationStep): void;
    /**
     * Move to next step in sequence
     */
    next(): void;
    /**
     * Move to previous step (for editing)
     */
    previous(): void;
    /**
     * Check if step is completed
     */
    isStepComplete(step: FormationStep): boolean;
    /**
     * Check if can proceed to next step
     */
    canProceed(): boolean;
    /**
     * Get progress percentage
     */
    getProgress(): number;
    /**
     * Get steps summary
     */
    getStepsSummary(): Array<{
        step: FormationStep;
        completed: boolean;
        current: boolean;
    }>;
    /**
     * Update formation status
     */
    updateStatus(status: FormationStatus): void;
    /**
     * Get formation data
     */
    getData(): FormationData;
}
//# sourceMappingURL=StateMachine.d.ts.map