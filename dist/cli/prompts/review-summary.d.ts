/**
 * Review and summary prompts
 * FR-012: Allow users to go back and edit
 * FR-016: Display summary before payment
 * FR-017: Allow editing any field
 */
import { CompanyFormationData } from '../types';
export type EditField = 'company-name' | 'state' | 'company-type' | 'shareholders' | 'registered-agent' | 'none';
/**
 * Display summary of all collected information
 */
export declare function displaySummary(data: CompanyFormationData): void;
/**
 * Ask user to review and confirm or edit
 */
export declare function reviewAndConfirm(data: CompanyFormationData, currentStep: number, totalSteps: number): Promise<{
    confirmed: boolean;
    editField?: EditField;
}>;
//# sourceMappingURL=review-summary.d.ts.map