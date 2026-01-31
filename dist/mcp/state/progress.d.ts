import { FormationStep, FormationSession } from './types';
export interface StepInfo {
    step: FormationStep;
    name: string;
    description: string;
    tool: string;
}
export declare const STEP_INFO: StepInfo[];
export declare function getStepInfo(step: FormationStep): StepInfo | undefined;
export declare function getStepsForCompanyType(companyType?: string): FormationStep[];
export interface ProgressInfo {
    currentStep: FormationStep;
    currentStepInfo: StepInfo | undefined;
    completedSteps: StepInfo[];
    remainingSteps: StepInfo[];
    percentComplete: number;
    totalSteps: number;
    completedCount: number;
    remainingCount: number;
}
export declare function calculateDetailedProgress(session: FormationSession): ProgressInfo;
export declare function getStepGuidance(step: FormationStep, companyType?: string): string;
//# sourceMappingURL=progress.d.ts.map