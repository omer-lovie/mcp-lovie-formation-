/**
 * Type definitions for Lovie CLI
 */
export interface CompanyFormationData {
    companyName: string;
    state: string;
    companyType: 'LLC' | 'C-Corp' | 'S-Corp';
    shareholders: Shareholder[];
    registeredAgent: RegisteredAgent;
}
export interface Shareholder {
    name: string;
    address: string;
    ownershipPercentage: number;
    ssn?: string;
    ein?: string;
}
export interface RegisteredAgent {
    name: string;
    address: string;
    contactInfo: {
        email: string;
        phone: string;
    };
}
export interface FormationSession {
    id: string;
    currentStep: number;
    data: Partial<CompanyFormationData>;
    status: 'in_progress' | 'completed' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
}
export interface ValidationResult {
    valid: boolean;
    message?: string;
}
export interface NameCheckResult {
    available: boolean;
    suggestions?: string[];
    message: string;
}
export interface FilingConfirmation {
    confirmationNumber: string;
    filingDate: Date;
    state: string;
    status: 'success' | 'pending' | 'failed';
    documents: string[];
    nextSteps: string[];
}
export type PromptStep = 'welcome' | 'company-name' | 'state-selection' | 'company-type' | 'shareholder-details' | 'registered-agent' | 'review-summary' | 'payment' | 'confirmation';
//# sourceMappingURL=index.d.ts.map