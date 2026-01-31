/**
 * Interactive prompts for company formation flow
 * Uses inquirer for conversational interface
 */
import { CompanyType, USState, Shareholder, RegisteredAgent } from '../types';
export declare class Prompts {
    /**
     * Company name prompt with validation
     */
    static companyName(): Promise<string>;
    /**
     * State selection prompt
     */
    static state(): Promise<USState>;
    /**
     * Company type selection
     */
    static companyType(): Promise<CompanyType>;
    /**
     * Number of shareholders/members
     */
    static numberOfShareholders(): Promise<number>;
    /**
     * Shareholder information
     */
    static shareholderInfo(index: number, totalCount: number): Promise<Shareholder>;
    /**
     * Registered agent information
     */
    static registeredAgent(): Promise<RegisteredAgent>;
    /**
     * Confirmation prompt
     */
    static confirmSummary(): Promise<boolean>;
    /**
     * Payment confirmation
     */
    static confirmPayment(total: number): Promise<boolean>;
    /**
     * Resume session prompt
     */
    static resumeSession(): Promise<boolean>;
    /**
     * Edit field selection
     */
    static selectFieldToEdit(fields: string[]): Promise<string>;
}
//# sourceMappingURL=prompts.d.ts.map