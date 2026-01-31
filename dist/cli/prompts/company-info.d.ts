/**
 * Company information prompts
 * FR-006: Conversational, interactive prompts
 * FR-007: Plain language explanations
 * FR-008: Real-time validation
 * FR-010: Keyboard navigation
 */
export interface CompanyInfoResult {
    companyName: string;
    state: string;
    companyType: 'LLC' | 'C-Corp' | 'S-Corp';
}
/**
 * Collect company name
 */
export declare function askCompanyName(currentStep: number, totalSteps: number): Promise<string>;
/**
 * Collect state of incorporation
 */
export declare function askState(currentStep: number, totalSteps: number): Promise<string>;
/**
 * Collect company type
 */
export declare function askCompanyType(currentStep: number, totalSteps: number): Promise<'LLC' | 'C-Corp' | 'S-Corp'>;
/**
 * Collect all company information
 */
export declare function collectCompanyInfo(): Promise<CompanyInfoResult>;
//# sourceMappingURL=company-info.d.ts.map